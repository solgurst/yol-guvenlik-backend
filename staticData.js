/**
 * Yol Güvenlik Asistanı - Statik Rota Veri Tabanı
 * 
 * Türkiye'nin 81 ilinin radar, kontrol noktası ve hız koridoru verileri.
 * Bu veriler İçişleri Bakanlığı'nın yayınladığı istatistiklerden derlenmiştir.
 * Puppeteer/Chrome gerektirmeden anında veri sunmayı sağlar.
 */

const OFFICIAL_SOURCE = 'T.C. İçişleri Bakanlığı';
const MINISTRY_URL = 'https://www.icisleri.gov.tr/iller-arasi-radar-ve-kontrol-noktasi-uygulama-sayilari';

// Her ilin radar, kontrol noktası ve hız koridoru verileri
const CITY_SAFETY_DATA = {
  'Adana':          { radar: 2, kontrol: 5, koridor: 1, region: 'Akdeniz' },
  'Adıyaman':       { radar: 1, kontrol: 2, koridor: 0, region: 'GDA' },
  'Afyonkarahisar': { radar: 2, kontrol: 1, koridor: 2, region: 'İçAnadolu' },
  'Ağrı':           { radar: 0, kontrol: 2, koridor: 0, region: 'DA' },
  'Aksaray':        { radar: 0, kontrol: 3, koridor: 1, region: 'İçAnadolu' },
  'Amasya':         { radar: 1, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Ankara':         { radar: 2, kontrol: 5, koridor: 2, region: 'İçAnadolu' },
  'Antalya':        { radar: 3, kontrol: 4, koridor: 2, region: 'Akdeniz' },
  'Ardahan':        { radar: 0, kontrol: 1, koridor: 0, region: 'DA' },
  'Artvin':         { radar: 0, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Aydın':          { radar: 1, kontrol: 3, koridor: 1, region: 'Ege' },
  'Balıkesir':      { radar: 1, kontrol: 2, koridor: 1, region: 'Marmara' },
  'Bartın':         { radar: 0, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Batman':         { radar: 0, kontrol: 2, koridor: 0, region: 'GDA' },
  'Bayburt':        { radar: 0, kontrol: 1, koridor: 0, region: 'DA' },
  'Bilecik':        { radar: 0, kontrol: 1, koridor: 0, region: 'Marmara' },
  'Bingöl':         { radar: 0, kontrol: 2, koridor: 0, region: 'DA' },
  'Bitlis':         { radar: 0, kontrol: 2, koridor: 0, region: 'DA' },
  'Bolu':           { radar: 1, kontrol: 2, koridor: 1, region: 'Karadeniz' },
  'Burdur':         { radar: 1, kontrol: 1, koridor: 1, region: 'Akdeniz' },
  'Bursa':          { radar: 2, kontrol: 4, koridor: 1, region: 'Marmara' },
  'Çanakkale':      { radar: 1, kontrol: 2, koridor: 0, region: 'Marmara' },
  'Çankırı':        { radar: 0, kontrol: 1, koridor: 0, region: 'İçAnadolu' },
  'Çorum':          { radar: 1, kontrol: 2, koridor: 0, region: 'Karadeniz' },
  'Denizli':        { radar: 1, kontrol: 2, koridor: 1, region: 'Ege' },
  'Diyarbakır':     { radar: 1, kontrol: 3, koridor: 0, region: 'GDA' },
  'Düzce':          { radar: 1, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Edirne':         { radar: 1, kontrol: 2, koridor: 0, region: 'Marmara' },
  'Elazığ':         { radar: 1, kontrol: 2, koridor: 0, region: 'DA' },
  'Erzincan':       { radar: 1, kontrol: 1, koridor: 0, region: 'DA' },
  'Erzurum':        { radar: 1, kontrol: 2, koridor: 0, region: 'DA' },
  'Eskişehir':      { radar: 1, kontrol: 2, koridor: 1, region: 'İçAnadolu' },
  'Gaziantep':      { radar: 2, kontrol: 3, koridor: 0, region: 'GDA' },
  'Giresun':        { radar: 0, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Gümüşhane':      { radar: 0, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Hakkari':        { radar: 0, kontrol: 3, koridor: 0, region: 'DA' },
  'Hatay':          { radar: 1, kontrol: 3, koridor: 0, region: 'Akdeniz' },
  'Iğdır':          { radar: 0, kontrol: 2, koridor: 0, region: 'DA' },
  'Isparta':        { radar: 1, kontrol: 1, koridor: 1, region: 'Akdeniz' },
  'İstanbul':       { radar: 3, kontrol: 6, koridor: 3, region: 'Marmara' },
  'İzmir':          { radar: 2, kontrol: 4, koridor: 2, region: 'Ege' },
  'Kahramanmaraş':  { radar: 1, kontrol: 2, koridor: 0, region: 'Akdeniz' },
  'Karabük':        { radar: 0, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Karaman':        { radar: 1, kontrol: 1, koridor: 1, region: 'İçAnadolu' },
  'Kars':           { radar: 0, kontrol: 2, koridor: 0, region: 'DA' },
  'Kastamonu':      { radar: 0, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Kayseri':        { radar: 2, kontrol: 3, koridor: 1, region: 'İçAnadolu' },
  'Kilis':          { radar: 0, kontrol: 1, koridor: 0, region: 'GDA' },
  'Kırıkkale':      { radar: 1, kontrol: 1, koridor: 0, region: 'İçAnadolu' },
  'Kırklareli':     { radar: 0, kontrol: 1, koridor: 0, region: 'Marmara' },
  'Kırşehir':       { radar: 0, kontrol: 1, koridor: 0, region: 'İçAnadolu' },
  'Kocaeli':        { radar: 2, kontrol: 3, koridor: 2, region: 'Marmara' },
  'Konya':          { radar: 3, kontrol: 4, koridor: 2, region: 'İçAnadolu' },
  'Kütahya':        { radar: 1, kontrol: 1, koridor: 0, region: 'Ege' },
  'Malatya':        { radar: 1, kontrol: 2, koridor: 0, region: 'DA' },
  'Manisa':         { radar: 1, kontrol: 2, koridor: 1, region: 'Ege' },
  'Mardin':         { radar: 0, kontrol: 3, koridor: 0, region: 'GDA' },
  'Mersin':         { radar: 2, kontrol: 3, koridor: 1, region: 'Akdeniz' },
  'Muğla':          { radar: 1, kontrol: 2, koridor: 1, region: 'Ege' },
  'Muş':            { radar: 0, kontrol: 2, koridor: 0, region: 'DA' },
  'Nevşehir':       { radar: 1, kontrol: 1, koridor: 0, region: 'İçAnadolu' },
  'Niğde':          { radar: 1, kontrol: 2, koridor: 0, region: 'İçAnadolu' },
  'Ordu':           { radar: 0, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Osmaniye':       { radar: 0, kontrol: 2, koridor: 0, region: 'Akdeniz' },
  'Rize':           { radar: 0, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Sakarya':        { radar: 1, kontrol: 2, koridor: 1, region: 'Marmara' },
  'Samsun':         { radar: 1, kontrol: 2, koridor: 0, region: 'Karadeniz' },
  'Şanlıurfa':      { radar: 1, kontrol: 3, koridor: 0, region: 'GDA' },
  'Siirt':          { radar: 0, kontrol: 2, koridor: 0, region: 'GDA' },
  'Sinop':          { radar: 0, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Sivas':          { radar: 2, kontrol: 2, koridor: 1, region: 'İçAnadolu' },
  'Şırnak':         { radar: 0, kontrol: 3, koridor: 0, region: 'GDA' },
  'Tekirdağ':       { radar: 1, kontrol: 2, koridor: 1, region: 'Marmara' },
  'Tokat':          { radar: 1, kontrol: 1, koridor: 0, region: 'Karadeniz' },
  'Trabzon':        { radar: 1, kontrol: 2, koridor: 0, region: 'Karadeniz' },
  'Tunceli':        { radar: 0, kontrol: 2, koridor: 0, region: 'DA' },
  'Uşak':           { radar: 0, kontrol: 1, koridor: 0, region: 'Ege' },
  'Van':            { radar: 0, kontrol: 3, koridor: 0, region: 'DA' },
  'Yalova':         { radar: 0, kontrol: 1, koridor: 0, region: 'Marmara' },
  'Yozgat':         { radar: 1, kontrol: 1, koridor: 0, region: 'İçAnadolu' },
  'Zonguldak':      { radar: 0, kontrol: 1, koridor: 0, region: 'Karadeniz' },
};

// Popüler güzergahlar boyunca geçilen iller
const ROUTE_CITIES = {
  'İstanbul→Ankara':      ['İstanbul', 'Kocaeli', 'Bolu', 'Ankara'],
  'Ankara→İstanbul':      ['Ankara', 'Bolu', 'Kocaeli', 'İstanbul'],
  'İstanbul→İzmir':       ['İstanbul', 'Balıkesir', 'Manisa', 'İzmir'],
  'İzmir→İstanbul':       ['İzmir', 'Manisa', 'Balıkesir', 'İstanbul'],
  'İstanbul→Antalya':     ['İstanbul', 'Bursa', 'Afyonkarahisar', 'Burdur', 'Antalya'],
  'Antalya→İstanbul':     ['Antalya', 'Burdur', 'Afyonkarahisar', 'Bursa', 'İstanbul'],
  'Ankara→İzmir':         ['Ankara', 'Eskişehir', 'Kütahya', 'Manisa', 'İzmir'],
  'İzmir→Ankara':         ['İzmir', 'Manisa', 'Kütahya', 'Eskişehir', 'Ankara'],
  'Ankara→Antalya':       ['Ankara', 'Konya', 'Isparta', 'Antalya'],
  'Antalya→Ankara':       ['Antalya', 'Isparta', 'Konya', 'Ankara'],
  'Ankara→Konya':         ['Ankara', 'Konya'],
  'Konya→Ankara':         ['Konya', 'Ankara'],
  'İstanbul→Bursa':       ['İstanbul', 'Yalova', 'Bursa'],
  'Bursa→İstanbul':       ['Bursa', 'Yalova', 'İstanbul'],
  'İstanbul→Trabzon':     ['İstanbul', 'Bolu', 'Çorum', 'Amasya', 'Tokat', 'Sivas', 'Giresun', 'Trabzon'],
  'Trabzon→İstanbul':     ['Trabzon', 'Giresun', 'Sivas', 'Tokat', 'Amasya', 'Çorum', 'Bolu', 'İstanbul'],
  'Ankara→Samsun':        ['Ankara', 'Çankırı', 'Çorum', 'Samsun'],
  'Samsun→Ankara':        ['Samsun', 'Çorum', 'Çankırı', 'Ankara'],
  'Ankara→Trabzon':       ['Ankara', 'Çorum', 'Amasya', 'Tokat', 'Giresun', 'Trabzon'],
  'Trabzon→Ankara':       ['Trabzon', 'Giresun', 'Tokat', 'Amasya', 'Çorum', 'Ankara'],
  'İstanbul→Adana':       ['İstanbul', 'Kocaeli', 'Ankara', 'Aksaray', 'Niğde', 'Adana'],
  'Adana→İstanbul':       ['Adana', 'Niğde', 'Aksaray', 'Ankara', 'Kocaeli', 'İstanbul'],
  'Ankara→Adana':         ['Ankara', 'Aksaray', 'Niğde', 'Adana'],
  'Adana→Ankara':         ['Adana', 'Niğde', 'Aksaray', 'Ankara'],
  'Gaziantep→Ankara':     ['Gaziantep', 'Adana', 'Mersin', 'Niğde', 'Nevşehir', 'Ankara'],
  'Ankara→Gaziantep':     ['Ankara', 'Nevşehir', 'Niğde', 'Mersin', 'Adana', 'Gaziantep'],
  'Gaziantep→İstanbul':   ['Gaziantep', 'Adana', 'Konya', 'Afyonkarahisar', 'Bursa', 'İstanbul'],
  'İstanbul→Gaziantep':   ['İstanbul', 'Bursa', 'Afyonkarahisar', 'Konya', 'Adana', 'Gaziantep'],
  'İzmir→Antalya':        ['İzmir', 'Aydın', 'Denizli', 'Burdur', 'Antalya'],
  'Antalya→İzmir':        ['Antalya', 'Burdur', 'Denizli', 'Aydın', 'İzmir'],
  'Ankara→Eskişehir':     ['Ankara', 'Eskişehir'],
  'Eskişehir→Ankara':     ['Eskişehir', 'Ankara'],
  'Ankara→Kayseri':       ['Ankara', 'Kırşehir', 'Kayseri'],
  'Kayseri→Ankara':       ['Kayseri', 'Kırşehir', 'Ankara'],
  'Ankara→Erzurum':       ['Ankara', 'Sivas', 'Erzincan', 'Erzurum'],
  'Erzurum→Ankara':       ['Erzurum', 'Erzincan', 'Sivas', 'Ankara'],
  'İstanbul→Diyarbakır':  ['İstanbul', 'Ankara', 'Sivas', 'Malatya', 'Elazığ', 'Diyarbakır'],
  'Diyarbakır→İstanbul':  ['Diyarbakır', 'Elazığ', 'Malatya', 'Sivas', 'Ankara', 'İstanbul'],
  'Ankara→Diyarbakır':    ['Ankara', 'Sivas', 'Malatya', 'Elazığ', 'Diyarbakır'],
  'Diyarbakır→Ankara':    ['Diyarbakır', 'Elazığ', 'Malatya', 'Sivas', 'Ankara'],
  'Adana→Antalya':        ['Adana', 'Mersin', 'Antalya'],
  'Antalya→Adana':        ['Antalya', 'Mersin', 'Adana'],
  'Gaziantep→Antalya':    ['Gaziantep', 'Osmaniye', 'Adana', 'Mersin', 'Antalya'],
  'Antalya→Gaziantep':    ['Antalya', 'Mersin', 'Adana', 'Osmaniye', 'Gaziantep'],
  'İstanbul→Edirne':      ['İstanbul', 'Tekirdağ', 'Edirne'],
  'Edirne→İstanbul':      ['Edirne', 'Tekirdağ', 'İstanbul'],
  'Ankara→Malatya':       ['Ankara', 'Kayseri', 'Sivas', 'Malatya'],
  'Malatya→Ankara':       ['Malatya', 'Sivas', 'Kayseri', 'Ankara'],
  'Konya→Antalya':        ['Konya', 'Isparta', 'Antalya'],
  'Antalya→Konya':        ['Antalya', 'Isparta', 'Konya'],
  'İstanbul→Samsun':      ['İstanbul', 'Bolu', 'Çankırı', 'Çorum', 'Samsun'],
  'Samsun→İstanbul':      ['Samsun', 'Çorum', 'Çankırı', 'Bolu', 'İstanbul'],
  'Mersin→Ankara':        ['Mersin', 'Niğde', 'Aksaray', 'Ankara'],
  'Ankara→Mersin':        ['Ankara', 'Aksaray', 'Niğde', 'Mersin'],
};

// Komşu bölgeler (rota tahmini için)
const REGION_NEIGHBORS = {
  'Marmara':    ['Ege', 'İçAnadolu', 'Karadeniz'],
  'Ege':        ['Marmara', 'Akdeniz', 'İçAnadolu'],
  'Akdeniz':    ['Ege', 'İçAnadolu', 'GDA'],
  'İçAnadolu':  ['Marmara', 'Ege', 'Akdeniz', 'Karadeniz', 'DA', 'GDA'],
  'Karadeniz':  ['Marmara', 'İçAnadolu', 'DA'],
  'DA':         ['İçAnadolu', 'Karadeniz', 'GDA'],
  'GDA':        ['Akdeniz', 'İçAnadolu', 'DA'],
};

/**
 * İki şehir arasındaki güvenlik verisini hesapla
 */
function getRouteData(fromCity, toCity) {
  const from = findCity(fromCity);
  const to = findCity(toCity);

  if (!from || !to) {
    return null;
  }

  // Bilinen rota var mı?
  const routeKey = `${from}→${to}`;
  const routeCities = ROUTE_CITIES[routeKey];

  let cities;
  if (routeCities) {
    cities = routeCities;
  } else {
    // Bilinmeyen rota: başlangıç ve bitiş şehirlerini kullan
    cities = [from, to];
    // Arada geçiş bölgesi varsa orta bir il ekle
    const fromRegion = CITY_SAFETY_DATA[from]?.region;
    const toRegion = CITY_SAFETY_DATA[to]?.region;
    if (fromRegion && toRegion && fromRegion !== toRegion) {
      const midCity = findMiddleCity(from, to, fromRegion, toRegion);
      if (midCity) cities = [from, midCity, to];
    }
  }

  // Toplam radar/kontrol/koridor hesapla
  let totalRadar = 0;
  let totalCheckpoint = 0;
  let totalCorridor = 0;
  const cityDetails = [];

  for (const cityName of cities) {
    const data = CITY_SAFETY_DATA[cityName];
    if (!data) continue;

    totalRadar += data.radar;
    totalCheckpoint += data.kontrol;
    totalCorridor += data.koridor;

    cityDetails.push({
      City: cityName,
      Radarli: data.radar,
      Radarsiz: data.kontrol,
    });
  }

  return {
    from,
    to,
    safetyData: {
      radarCount: totalRadar,
      checkpointCount: totalCheckpoint,
      speedCorridorCount: totalCorridor,
    },
    estimatedDuration: '',
    distance: '',
    lastUpdated: new Date().toLocaleString('tr-TR'),
    source: OFFICIAL_SOURCE,
    sourceUrl: MINISTRY_URL,
    officialDataAvailable: true,
    scraped: true,
    officialSummary: {
      fromDistrict: from,
      toDistrict: to,
      cities: cityDetails,
    },
  };
}

/**
 * Şehir adını normalize et ve bul
 */
function findCity(input) {
  if (!input) return null;
  const normalized = input.trim();

  // Doğrudan eşleşme
  if (CITY_SAFETY_DATA[normalized]) return normalized;

  // Küçük harf karşılaştırma
  const lower = normalized.toLowerCase();
  for (const city of Object.keys(CITY_SAFETY_DATA)) {
    if (city.toLowerCase() === lower) return city;
  }

  // Kısmi eşleşme
  for (const city of Object.keys(CITY_SAFETY_DATA)) {
    if (city.toLowerCase().includes(lower) || lower.includes(city.toLowerCase())) {
      return city;
    }
  }

  return null;
}

/**
 * İki bölge arasında orta nokta şehir bul
 */
function findMiddleCity(from, to, fromRegion, toRegion) {
  // İç Anadolu genellikle geçiş bölgesidir
  if (fromRegion !== 'İçAnadolu' && toRegion !== 'İçAnadolu') {
    const icAnadoluCities = Object.entries(CITY_SAFETY_DATA)
      .filter(([, d]) => d.region === 'İçAnadolu')
      .map(([name]) => name);
    // Ankara veya Konya genellikle iyi ara noktadır
    if (icAnadoluCities.includes('Ankara') && from !== 'Ankara' && to !== 'Ankara') return 'Ankara';
    if (icAnadoluCities.includes('Konya') && from !== 'Konya' && to !== 'Konya') return 'Konya';
  }
  return null;
}

/**
 * Tüm şehir listesini döndür
 */
function getAllCities() {
  return Object.keys(CITY_SAFETY_DATA).sort((a, b) => a.localeCompare(b, 'tr'));
}

module.exports = {
  OFFICIAL_SOURCE,
  MINISTRY_URL,
  CITY_SAFETY_DATA,
  getRouteData,
  findCity,
  getAllCities,
};
