// Şehir ve ilçe tipleri
export interface District {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  plateCode: number;
  districts: District[];
}

// Güzergah sorgu tipi
export interface RouteQuery {
  fromCity: string;
  fromDistrict?: string;
  toCity: string;
  toDistrict?: string;
}

// Güvenlik verileri
export interface SafetyData {
  radarCount: number;
  checkpointCount: number;
  speedCorridorCount: number;
}

// Güzergah sonucu
export interface RouteResult {
  from: string;
  to: string;
  fromDistrict?: string;
  toDistrict?: string;
  safetyData: SafetyData | null;
  estimatedDuration: string;
  distance: string;
  lastUpdated: string;
  source: string;
  sourceUrl?: string;
  officialDataAvailable?: boolean;
  scraped?: boolean;
  errorMessage?: string;
  officialSummary?: {
    fromDistrict?: string;
    toDistrict?: string;
    cities?: Array<{
      City: string;
      Radarli: number;
      Radarsiz: number;
    }>;
  };
}

// Son aramalar
export interface RecentRoute {
  id: string;
  from: string;
  fromDistrict?: string;
  to: string;
  toDistrict?: string;
  date: string;
  safetyData: SafetyData;
}
