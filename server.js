const express = require('express');
const cors = require('cors');
const { CacheManager } = require('./cache');
const {
  OFFICIAL_SOURCE,
  MINISTRY_URL,
  getOfficialCities,
  scrapeRouteData,
} = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3001;
const cache = new CacheManager();

app.use(cors());
app.use(express.json());

function ts() {
  return new Date().toLocaleString('tr-TR');
}

function clean(value) {
  return String(value || '').trim();
}

function routeKey({ from, to, fromDistrict = '', toDistrict = '' }) {
  return [
    clean(from),
    clean(fromDistrict) || 'IL_MERKEZI',
    clean(to),
    clean(toDistrict) || 'IL_MERKEZI',
  ].join('|');
}

function officialUnavailable(res, error) {
  console.warn(`[${ts()}] Resmi veri alınamadı: ${error.message}`);
  return res.status(503).json({
    officialDataAvailable: false,
    message: 'Resmi veri şu anda alınamadı.',
    error: error.message,
    source: OFFICIAL_SOURCE,
    sourceUrl: MINISTRY_URL,
    lastUpdated: new Date().toLocaleString('tr-TR'),
  });
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Yol Güvenlik Asistanı - Resmi Veri Cache',
    cache: cache.getStats(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/cities', async (req, res) => {
  try {
    const cities = await getOfficialCities();
    res.json({ cities });
  } catch (error) {
    officialUnavailable(res, error);
  }
});

app.get('/api/route-safety', async (req, res) => {
  const from = clean(req.query.from);
  const to = clean(req.query.to);
  const fromDistrict = clean(req.query.fromDistrict);
  const toDistrict = clean(req.query.toDistrict);

  if (!from || !to) {
    return res.status(400).json({
      officialDataAvailable: false,
      message: 'Kalkış (from) ve varış (to) şehirleri gereklidir.',
    });
  }

  if (from === to && fromDistrict === toDistrict) {
    return res.status(400).json({
      officialDataAvailable: false,
      message: 'Kalkış ve varış noktası aynı olamaz.',
    });
  }

  const key = routeKey({ from, to, fromDistrict, toDistrict });
  const cached = cache.get(key);

  if (cached) {
    console.log(`[${ts()}] Cache: ${key}`);
    return res.json(cached);
  }

  try {
    console.log(`[${ts()}] Resmi sorgu: ${key}`);
    const data = await scrapeRouteData(null, null, from, to, fromDistrict, toDistrict);
    cache.set(key, data);

    return res.json({
      ...data,
      isCached: false,
      isExpired: false,
      cacheAge: 0,
      nextRefreshAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    return officialUnavailable(res, error);
  }
});

app.get('/api/cache/status', (req, res) => {
  res.json(cache.getStats());
});

app.post('/api/cache/refresh', async (req, res) => {
  const from = clean(req.body?.from || req.query.from);
  const to = clean(req.body?.to || req.query.to);
  const fromDistrict = clean(req.body?.fromDistrict || req.query.fromDistrict);
  const toDistrict = clean(req.body?.toDistrict || req.query.toDistrict);

  if (!from || !to) {
    return res.status(400).json({
      officialDataAvailable: false,
      message: 'Manuel yenileme için from ve to alanları gereklidir.',
    });
  }

  try {
    const key = routeKey({ from, to, fromDistrict, toDistrict });
    const data = await scrapeRouteData(null, null, from, to, fromDistrict, toDistrict);
    cache.set(key, data);
    res.json({ message: `${key} güncellendi`, data: cache.get(key) });
  } catch (error) {
    officialUnavailable(res, error);
  }
});

app.delete('/api/cache', (req, res) => {
  cache.clear();
  res.json({ message: 'Önbellek temizlendi' });
});

app.listen(PORT, () => {
  console.log(`Yol Güvenlik Asistanı backend: http://localhost:${PORT}`);
  console.log(`Kaynak: ${MINISTRY_URL}`);
  cache.loadFromFile();
});
