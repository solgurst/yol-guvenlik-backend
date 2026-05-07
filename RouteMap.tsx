import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface CityDetail {
  City: string;
  Radarli: number;
  Radarsiz: number;
}

interface RouteMapProps {
  from: string;
  to: string;
  fromDistrict?: string;
  toDistrict?: string;
  radarCount: number;
  checkpointCount: number;
  speedCorridorCount: number;
  onNavigate?: () => void;
  officialSummary?: {
    cities?: CityDetail[];
  };
}

// Web platformunda Leaflet + OSRM gerçek rota haritası
// Native platformda placeholder gösterilir
export default function RouteMap(props: RouteMapProps) {
  if (Platform.OS === 'web') {
    return <WebMap {...props} />;
  }

  // Native için dokunulabilir harita alanı
  const handlePress = () => {
    if (props.onNavigate) {
      props.onNavigate();
    }
  };

  return (
    <View style={styles.nativePlaceholder}>
      <Text style={styles.placeholderIcon}>🗺️</Text>
      <Text style={styles.placeholderText}>Harita web sürümünde görüntülenir</Text>
      <TouchableOpacity style={{ marginTop: 16, backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }} onPress={handlePress}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>🧭 Navigasyonu Başlat</Text>
      </TouchableOpacity>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Şehir/ilçe koordinatları
// ═══════════════════════════════════════════════════════════════════
const CITY_COORDS: Record<string, [number, number]> = {
  'Adana': [37.00, 35.32], 'Adıyaman': [37.76, 38.28], 'Afyonkarahisar': [38.74, 30.54],
  'Ağrı': [39.72, 43.05], 'Aksaray': [38.37, 34.03], 'Amasya': [40.65, 35.83],
  'Ankara': [39.93, 32.86], 'Antalya': [36.90, 30.71], 'Ardahan': [41.11, 42.70],
  'Artvin': [41.18, 41.82], 'Aydın': [37.86, 27.84], 'Balıkesir': [39.65, 27.88],
  'Bartın': [41.64, 32.34], 'Batman': [37.89, 41.13], 'Bayburt': [40.26, 40.22],
  'Bilecik': [40.06, 30.00], 'Bingöl': [38.88, 40.50], 'Bitlis': [38.40, 42.11],
  'Bolu': [40.73, 31.61], 'Burdur': [37.72, 30.29], 'Bursa': [40.19, 29.06],
  'Çanakkale': [40.15, 26.40], 'Çankırı': [40.60, 33.62], 'Çorum': [40.55, 34.96],
  'Denizli': [37.78, 29.09], 'Diyarbakır': [37.91, 40.23], 'Düzce': [40.84, 31.16],
  'Edirne': [41.68, 26.56], 'Elazığ': [38.68, 39.23], 'Erzincan': [39.75, 39.49],
  'Erzurum': [39.91, 41.27], 'Eskişehir': [39.77, 30.53], 'Gaziantep': [37.07, 37.38],
  'Giresun': [40.91, 38.39], 'Gümüşhane': [40.46, 39.48], 'Hakkari': [37.58, 43.74],
  'Hatay': [36.40, 36.35], 'Iğdır': [39.92, 44.05], 'Isparta': [37.76, 30.55],
  'İstanbul': [41.01, 28.98], 'İzmir': [38.42, 27.13], 'Kahramanmaraş': [37.58, 36.93],
  'Karabük': [41.20, 32.63], 'Karaman': [37.18, 33.23], 'Kars': [40.60, 43.10],
  'Kastamonu': [41.39, 33.78], 'Kayseri': [38.73, 35.48], 'Kilis': [36.72, 37.12],
  'Kırıkkale': [39.85, 33.51], 'Kırklareli': [41.74, 27.23], 'Kırşehir': [39.15, 34.17],
  'Kocaeli': [40.85, 29.88], 'Konya': [37.87, 32.49], 'Kütahya': [39.42, 29.98],
  'Malatya': [38.36, 38.31], 'Manisa': [38.62, 27.43], 'Mardin': [37.31, 40.73],
  'Mersin': [36.81, 34.64], 'Muğla': [37.22, 28.36], 'Muş': [38.75, 41.51],
  'Nevşehir': [38.63, 34.71], 'Niğde': [37.97, 34.69], 'Ordu': [40.98, 37.88],
  'Osmaniye': [37.07, 36.25], 'Rize': [41.02, 40.52], 'Sakarya': [40.69, 30.44],
  'Samsun': [41.29, 36.33], 'Şanlıurfa': [37.16, 38.80], 'Siirt': [37.93, 41.94],
  'Sinop': [42.03, 35.15], 'Sivas': [39.75, 37.02], 'Şırnak': [37.51, 42.46],
  'Tekirdağ': [41.28, 27.51], 'Tokat': [40.31, 36.55], 'Trabzon': [41.00, 39.72],
  'Tunceli': [39.11, 39.55], 'Uşak': [38.68, 29.41], 'Van': [38.49, 43.38],
  'Yalova': [40.66, 29.27], 'Yozgat': [39.82, 34.80], 'Zonguldak': [41.45, 31.79],
};

// İlçe koordinatları (önemli ilçeler)
const DISTRICT_COORDS: Record<string, [number, number]> = {
  // İstanbul
  'Kadıköy': [40.98, 29.03], 'Beşiktaş': [41.04, 29.01], 'Üsküdar': [41.02, 29.02],
  'Fatih': [41.02, 28.94], 'Bakırköy': [40.98, 28.87], 'Şişli': [41.06, 28.98],
  'Pendik': [40.88, 29.23], 'Ataşehir': [40.98, 29.11], 'Maltepe': [40.93, 29.13],
  'Sarıyer': [41.17, 29.06], 'Beyoğlu': [41.04, 28.97], 'Kartal': [40.90, 29.19],
  // Ankara
  'Çankaya': [39.91, 32.86], 'Keçiören': [39.98, 32.87], 'Mamak': [39.93, 32.92],
  'Etimesgut': [39.95, 32.67], 'Sincan': [39.97, 32.58], 'Polatlı': [39.58, 32.15],
  // Gaziantep
  'Şahinbey': [37.05, 37.37], 'Şehitkamil': [37.09, 37.36], 'Nizip': [37.01, 37.79],
  'İslahiye': [37.02, 36.63], 'Oğuzeli': [36.97, 37.51],
  // İzmir
  'Konak': [38.42, 27.13], 'Bornova': [38.47, 27.22], 'Karşıyaka': [38.46, 27.11],
  'Buca': [38.39, 27.18], 'Çiğli': [38.50, 27.06],
  // Bursa
  'Osmangazi': [40.19, 29.06], 'Nilüfer': [40.21, 28.98], 'Yıldırım': [40.19, 29.08],
  'İnegöl': [40.08, 29.51],
  // Antalya
  'Muratpaşa': [36.89, 30.71], 'Konyaaltı': [36.87, 30.64], 'Kepez': [36.94, 30.72],
  'Alanya': [36.55, 31.99],
  // Konya
  'Selçuklu': [37.90, 32.47], 'Meram': [37.84, 32.44], 'Karatay': [37.88, 32.51],
  // Diğer
  'Gebze': [40.80, 29.43], 'İzmit': [40.77, 29.94], 'Darıca': [40.77, 29.37],
  'Tarsus': [36.92, 34.89], 'Bodrum': [37.04, 27.43], 'Fethiye': [36.65, 29.12],
  'Marmaris': [36.85, 28.27], 'Çorlu': [41.16, 27.80], 'Kuşadası': [37.86, 27.26],
  'Adapazarı': [40.69, 30.40], 'Akçaabat': [41.02, 39.56],
};

function getCoord(city: string, district?: string): [number, number] {
  if (district && DISTRICT_COORDS[district]) {
    return DISTRICT_COORDS[district];
  }
  return CITY_COORDS[city] || [39.93, 32.86];
}

// ═══════════════════════════════════════════════════════════════════
// OSRM Rota API
// ═══════════════════════════════════════════════════════════════════
async function fetchOSRMRoute(
  fromCoord: [number, number],
  toCoord: [number, number]
): Promise<[number, number][] | null> {
  try {
    // OSRM format: lon,lat (not lat,lon!)
    const url = `https://router.project-osrm.org/route/v1/driving/${fromCoord[1]},${fromCoord[0]};${toCoord[1]},${toCoord[0]}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return null;

    // GeoJSON coordinates: [lon, lat] → convert to [lat, lon] for Leaflet
    const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]] as [number, number]
    );
    return coords;
  } catch (e) {
    console.warn('[RouteMap] OSRM API hatası:', e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Web Harita Bileşeni
// ═══════════════════════════════════════════════════════════════════
function WebMap({ from, to, fromDistrict, toDistrict, radarCount, checkpointCount, speedCorridorCount }: RouteMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Leaflet JS
    if ((window as any).L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initMap = async () => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const fromCoord = getCoord(from, fromDistrict);
    const toCoord = getCoord(to, toDistrict);

    // Harita merkezini hesapla
    const centerLat = (fromCoord[0] + toCoord[0]) / 2;
    const centerLng = (fromCoord[1] + toCoord[1]) / 2;

    const map = L.map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom: 7,
      zoomControl: true,
      scrollWheelZoom: true,
    });
    mapInstanceRef.current = map;

    // Koyu tema tile
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB © OSM',
      maxZoom: 18,
    }).addTo(map);

    // ── OSRM gerçek rota çiz ──
    const routeCoords = await fetchOSRMRoute(fromCoord, toCoord);
    let routeBounds: any = null;

    if (routeCoords && routeCoords.length > 0) {
      // Gerçek yol rotası
      const routeLine = L.polyline(routeCoords, {
        color: '#3B82F6',
        weight: 5,
        opacity: 0.9,
        smoothFactor: 1,
      }).addTo(map);
      routeBounds = routeLine.getBounds();
    } else {
      // Rota alınamazsa bilgi göster
      const infoDiv = L.control({ position: 'bottomleft' });
      infoDiv.onAdd = function () {
        const div = L.DomUtil.create('div', '');
        div.style.cssText = 'background:rgba(245,158,11,0.15);color:#F59E0B;padding:8px 14px;border-radius:10px;font-size:12px;border:1px solid rgba(245,158,11,0.3);max-width:280px;';
        div.innerHTML = '⚠️ Rota çizimi alınamadı, navigasyon uygulamasında açabilirsiniz.';
        return div;
      };
      infoDiv.addTo(map);

      // Sadece A-B marker'ları göster
      routeBounds = L.latLngBounds([fromCoord, toCoord]);
    }

    // ── Başlangıç marker (A) ──
    const startIcon = L.divIcon({
      html: `<div style="background:#10B981;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:bold;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4);">A</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      className: '',
    });
    const fromLabel = fromDistrict ? `${fromDistrict}, ${from}` : from;
    L.marker(fromCoord, { icon: startIcon })
      .addTo(map)
      .bindPopup(`<b>${fromLabel}</b><br>Kalkış Noktası`);

    // ── Bitiş marker (B) ──
    const endIcon = L.divIcon({
      html: `<div style="background:#EF4444;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:bold;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4);cursor:pointer;">B</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      className: '',
    });
    const toLabel = toDistrict ? `${toDistrict}, ${to}` : to;
    const endMarker = L.marker(toCoord, { icon: endIcon })
      .addTo(map)
      .bindPopup(`<b>${toLabel}</b><br>Varış Noktası<br><br><button style="background:#10B981;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-weight:bold;" onclick="window.dispatchEvent(new Event('startNavigation'))">🧭 Navigasyona Başla</button>`);

    endMarker.on('click', () => {
      if (props.onNavigate) {
        props.onNavigate();
      }
    });

    // Web marker içerisindeki HTML popup'tan gelen tıklama olayını dinle
    const navListener = () => { if (props.onNavigate) props.onNavigate(); };
    window.addEventListener('startNavigation', navListener);

    // ── Güzergah üzerindeki şehirlere radar/kontrol ikonları ekle ──
    const cities = officialSummary?.cities || [];
    cities.forEach((city: CityDetail, idx: number) => {
      const coord = CITY_COORDS[city.City];
      if (!coord) return;
      // Başlangıç ve bitiş zaten A/B olarak işaretli, atla
      if (city.City === from && idx === 0) return;
      if (city.City === to && idx === cities.length - 1) return;

      const totalDenetim = city.Radarli + city.Radarsiz;
      const hasRadar = city.Radarli > 0;

      const markerIcon = L.divIcon({
        html: `<div style="
          background: ${hasRadar ? 'rgba(239,68,68,0.9)' : 'rgba(245,158,11,0.9)'};
          color: white; border-radius: 50%; width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        ">${hasRadar ? '📡' : '🚔'}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: '',
      });

      L.marker(coord, { icon: markerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-size:13px;min-width:140px;">
            <b style="font-size:14px;">${city.City}</b><br/>
            ${hasRadar ? `📡 <b>${city.Radarli}</b> Radar<br/>` : ''}
            🚔 <b>${city.Radarsiz}</b> Kontrol Noktası<br/>
            <hr style="margin:4px 0;border-color:rgba(0,0,0,0.1);"/>
            <span style="color:#666;">Toplam: ${totalDenetim} denetim</span>
          </div>
        `);
    });

    // ── Haritayı sığdır ──
    if (routeBounds) {
      map.fitBounds(routeBounds, { padding: [80, 60], maxZoom: 14 });
    }

    // ── Lejant ──
    const legend = L.control({ position: 'topleft' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', '');
      div.style.cssText = 'background:rgba(10,14,26,0.92);padding:10px 14px;border-radius:12px;font-size:11px;line-height:18px;color:rgba(255,255,255,0.8);margin-top:80px;max-width:200px;border:1px solid rgba(255,255,255,0.1);';
      div.innerHTML = `
        <div style="font-weight:bold;margin-bottom:6px;font-size:12px;">🗺️ Harita Göstergeleri</div>
        <div>📡 <span style="color:#EF4444;">Kırmızı</span> = Radar var</div>
        <div>🚔 <span style="color:#F59E0B;">Turuncu</span> = Kontrol noktası</div>
        <div style="margin-top:6px;font-size:10px;color:rgba(255,255,255,0.5);">Konumlar tahminidir</div>
      `;
      return div;
    };
    legend.addTo(map);
  };

  return (
    <View style={styles.mapContainer}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  nativePlaceholder: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
