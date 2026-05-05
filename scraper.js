const puppeteer = require('puppeteer');
const path = require('path');

const MINISTRY_URL = 'https://www.icisleri.gov.tr/iller-arasi-radar-ve-kontrol-noktasi-uygulama-sayilari';
const DEBUG_DIR = __dirname;
let browserInstance = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('[Scraper] 🌐 Tarayıcı başlatılıyor...');
    browserInstance = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1920,1080'],
      defaultViewport: { width: 1920, height: 1080 },
    });
  }
  return browserInstance;
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function snap(page, name) {
  try { await page.screenshot({ path: path.join(DEBUG_DIR, name), fullPage: true }); console.log(`[Scraper] 📸 ${name}`); } catch(e) {}
}

async function scrapeRouteData(fromCode, toCode, fromName, toName) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  page.setDefaultTimeout(40000);
  page.setDefaultNavigationTimeout(40000);

  // Network isteklerini yakala (API endpoint keşfi)
  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('radar') || url.includes('rota') || url.includes('route') || url.includes('api')) {
      try {
        const text = await response.text();
        if (text.length < 5000) {
          apiResponses.push({ url: url.substring(0, 120), status: response.status(), body: text.substring(0, 500) });
        }
      } catch(e) {}
    }
  });

  try {
    console.log(`[Scraper] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[Scraper] 📡 ${fromName} (${fromCode}) → ${toName} (${toCode})`);

    // ═══ 1. Sayfayı yükle ═══
    await page.goto(MINISTRY_URL, { waitUntil: 'networkidle2', timeout: 45000 });
    await wait(3000);
    console.log('[Scraper] ✅ Sayfa yüklendi');

    // Çerez kapat
    await page.evaluate(() => {
      document.querySelectorAll('button, a, div, span').forEach(el => {
        const t = (el.textContent || '').trim().toUpperCase();
        if (t === 'KABUL ET' || t === 'TAMAM' || t === 'KAPAT') el.click();
      });
    }).catch(() => {});
    await wait(1000);
    await snap(page, 'debug_01_loaded.png');

    // ═══ 2. Select'leri bul ve logla ═══
    const selects = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('select')).map((s, i) => ({
        idx: i, id: s.id, name: s.name, opts: s.options.length,
        sample: Array.from(s.options).slice(0, 3).map(o => `${o.value}="${o.textContent.trim()}"`).join(', ')
      }));
    });
    console.log(`[Scraper] 📋 ${selects.length} select:`);
    selects.forEach(s => console.log(`  [${s.idx}] id="${s.id}" name="${s.name}" opts=${s.opts} → ${s.sample}`));

    const cityIdxs = selects.filter(s => s.opts >= 50).map(s => s.idx);
    if (cityIdxs.length < 2) throw new Error(`İl select bulunamadı (${cityIdxs.length})`);

    // ═══ 3. NEREDEN il seç — Puppeteer page.select() kullan ═══
    const fromSelectId = selects[cityIdxs[0]].id;
    const fromSelectName = selects[cityIdxs[0]].name;
    console.log(`[Scraper] 🔄 NEREDEN select: idx=${cityIdxs[0]} id="${fromSelectId}" name="${fromSelectName}"`);

    // Puppeteer native select (daha güvenilir)
    let fromSelector = fromSelectId ? `select#${fromSelectId}` : `select:nth-of-type(${cityIdxs[0] + 1})`;
    try {
      await page.select(fromSelector, fromCode);
      console.log(`[Scraper] ✅ NEREDEN: page.select("${fromSelector}", "${fromCode}")`);
    } catch(e) {
      // Fallback: evaluate ile
      console.log(`[Scraper] ⚠️ page.select başarısız, evaluate deneniyor...`);
      await page.evaluate((idx, code) => {
        const sel = document.querySelectorAll('select')[idx];
        sel.value = code;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }, cityIdxs[0], fromCode);
      console.log(`[Scraper] ✅ NEREDEN: evaluate ile seçildi`);
    }

    await wait(2500);

    // ═══ 4. NEREYE il seç ═══
    const toSelectId = selects[cityIdxs[1]].id;
    console.log(`[Scraper] 🔄 NEREYE select: idx=${cityIdxs[1]} id="${toSelectId}"`);

    let toSelector = toSelectId ? `select#${toSelectId}` : `select:nth-of-type(${cityIdxs[1] + 1})`;
    try {
      await page.select(toSelector, toCode);
      console.log(`[Scraper] ✅ NEREYE: page.select("${toSelector}", "${toCode}")`);
    } catch(e) {
      await page.evaluate((idx, code) => {
        const sel = document.querySelectorAll('select')[idx];
        sel.value = code;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }, cityIdxs[1], toCode);
      console.log(`[Scraper] ✅ NEREYE: evaluate ile seçildi`);
    }

    await wait(2500);
    await snap(page, 'debug_02_selected.png');

    // ═══ 5. ROTA OLUŞTUR butonunu bul ═══
    console.log('[Scraper] 🔍 ROTA OLUŞTUR butonu aranıyor...');

    // Butonun tam bilgisini al
    const btnInfo = await page.evaluate(() => {
      const candidates = [];
      document.querySelectorAll('*').forEach(el => {
        const t = (el.textContent || '').trim().toUpperCase();
        if (t === 'ROTA OLUŞTUR' || t === 'ROTA OLUSTUR') {
          const r = el.getBoundingClientRect();
          candidates.push({
            tag: el.tagName, id: el.id, className: el.className,
            href: el.href || '', onclick: el.getAttribute('onclick') || '',
            x: r.x, y: r.y, w: r.width, h: r.height,
            cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2),
            visible: r.width > 0 && r.height > 0,
            text: el.textContent.trim(),
            outerHTML: el.outerHTML.substring(0, 300),
          });
        }
      });
      return candidates;
    });

    console.log(`[Scraper] 🔘 Buton adayları: ${btnInfo.length}`);
    btnInfo.forEach(b => {
      console.log(`  [${b.tag}] "${b.text}" visible=${b.visible} pos=(${b.cx},${b.cy}) size=${b.w}x${b.h}`);
      console.log(`    id="${b.id}" class="${b.className}"`);
      console.log(`    href="${b.href}" onclick="${b.onclick}"`);
      console.log(`    HTML: ${b.outerHTML.substring(0, 200)}`);
    });

    let clicked = false;

    // Yöntem 1: Puppeteer waitForSelector + click (en güvenilir)
    if (!clicked) {
      for (const b of btnInfo) {
        if (!b.visible) continue;
        try {
          // Elementin selector'ını oluştur
          let sel = '';
          if (b.id) sel = `#${b.id}`;
          else if (b.tag === 'A' && b.href) sel = `a[href="${b.href}"]`;
          else if (b.className) sel = `${b.tag.toLowerCase()}.${b.className.split(' ')[0]}`;
          
          if (sel) {
            await page.click(sel);
            clicked = true;
            console.log(`[Scraper] ✅ Yöntem 1: page.click("${sel}")`);
            break;
          }
        } catch(e) {
          console.log(`[Scraper] Yöntem 1 başarısız: ${e.message.substring(0, 60)}`);
        }
      }
    }

    // Yöntem 2: page.evaluate → element.click() (doğrudan DOM)
    if (!clicked) {
      clicked = await page.evaluate(() => {
        const all = document.querySelectorAll('a, button, div, span, input');
        for (const el of all) {
          const t = (el.textContent || '').trim().toUpperCase();
          if (t === 'ROTA OLUŞTUR' || t === 'ROTA OLUSTUR') {
            // Birden fazla event dene
            el.click();
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            return true;
          }
        }
        return false;
      });
      if (clicked) console.log('[Scraper] ✅ Yöntem 2: evaluate click + MouseEvent');
    }

    // Yöntem 3: Mouse click koordinat (screenshot'tan ~622, 372)
    if (!clicked) {
      const target = btnInfo.find(b => b.visible) || { cx: 622, cy: 372 };
      console.log(`[Scraper] 🖱️ Yöntem 3: mouse click (${target.cx}, ${target.cy})`);
      await page.mouse.click(target.cx, target.cy);
      clicked = true;
      console.log('[Scraper] ✅ Yöntem 3: mouse click yapıldı');
    }

    // Yöntem 4: Href varsa doğrudan navigate et
    if (!clicked) {
      const hrefBtn = btnInfo.find(b => b.href && b.href.length > 5);
      if (hrefBtn) {
        console.log(`[Scraper] 🔗 Yöntem 4: href navigate → ${hrefBtn.href}`);
        await page.goto(hrefBtn.href, { waitUntil: 'networkidle2' });
        clicked = true;
      }
    }

    console.log(`[Scraper] ${clicked ? '✅' : '❌'} Buton tıklandı: ${clicked}`);

    // ═══ 6. Sonuç bekle — uzun bekleme ═══
    console.log('[Scraper] ⏳ Sonuç bekleniyor (8 saniye)...');
    await wait(8000);

    // Sayfa değişti mi kontrol et (scroll down veya yeni içerik?)
    await page.evaluate(() => window.scrollTo(0, 500));
    await wait(1000);
    
    await snap(page, 'debug_03_after_click.png');

    // API yanıtlarını logla
    if (apiResponses.length > 0) {
      console.log(`[Scraper] 📡 Yakalanan API yanıtları: ${apiResponses.length}`);
      apiResponses.forEach(r => {
        console.log(`  [${r.status}] ${r.url}`);
        console.log(`  Body: ${r.body.substring(0, 200)}`);
      });
    }

    // ═══ 7. Sayfa metnini kontrol et ═══
    const fullText = await page.evaluate(() => document.body.innerText);
    console.log('[Scraper] ════════ SAYFA METNİ (3000 chr) ════════');
    console.log(fullText.substring(0, 3000));
    console.log('[Scraper] ════════════════════════════════════════');

    // Sonuç metninde radar/kontrol/koridor var mı?
    const lower = fullText.toLowerCase();
    const hasResult = lower.includes('radar') || lower.includes('hız koridoru');

    // "Kontrol" kelimesi dikkatli: çerez metni de "kontrol" içerir
    // Sadece "kontrol noktası" veya sonuç bağlamında sayı varsa kabul et
    const hasCheckpoint = lower.includes('kontrol noktası') || lower.includes('denetim noktası');

    if (!hasResult && !hasCheckpoint) {
      // Buton tıklaması çalışmadı, sayfanın HTML yapısını logla
      const html = await page.evaluate(() => {
        // ROTA OLUŞTUR butonunun parent container'ını bul
        const all = document.querySelectorAll('*');
        for (const el of all) {
          if ((el.textContent || '').trim().toUpperCase() === 'ROTA OLUŞTUR') {
            return el.outerHTML + '\n---PARENT---\n' + (el.parentElement?.outerHTML?.substring(0, 500) || 'yok');
          }
        }
        return 'ROTA OLUŞTUR elementi bulunamadı';
      });
      console.log('[Scraper] 🔎 ROTA OLUŞTUR element detayı:');
      console.log(html.substring(0, 800));

      throw new Error('Route result was not generated. Buton tıklaması sonuç üretmedi.');
    }

    // ═══ 8. Veri çıkar ═══
    const result = await page.evaluate(() => {
      const r = { radarCount: 0, checkpointCount: 0, speedCorridorCount: 0, labels: [] };
      const body = document.body.innerText;

      // Element bazlı — ama çerez/navigasyon metinlerini hariç tut
      const skipWords = ['çerez', 'cookie', 'gizlilik', 'politika', 'tercih'];

      document.querySelectorAll('span, td, div, p, strong, b, li, h3, h4, h5').forEach(el => {
        const txt = el.textContent.trim().replace(/\s+/g, ' ');
        if (txt.length < 3 || txt.length > 80) return;
        const lo = txt.toLowerCase();

        // Çerez/navigasyon metinlerini atla
        if (skipWords.some(w => lo.includes(w))) return;

        let type = null;
        if (lo.includes('radar') && !lo.includes('kontrol')) type = 'radar';
        else if (lo.includes('kontrol noktası') || lo.includes('denetim noktası')) type = 'checkpoint';
        else if (lo.includes('hız koridoru') || lo.includes('koridor')) type = 'speed';
        if (!type) return;

        const nm = txt.match(/(\d{1,4})/);
        if (nm) {
          const n = parseInt(nm[1]);
          if (n >= 0 && n < 500) {
            if (type === 'radar') r.radarCount = n;
            if (type === 'checkpoint') r.checkpointCount = n;
            if (type === 'speed') r.speedCorridorCount = n;
            r.labels.push({ type, val: n, text: txt });
            return;
          }
        }

        // Kardeş element
        const p = el.parentElement;
        if (p) for (const s of p.children) {
          if (s === el) continue;
          const st = s.textContent.trim();
          if (/^\d{1,4}$/.test(st)) {
            const n = parseInt(st);
            if (n >= 0 && n < 500) {
              if (type === 'radar') r.radarCount = n;
              if (type === 'checkpoint') r.checkpointCount = n;
              if (type === 'speed') r.speedCorridorCount = n;
              r.labels.push({ type, val: n, text: `${txt}→${st}` });
            }
            break;
          }
        }
      });

      // Regex fallback — çerez metinlerini hariç tut
      const lines = body.split('\n').filter(l => !l.toLowerCase().includes('çerez'));
      const cleanBody = lines.join(' ').replace(/\s+/g, ' ');

      if (r.radarCount === 0) {
        const m = cleanBody.match(/radar\s*(?:sayısı)?\s*[:=\s]+(\d{1,3})/i) || cleanBody.match(/(\d{1,3})\s+radar/i);
        if (m) { const n = parseInt(m[1]); if (n > 0 && n < 500) r.radarCount = n; }
      }
      if (r.checkpointCount === 0) {
        const m = cleanBody.match(/kontrol\s*noktası\s*(?:sayısı)?\s*[:=\s]+(\d{1,3})/i) || cleanBody.match(/(\d{1,3})\s+kontrol\s*noktası/i);
        if (m) { const n = parseInt(m[1]); if (n > 0 && n < 500) r.checkpointCount = n; }
      }
      if (r.speedCorridorCount === 0) {
        const m = cleanBody.match(/(?:hız\s*)?koridor(?:u)?\s*[:=\s]+(\d{1,3})/i) || cleanBody.match(/(\d{1,3})\s+(?:hız\s*)?koridor/i);
        if (m) { const n = parseInt(m[1]); if (n >= 0 && n < 500) r.speedCorridorCount = n; }
      }

      return r;
    });

    console.log(`[Scraper] 📊 Radar=${result.radarCount} Kontrol=${result.checkpointCount} Koridor=${result.speedCorridorCount}`);
    result.labels.forEach(l => console.log(`  [${l.type}] val=${l.val} "${l.text}"`));

    if (result.radarCount + result.checkpointCount + result.speedCorridorCount === 0) {
      throw new Error(`Sayılar çıkarılamadı: ${fromName} → ${toName}`);
    }

    console.log(`[Scraper] ✅ Başarılı`);
    return {
      from: fromName, to: toName,
      safetyData: result,
      markers: [], lastUpdated: new Date().toLocaleString('tr-TR'),
      source: 'T.C. İçişleri Bakanlığı', sourceUrl: MINISTRY_URL, scraped: true,
    };

  } catch (err) {
    console.error(`[Scraper] ❌ ${fromName}→${toName}: ${err.message}`);
    throw err;
  } finally {
    await page.close();
  }
}

process.on('SIGINT', async () => { if (browserInstance) await browserInstance.close(); process.exit(); });
module.exports = { scrapeRouteData };
