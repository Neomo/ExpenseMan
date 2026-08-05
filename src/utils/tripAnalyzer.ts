import { TripItem, TripChain } from '../types';

export interface ChainColorTheme {
  themeId: string;
  name: string;
  bgLight: string; // Background for day cell
  bgDark: string;
  borderLight: string; // Border for day cell
  borderDark: string;
  badgeBg: string; // Header pill background
  badgeText: string;
  pillBorder: string;
  accentHex: string;
  dotColor: string;
}

export const CHAIN_THEMES: ChainColorTheme[] = [
  {
    themeId: 'emerald',
    name: '翡翠绿',
    bgLight: 'bg-[#eef9f2]/90',
    bgDark: 'dark:bg-emerald-950/60',
    borderLight: 'border-[#9be3ba]',
    borderDark: 'dark:border-emerald-800',
    badgeBg: 'bg-[#3cae74] text-white',
    badgeText: 'text-[#14532d] dark:text-emerald-200',
    pillBorder: 'border-[#81d8a5]',
    accentHex: '#3cae74',
    dotColor: 'bg-[#3cae74]',
  },
  {
    themeId: 'amber',
    name: '暖琥珀',
    bgLight: 'bg-[#fef7eb]/90',
    bgDark: 'dark:bg-amber-950/60',
    borderLight: 'border-[#f6d5a1]',
    borderDark: 'dark:border-amber-800',
    badgeBg: 'bg-[#e08e2b] text-white',
    badgeText: 'text-[#724310] dark:text-amber-200',
    pillBorder: 'border-[#f2ca8a]',
    accentHex: '#e08e2b',
    dotColor: 'bg-[#e08e2b]',
  },
  {
    themeId: 'indigo',
    name: '靛海蓝',
    bgLight: 'bg-[#f0f4ff]/90',
    bgDark: 'dark:bg-indigo-950/60',
    borderLight: 'border-[#b8ccfd]',
    borderDark: 'dark:border-indigo-800',
    badgeBg: 'bg-[#4f46e5] text-white',
    badgeText: 'text-[#1e1b4b] dark:text-indigo-200',
    pillBorder: 'border-[#a5bdfd]',
    accentHex: '#4f46e5',
    dotColor: 'bg-[#4f46e5]',
  },
  {
    themeId: 'rose',
    name: '珊瑚粉',
    bgLight: 'bg-[#fff0f3]/90',
    bgDark: 'dark:bg-rose-950/60',
    borderLight: 'border-[#fecdd3]',
    borderDark: 'dark:border-rose-800',
    badgeBg: 'bg-[#e11d48] text-white',
    badgeText: 'text-[#881337] dark:text-rose-200',
    pillBorder: 'border-[#fda4af]',
    accentHex: '#e11d48',
    dotColor: 'bg-[#e11d48]',
  },
  {
    themeId: 'purple',
    name: '紫罗兰',
    bgLight: 'bg-[#f8f0ff]/90',
    bgDark: 'dark:bg-purple-950/60',
    borderLight: 'border-[#e1c3ff]',
    borderDark: 'dark:border-purple-800',
    badgeBg: 'bg-[#9333ea] text-white',
    badgeText: 'text-[#581c87] dark:text-purple-200',
    pillBorder: 'border-[#d8b4fe]',
    accentHex: '#9333ea',
    dotColor: 'bg-[#9333ea]',
  },
  {
    themeId: 'teal',
    name: '孔雀青',
    bgLight: 'bg-[#f0fdfa]/90',
    bgDark: 'dark:bg-teal-950/60',
    borderLight: 'border-[#99f6e4]',
    borderDark: 'dark:border-teal-800',
    badgeBg: 'bg-[#0d9488] text-white',
    badgeText: 'text-[#115e59] dark:text-teal-200',
    pillBorder: 'border-[#5eead4]',
    accentHex: '#0d9488',
    dotColor: 'bg-[#0d9488]',
  },
];

/**
 * Standardize city/station names to find matches
 * e.g. "汉口站" -> "汉口", "随州南火车站" -> "随州南"
 */
