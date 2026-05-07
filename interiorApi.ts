import { NativeModules, Platform } from 'react-native';
import { RouteResult } from '../types';

const BACKEND_PORT = '3001';
const OFFICIAL_UNAVAILABLE_MESSAGE = 'Resmi veri şu anda alınamadı.';

export interface CacheMetadata {
  isCached: boolean;
  isExpired: boolean;
  cacheAge: number;
  nextRefreshAt: string;
}

export interface RouteResultWithCache extends RouteResult {
  isCached?: boolean;
  isExpired?: boolean;
  cacheAge?: number;
  nextRefreshAt?: string;
}

function getBackendUrl() {
  // Production URL (Render)
  return 'https://yol-guvenlik-backend-1.onrender.com';
}

function unavailableResult(from: string, to: string, fromDistrict = '', toDistrict = ''): RouteResultWithCache {
  return {
    from,
    to,
    fromDistrict,
    toDistrict,
    safetyData: null,
    estimatedDuration: '',
    distance: '',
    lastUpdated: new Date().toLocaleString('tr-TR'),
    source: 'T.C. İçişleri Bakanlığı',
    officialDataAvailable: false,
    errorMessage: OFFICIAL_UNAVAILABLE_MESSAGE,
    isCached: false,
    isExpired: false,
  };
}

export async function getRouteData(
  from: string,
  to: string,
  fromDistrict = '',
  toDistrict = ''
): Promise<RouteResultWithCache> {
  try {
    return await fetchFromBackend(from, to, fromDistrict, toDistrict);
  } catch (error) {
    console.warn('[API] Resmi veri alınamadı:', (error as Error).message);
    return unavailableResult(from, to, fromDistrict, toDistrict);
  }
}

async function fetchFromBackend(
  from: string,
  to: string,
  fromDistrict: string,
  toDistrict: string
): Promise<RouteResultWithCache> {
  const params = new URLSearchParams({
    from,
    to,
    fromDistrict,
    toDistrict,
  });
  const url = `${getBackendUrl()}/api/route-safety?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok || data.officialDataAvailable === false) {
      throw new Error(data.message || OFFICIAL_UNAVAILABLE_MESSAGE);
    }

    return {
      from: data.from || from,
      to: data.to || to,
      fromDistrict: data.fromDistrict || fromDistrict,
      toDistrict: data.toDistrict || toDistrict,
      safetyData: {
        radarCount: data.safetyData?.radarCount ?? 0,
        checkpointCount: data.safetyData?.checkpointCount ?? 0,
        speedCorridorCount: data.safetyData?.speedCorridorCount ?? 0,
      },
      estimatedDuration: data.estimatedDuration || '',
      distance: data.distance || '',
      lastUpdated: data.lastUpdated || new Date().toLocaleString('tr-TR'),
      source: data.source || 'T.C. İçişleri Bakanlığı',
      sourceUrl: data.sourceUrl,
      officialDataAvailable: true,
      scraped: data.scraped !== undefined ? data.scraped : (data.source === 'T.C. İçişleri Bakanlığı' || data.source?.includes('İçişleri')),
      isCached: data.isCached ?? false,
      isExpired: data.isExpired ?? false,
      cacheAge: data.cacheAge,
      nextRefreshAt: data.nextRefreshAt,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${getBackendUrl()}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

export async function getCacheStatus(): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${getBackendUrl()}/api/cache/status`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) return response.json();
    return null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
