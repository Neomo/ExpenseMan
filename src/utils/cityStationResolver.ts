import { CityStationRecord, RailwayStation } from '../data/defaultCityStations';

export interface LocationMatch {
  cityName: string;
  stationName: string;
  lat: number;
  lng: number;
  isStationMatched: boolean;
  matchedRecord?: CityStationRecord;
  matchedStation?: RailwayStation;
}

/**
 * Resolves a station or city string (e.g. "汉口", "汉口站", "武汉站", "随州南", "北京西", "上海")
 * against the provided city-station records.
 */
export function resolveLocation(
  query: string | undefined | null,
  records: CityStationRecord[]
): LocationMatch | null {
  if (!query || !query.trim()) return null;

  const raw = query.trim();
  const rawWithStation = raw.endsWith('站') ? raw : `${raw}站`;
  const rawClean = raw.replace(/站$/, '');

  // 1. Exact or partial match against station names
  for (const cityRec of records) {
    for (const station of cityRec.stations) {
      if (
        station.name === raw ||
        station.name === rawWithStation ||
        station.name.replace(/站$/, '') === rawClean
      ) {
        return {
          cityName: cityRec.cityName,
          stationName: station.name,
          lat: station.lat,
          lng: station.lng,
          isStationMatched: true,
          matchedRecord: cityRec,
          matchedStation: station,
        };
      }
    }
  }

  // 2. Exact or partial match against city names
  for (const cityRec of records) {
    if (
      cityRec.cityName === rawClean ||
      rawClean.startsWith(cityRec.cityName) ||
      cityRec.cityName.startsWith(rawClean)
    ) {
      // Pick the first station if available, else city coordinates
      const primaryStation = cityRec.stations[0];
      return {
        cityName: cityRec.cityName,
        stationName: primaryStation ? primaryStation.name : `${cityRec.cityName}站`,
        lat: primaryStation ? primaryStation.lat : cityRec.cityLat,
        lng: primaryStation ? primaryStation.lng : cityRec.cityLng,
        isStationMatched: !!primaryStation,
        matchedRecord: cityRec,
        matchedStation: primaryStation,
      };
    }
  }

  // 3. Fallback: Check if query contains any known city or station keyword
  for (const cityRec of records) {
    for (const station of cityRec.stations) {
      const cleanSt = station.name.replace(/站$/, '');
      if (rawClean.includes(cleanSt) || cleanSt.includes(rawClean)) {
        return {
          cityName: cityRec.cityName,
          stationName: station.name,
          lat: station.lat,
          lng: station.lng,
          isStationMatched: true,
          matchedRecord: cityRec,
          matchedStation: station,
        };
      }
    }
  }

  // 4. Default fallback coords calculation based on string hash for unknown locations
  // Keeps map rendering without breaking
  let hash = 0;
  for (let i = 0; i < rawClean.length; i++) {
    hash = (hash << 5) - hash + rawClean.charCodeAt(i);
    hash |= 0;
  }
  const offsetLat = ((Math.abs(hash) % 100) - 50) / 20; // -2.5 to +2.5
  const offsetLng = ((Math.abs(hash >> 3) % 100) - 50) / 20;

  return {
    cityName: rawClean,
    stationName: rawWithStation,
    lat: 31.5 + offsetLat,
    lng: 114.5 + offsetLng,
    isStationMatched: false,
  };
}
