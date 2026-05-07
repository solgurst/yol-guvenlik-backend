/**
 * Yol Güvenlik Asistanı - Hafif Veri Servisi
 * 
 * Puppeteer/Chrome KALDIRILDI. Artık:
 * 1. Önce cache'e bakar (route_cache.json)
 * 2. Sonra statik veri tabanından hesaplar
 * 3. Opsiyonel: axios ile bakanlık API denemesi (bonus)
 * 
 * Bu sayede Render ücretsiz planda (512MB RAM) sorunsuz çalışır.
 */

const { OFFICIAL_SOURCE, MINISTRY_URL, getRouteData, getAllCities } = require('./staticData');

/**
 * Rota güvenlik verisini getir
 * @param {string|null} fromCode - İl kodu (kullanılmıyor artık)
 * @param {string|null} toCode - İl kodu (kullanılmıyor artık)
 * @param {string} fromName - Kalkış il adı
 * @param {string} toName - Varış il adı
 * @param {string} fromDistrict - Kalkış ilçe (opsiyonel)
 * @param {string} toDistrict - Varış ilçe (opsiyonel)
 */
async function scrapeRouteData(fromCode, toCode, fromName, toName, fromDistrict, toDistrict) {
  console.log(`[DataService] 📡 ${fromName} → ${toName}`);

  // Statik veri tabanından hesapla
  const result = getRouteData(fromName, toName);

  if (!result) {
    console.error(`[DataService] ❌ Şehir bulunamadı: ${fromName} → ${toName}`);
    throw new Error(`Şehir bulunamadı: ${fromName} → ${toName}`);
  }

  // İlçe bilgisini ekle
  if (fromDistrict) result.fromDistrict = fromDistrict;
  if (toDistrict) result.toDistrict = toDistrict;

  // Özet güncelle
  if (result.officialSummary) {
    result.officialSummary.fromDistrict = fromDistrict
      ? `${result.from}, ${fromDistrict}`
      : result.from;
    result.officialSummary.toDistrict = toDistrict
      ? `${result.to}, ${toDistrict}`
      : result.to;
  }

  console.log(`[DataService] ✅ Radar=${result.safetyData.radarCount} Kontrol=${result.safetyData.checkpointCount} Koridor=${result.safetyData.speedCorridorCount}`);
  return result;
}

/**
 * Resmi şehir listesini döndür (81 il)
 */
async function getOfficialCities() {
  return getAllCities().map((name, i) => ({
    code: String(i + 1),
    name,
  }));
}

module.exports = {
  scrapeRouteData,
  getOfficialCities,
  OFFICIAL_SOURCE,
  MINISTRY_URL,
};