export function normalizeCity(stationName?: string): string {
  if (!stationName) return '';
  let name = stationName.trim();
  if (name.length > 2 && (name.endsWith('火车站') || name.endsWith('高铁站'))) {
    name = name.replace(/(火车站|高铁站)$/, '');
  }
  if (name.length > 2 && name.endsWith('站')) {
    name = name.slice(0, -1);
  }
  return name;
}

/**
 * Get all YYYY-MM-DD date strings between start and end inclusive
 */
export function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [startDateStr];
  }

  const curr = new Date(start);
  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

/**
 * Calculate total days span between start and end date strings inclusive
 */
export function calculateDaysSpan(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Smart Trip Chaining Analyzer
 * Identifies full round-trips that originate from a city, visit N destinations, and return back to the origin city.
 */
export function analyzeTripChains(trips: TripItem[]): TripChain[] {
  // Filter trips with valid origin and destination
  const validTrips = trips
    .filter((t) => t.origin && t.destination && t.origin.trim() && t.destination.trim())
    .sort((a, b) => {
      const dComp = a.date.localeCompare(b.date);
      if (dComp !== 0) return dComp;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

  if (validTrips.length === 0) return [];

  const chains: TripChain[] = [];
  const usedTripIds = new Set<string>();

  for (let i = 0; i < validTrips.length; i++) {
    const startTrip = validTrips[i];
    if (usedTripIds.has(startTrip.id)) continue;

    const startCityNorm = normalizeCity(startTrip.origin);
    const firstDestNorm = normalizeCity(startTrip.destination);

    if (!startCityNorm || !firstDestNorm || startCityNorm === firstDestNorm) continue;

    // Candidate chain
    const candidateLegs: TripItem[] = [startTrip];
    const candidateCities: string[] = [startTrip.origin!, startTrip.destination!];
    let currentCityNorm = firstDestNorm;
    let isClosed = false;

    // Look for matching subsequent legs
    for (let j = i + 1; j < validTrips.length; j++) {
      const nextTrip = validTrips[j];
      if (usedTripIds.has(nextTrip.id)) continue;

      const nextOriginNorm = normalizeCity(nextTrip.origin);
      const nextDestNorm = normalizeCity(nextTrip.destination);

      // Check if leg connects to current position
      if (nextOriginNorm === currentCityNorm) {
        // Enforce time sequence limit (e.g., maximum 20 days gap between legs)
        const lastLegDate = candidateLegs[candidateLegs.length - 1].date;
        const daysGap = calculateDaysSpan(lastLegDate, nextTrip.date);
        if (daysGap > 20) break; // too far apart to be the same trip chain

        candidateLegs.push(nextTrip);
        candidateCities.push(nextTrip.destination!);
        currentCityNorm = nextDestNorm;

        // If returned to original starting city, loop is closed!
        if (nextDestNorm === startCityNorm) {
          isClosed = true;
          break;
        }
      }
    }

    // If candidate chain returned back to start city and has at least 2 legs (or 1 leg roundtrip)
    if (isClosed && candidateLegs.length >= 2) {
      // Mark legs as used
      candidateLegs.forEach((leg) => usedTripIds.add(leg.id));

      const startDate = candidateLegs[0].date;
      const endDate = candidateLegs[candidateLegs.length - 1].date;
      const totalCost = candidateLegs.reduce((sum, leg) => sum + leg.amount, 0);
      const totalDays = calculateDaysSpan(startDate, endDate);
      const themeIndex = chains.length % CHAIN_THEMES.length;

      // Title generation
      const waypoints = candidateCities.slice(0, -1);
      const shortTitle = `${startTrip.origin} ➔ ${waypoints.slice(1).join(' ➔ ')} ➔ ${startTrip.origin}`;

      chains.push({
        id: `chain-${startDate}-${endDate}-${chains.length}`,
        title: shortTitle,
        startCity: startTrip.origin!,
        startDate,
        endDate,
        legs: candidateLegs,
        cities: candidateCities,
        totalCost,
        totalDays,
        themeIndex,
      });
    }
  }

  return chains;
}

/**
 * Find if a date falls inside any closed trip chain
 */
export function getChainForDate(chains: TripChain[], dateStr: string): TripChain | undefined {
  return chains.find((c) => dateStr >= c.startDate && dateStr <= c.endDate);
}
