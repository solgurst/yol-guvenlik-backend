const fs = require('fs');
const path = require('path');
const { OFFICIAL_SOURCE } = require('./scraper');

const CACHE_FILE = path.join(__dirname, 'route_cache.json');
const CACHE_TTL_MS = 30 * 60 * 1000;

class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  get(routeKey) {
    const entry = this.cache.get(routeKey);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(routeKey);
      this.saveToFile();
      return null;
    }

    return {
      ...entry.data,
      isCached: true,
      isExpired: false,
      cacheAge: Math.round((now - entry.timestamp) / 1000),
      nextRefreshAt: new Date(entry.expiresAt).toISOString(),
    };
  }

  set(routeKey, data) {
    if (!data?.officialDataAvailable || data.source !== OFFICIAL_SOURCE) {
      return;
    }

    const now = Date.now();
    this.cache.set(routeKey, {
      data,
      timestamp: now,
      expiresAt: now + CACHE_TTL_MS,
    });
    this.saveToFile();
  }

  saveToFile() {
    try {
      const data = {};
      for (const [key, value] of this.cache.entries()) {
        data[key] = value;
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('[Cache] Dosyaya yazma hatası:', error.message);
    }
  }

  loadFromFile() {
    try {
      if (!fs.existsSync(CACHE_FILE)) {
        return;
      }

      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      const now = Date.now();
      let loaded = 0;
      let skipped = 0;

      for (const [key, value] of Object.entries(data)) {
        const isOfficial = value?.data?.officialDataAvailable === true
          && value?.data?.source === OFFICIAL_SOURCE
          && value?.expiresAt > now;

        if (!isOfficial) {
          skipped++;
          continue;
        }

        this.cache.set(key, value);
        loaded++;
      }

      console.log(`[Cache] Dosyadan ${loaded} resmi rota yüklendi, ${skipped} eski/geçersiz kayıt atlandı`);
    } catch (error) {
      console.error('[Cache] Dosya okuma hatası:', error.message);
    }
  }

  getStats() {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const [, value] of this.cache.entries()) {
      if (now < value.expiresAt) active++;
      else expired++;
    }

    return {
      totalRoutes: this.cache.size,
      activeRoutes: active,
      expiredRoutes: expired,
      cacheTTL: '30 dakika',
      source: OFFICIAL_SOURCE,
    };
  }

  clear() {
    this.cache.clear();
    try {
      fs.unlinkSync(CACHE_FILE);
    } catch {
      // Dosya yoksa temiz kabul edilir.
    }
  }
}

module.exports = { CacheManager, CACHE_TTL_MS };
