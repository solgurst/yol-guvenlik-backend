import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Colors } from '../theme/colors';
import { getRouteData, RouteResultWithCache } from '../services/interiorApi';
import { saveRecentRoute } from '../storage/recentRoutes';
import RouteMap from '../components/RouteMap';
import { MapService } from '../services/MapService';

interface Props {
  navigation: any;
  route: any;
}

export default function RouteResultScreen({ navigation, route }: Props) {
  const { from, to, fromDistrict = '', toDistrict = '' } = route.params;

  const displayFrom = fromDistrict ? `${from} / ${fromDistrict}` : from;
  const displayTo = toDistrict ? `${to} / ${toDistrict}` : to;

  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<RouteResultWithCache | null>(null);

  useEffect(() => { loadRouteData(); }, []);

  const loadRouteData = async () => {
    try {
      setLoading(true);
      const data = await getRouteData(from, to, fromDistrict, toDistrict);
      setRouteData(data);
      if (data.officialDataAvailable !== false && data.safetyData) {
        await saveRecentRoute({
          id: `${from}-${to}-${Date.now()}`,
          from, to, fromDistrict, toDistrict,
          date: new Date().toLocaleDateString('tr-TR'),
          safetyData: data.safetyData,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Veri yüklenemedi:', error);
      setLoading(false);
    }
  };

  // ─── Navigation Handlers ─────────────────────────────────────
  const openGoogleMaps = () => MapService.openGoogleMaps({ from, to, fromDistrict, toDistrict });
  const openAppleMaps = () => MapService.openAppleMaps({ from, to, fromDistrict, toDistrict });
  const openWaze = () => MapService.openWaze({ from, to, fromDistrict, toDistrict });

  // ─── Animated Loading Screen ─────────────────────────────────
  const SCAN_MESSAGES = [
    '🛰️  Rotanız hesaplanıyor...',
    '📡  Radarlar taranıyor...',
    '🚔  Kontrol noktaları kontrol ediliyor...',
    '🚦  Hız koridorları analiz ediliyor...',
    '🛡️  Güvenlik raporu hazırlanıyor...',
  ];
  const [msgIndex, setMsgIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading) return;
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    // Rotating messages
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setMsgIndex(prev => (prev + 1) % SCAN_MESSAGES.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 2200);
    return () => { pulse.stop(); clearInterval(interval); };
  }, [loading]);

  const ScanningScreen = () => (
    <View style={styles.scanContainer}>
      <Animated.Text style={[styles.scanIcon, { transform: [{ scale: pulseAnim }] }]}>📡</Animated.Text>
      <Text style={styles.scanTitle}>Güvenlik Analizi</Text>
      <Text style={styles.scanRoute}>{displayFrom} → {displayTo}</Text>
      <Animated.Text style={[styles.scanMsg, { opacity: fadeAnim }]}>
        {SCAN_MESSAGES[msgIndex]}
      </Animated.Text>
      <View style={styles.scanDots}>
        {[0, 1, 2].map(i => <View key={i} style={styles.scanDot} />)}
      </View>
    </View>
  );

  // ─── Render Logic ─────────────────────────────────────────────
  if (loading) return <ScanningScreen />;

  if (!routeData) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text style={styles.loadingTitle}>Veri Bulunamadı</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadRouteData}>
          <Text style={styles.retryBtnText}>🔄 Tekrar Dene</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: 'transparent', marginTop: 8 }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.retryBtnText, { color: Colors.textSecondary }]}>← Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (routeData.officialDataAvailable === false || !routeData.safetyData || routeData.scraped === false) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🛰️</Text>
        <Text style={styles.loadingTitle}>Sunucu Uyanıyor...</Text>
        <Text style={styles.loadingRoute}>{displayFrom} → {displayTo}</Text>
        <Text style={styles.loadingHint}>Sunucu ilk açılışta 30-60 sn ısınma süresi alabilir.{"\n"}Lütfen tekrar deneyin.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadRouteData}>
          <Text style={styles.retryBtnText}>🔄 Tekrar Dene</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: 'transparent', marginTop: 8 }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.retryBtnText, { color: Colors.textSecondary }]}>← Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { radarCount, checkpointCount, speedCorridorCount } = routeData.safetyData;
  const resultDisplayFrom = routeData.fromDistrict ? `${routeData.from} / ${routeData.fromDistrict}` : displayFrom;
  const resultDisplayTo = routeData.toDistrict ? `${routeData.to} / ${routeData.toDistrict}` : displayTo;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topTitle} numberOfLines={1}>{resultDisplayFrom} → {resultDisplayTo}</Text>
            <Text style={styles.topMeta}>{routeData.source}</Text>
          </View>
        </View>

        {/* Stats Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          <View style={[styles.chip, { backgroundColor: Colors.radarBg, borderColor: Colors.radarText }]}>
            <Text style={styles.chipEmoji}>📷</Text>
            <Text style={[styles.chipText, { color: Colors.radarText }]}>{radarCount} Radar</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: Colors.checkpointBg, borderColor: Colors.checkpointText }]}>
            <Text style={styles.chipEmoji}>🛑</Text>
            <Text style={[styles.chipText, { color: Colors.checkpointText }]}>{checkpointCount} Kontrol</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: Colors.speedBg, borderColor: Colors.speedText }]}>
            <Text style={styles.chipEmoji}>⚡</Text>
            <Text style={[styles.chipText, { color: Colors.speedText }]}>{speedCorridorCount} Koridor</Text>
          </View>
        </ScrollView>

        {/* Map */}
        <View style={styles.mapCard}>
          <RouteMap
            from={from} to={to}
            fromDistrict={fromDistrict} toDistrict={toDistrict}
            radarCount={radarCount} checkpointCount={checkpointCount}
            speedCorridorCount={speedCorridorCount}
            onNavigate={openGoogleMaps}
          />
        </View>

        {/* Status / Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Veri Kaynağı</Text>
              <Text style={styles.summaryUpdated}>T.C. İçişleri Bakanlığı</Text>
              <Text style={styles.summaryDist}>{routeData.scraped ? '✅ Resmi veri alındı' : '⚠️ Resmi veri alınamadı'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summaryBadge}>
                {routeData.isCached ? '✅ Güncel' : '📡 Canlı'}
              </Text>
              <Text style={styles.summaryDate}>{routeData.lastUpdated}</Text>
            </View>
          </View>
        </View>

        {/* Main CTA */}
        <TouchableOpacity style={styles.navCta} onPress={openGoogleMaps} activeOpacity={0.8}>
          <Text style={styles.navCtaText}>🧭 Navigasyona Başla</Text>
        </TouchableOpacity>

        {/* Nav Options */}
        <Text style={styles.navTitle}>Alternatif Navigasyon</Text>

        <TouchableOpacity style={styles.navOption} onPress={openAppleMaps} activeOpacity={0.6}>
          <Text style={styles.navOptionEmoji}>🍎</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.navOptionName}>Apple Haritalar</Text>
            <Text style={styles.navOptionDesc}>iOS navigasyon başlat</Text>
          </View>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navOption} onPress={openWaze} activeOpacity={0.6}>
          <Text style={styles.navOptionEmoji}>🟣</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.navOptionName}>Waze</Text>
            <Text style={styles.navOptionDesc}>Topluluk bazlı navigasyon</Text>
          </View>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>

        {/* Disclaimers & Footer */}
        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>• Veriler İçişleri Bakanlığı resmi sayfasından alınır.</Text>
          <Text style={styles.disclaimerText}>• Veriler bilgilendirme amaçlıdır.</Text>
          <Text style={styles.disclaimerText}>• Lütfen hız limitlerine uyun.</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Loading
  loadingScreen: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40,
  },
  loadingCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  loadingRoute: { fontSize: 15, color: Colors.primary, fontWeight: '600', marginBottom: 8 },
  loadingHint: { fontSize: 12, color: Colors.textLight, textAlign: 'center' },
  retryBtn: {
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  retryBtnText: { color: Colors.textPrimary, fontWeight: '600' },

  // Scanning Screen
  scanContainer: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  scanIcon: { fontSize: 72, marginBottom: 24 },
  scanTitle: {
    fontSize: 22, fontWeight: '700', color: Colors.textPrimary,
    marginBottom: 8, textAlign: 'center',
  },
  scanRoute: {
    fontSize: 15, color: Colors.primary, fontWeight: '600',
    marginBottom: 28, textAlign: 'center',
  },
  scanMsg: {
    fontSize: 16, color: Colors.textSecondary,
    textAlign: 'center', marginBottom: 32, minHeight: 24,
  },
  scanDots: { flexDirection: 'row', gap: 8 },
  scanDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, opacity: 0.6,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, marginBottom: 16,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
    marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  backBtnText: { fontSize: 18, color: Colors.textPrimary, fontWeight: '600' },
  topTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  topMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  // Stats Chips
  chipsContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
    marginBottom: 16,
    paddingRight: 20,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 16, marginRight: 6 },
  chipText: { fontSize: 14, fontWeight: '600' },

  // Map
  mapCard: {
    height: 280, borderRadius: 24, overflow: 'hidden',
    backgroundColor: Colors.card, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },

  // Summary
  summaryCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 18,
    marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  summaryUpdated: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  summaryDist: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  summaryBadge: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  summaryDate: { fontSize: 12, color: Colors.textLight, marginTop: 4 },

  // Nav CTA
  navCta: {
    backgroundColor: Colors.success, borderRadius: 28,
    paddingVertical: 18, alignItems: 'center', marginBottom: 24,
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  navCtaText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  // Nav options
  navTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  navOption: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'transparent', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  navOptionEmoji: { fontSize: 24, marginRight: 16 },
  navOptionName: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  navOptionDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  navArrow: { fontSize: 22, color: Colors.textLight },

  // Skeleton
  skeleton: {
    backgroundColor: Colors.divider,
    borderRadius: 8,
    opacity: 0.6,
  },
});
