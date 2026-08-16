import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../../store/useAppStore';
import { resolveLocation, LocationMatch } from '../../utils/cityStationResolver';
import { TripItem } from '../../types';
import {
  MapPin,
  Plane,
  Train,
  Car,
  Bus,
  Sparkles,
  Calendar,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Trophy,
  Building2,
  TrendingUp,
  Maximize2,
  Minimize2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { formatChineseDate } from '../../utils/dateUtils';

interface ResolvedTrip {
  trip: TripItem;
  originMatch: LocationMatch;
  destMatch: LocationMatch;
  isSameCity: boolean;
}

// Helper to classify transport types
const isTrainTransport = (transportStr?: string): boolean => {
  if (!transportStr) return false;
  const t = transportStr.trim().toLowerCase();
  return (
    t.includes('火车') ||
    t.includes('高铁') ||
    t.includes('动车') ||
    t.includes('城际') ||
    t.includes('列车') ||
    t.includes('普快') ||
    t.includes('特快') ||
    t.includes('直达') ||
    t.includes('train') ||
    t.includes('rail') ||
    t.includes('bullet')
  );
};

const isFlightTransport = (transportStr?: string): boolean => {
  if (!transportStr) return false;
  const t = transportStr.trim().toLowerCase();
  return (
    t.includes('飞机') ||
    t.includes('航班') ||
    t.includes('机票') ||
    t.includes('民航') ||
    t.includes('客机') ||
    t.includes('flight') ||
    t.includes('plane') ||
    t.includes('air')
  );
};

export const MapView: React.FC = () => {
  const { trips, cityStations, openTripModal } = useAppStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // States
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [activeTransportFilter, setActiveTransportFilter] = useState<string>('all');
  const [activeYearFilter, setActiveYearFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStatTab, setActiveStatTab] = useState<'city' | 'station'>('city');

  // Animation Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Layout Toggle
  const [isFullscreenMap, setIsFullscreenMap] = useState<boolean>(false);

  // 1. Resolve Trips against City-Station Database
  const resolvedTrips = useMemo<ResolvedTrip[]>(() => {
    return trips
      .map((t) => {
        const originMatch = resolveLocation(t.origin || '未知始发', cityStations);
        const destMatch = resolveLocation(t.destination || '未知终点', cityStations);

        if (!originMatch || !destMatch) return null;

        return {
          trip: t,
          originMatch,
          destMatch,
          isSameCity: originMatch.cityName === destMatch.cityName,
        };
      })
      .filter((item): item is ResolvedTrip => item !== null);
  }, [trips, cityStations]);

  // Available Years for filter
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    trips.forEach((t) => {
      if (t.date) {
        years.add(t.date.split('-')[0]);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [trips]);

  // 2. Filtered Trips sorted chronologically (newest first for list)
  const filteredResolvedTrips = useMemo(() => {
    return resolvedTrips
      .filter(({ trip, originMatch, destMatch }) => {
        // Transport filter: train or flight
        if (activeTransportFilter === 'train' || activeTransportFilter === '火车' || activeTransportFilter === '高铁') {
          if (!isTrainTransport(trip.transport)) return false;
        } else if (activeTransportFilter === 'flight' || activeTransportFilter === '飞机') {
          if (!isFlightTransport(trip.transport)) return false;
        }

        // Year filter
        if (activeYearFilter !== 'all' && !trip.date.startsWith(activeYearFilter)) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchOrigin = (trip.origin || '').toLowerCase().includes(q);
          const matchDest = (trip.destination || '').toLowerCase().includes(q);
          const matchTrain = (trip.trainNumber || '').toLowerCase().includes(q);
          const matchCity =
            originMatch.cityName.toLowerCase().includes(q) ||
            destMatch.cityName.toLowerCase().includes(q);
          if (!matchOrigin && !matchDest && !matchTrain && !matchCity) return false;
        }
        return true;
      })
      .sort((a, b) => b.trip.date.localeCompare(a.trip.date));
  }, [resolvedTrips, activeTransportFilter, activeYearFilter, searchQuery]);

  // Playback Array (Oldest first for chronological route animation playback)
  const chronologicalTrips = useMemo(() => {
    return [...filteredResolvedTrips].reverse();
  }, [filteredResolvedTrips]);

  // 3. Statistics (Requirement 3)
  // Hot Destinations (City Dimension)
  const hotCityStats = useMemo(() => {
    const map = new Map<
      string,
      { cityName: string; province?: string; visitCount: number; totalAmount: number; stations: Set<string> }
    >();

    resolvedTrips.forEach(({ trip, destMatch }) => {
      const city = destMatch.cityName;
      const existing = map.get(city) || {
        cityName: city,
        province: destMatch.matchedRecord?.province,
        visitCount: 0,
        totalAmount: 0,
        stations: new Set<string>(),
      };
      existing.visitCount += 1;
      existing.totalAmount += trip.amount;
      if (destMatch.stationName) {
        existing.stations.add(destMatch.stationName);
      }
      map.set(city, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => b.visitCount - a.visitCount || b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [resolvedTrips]);

  // Hot Railway Stations (Station Dimension)
  const hotStationStats = useMemo(() => {
    const map = new Map<
      string,
      { stationName: string; cityName: string; originCount: number; destCount: number; totalCount: number; totalAmount: number }
    >();

    resolvedTrips.forEach(({ trip, originMatch, destMatch }) => {
      // Origin station
      const stOrigin = originMatch.stationName;
      const exOrigin = map.get(stOrigin) || {
        stationName: stOrigin,
        cityName: originMatch.cityName,
        originCount: 0,
        destCount: 0,
        totalCount: 0,
        totalAmount: 0,
      };
      exOrigin.originCount += 1;
      exOrigin.totalCount += 1;
      exOrigin.totalAmount += trip.amount;
      map.set(stOrigin, exOrigin);

      // Destination station
      const stDest = destMatch.stationName;
      const exDest = map.get(stDest) || {
        stationName: stDest,
        cityName: destMatch.cityName,
        originCount: 0,
        destCount: 0,
        totalCount: 0,
        totalAmount: 0,
      };
      exDest.destCount += 1;
      exDest.totalCount += 1;
      exDest.totalAmount += trip.amount;
      map.set(stDest, exDest);
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalCount - a.totalCount || b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [resolvedTrips]);

  // 4. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Initialize once

    // Default center: Wuhan / Central China
    const map = L.map(mapContainerRef.current, {
      center: [31.5928, 114.3055],
      zoom: 6,
      zoomControl: false,
    });

    // OpenStreetMap open tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Zoom controls on top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fix map resize layout glitch
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    }
  }, [isFullscreenMap]);

  // 5. Render Markers and Route Polylines on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    const layersGroup = layersGroupRef.current;
    layersGroup.clearLayers();

    const bounds: L.LatLngExpression[] = [];
    const stationTripCounts = new Map<string, { lat: number; lng: number; name: string; cityName: string; count: number }>();

    // Collect station visit frequencies
    filteredResolvedTrips.forEach(({ originMatch, destMatch }) => {
      const oKey = `${originMatch.stationName}-${originMatch.lat}-${originMatch.lng}`;
      const dKey = `${destMatch.stationName}-${destMatch.lat}-${destMatch.lng}`;

      const oEx = stationTripCounts.get(oKey) || {
        lat: originMatch.lat,
        lng: originMatch.lng,
        name: originMatch.stationName,
        cityName: originMatch.cityName,
        count: 0,
      };
      oEx.count += 1;
      stationTripCounts.set(oKey, oEx);

      const dEx = stationTripCounts.get(dKey) || {
        lat: destMatch.lat,
        lng: destMatch.lng,
        name: destMatch.stationName,
        cityName: destMatch.cityName,
        count: 0,
      };
      dEx.count += 1;
      stationTripCounts.set(dKey, dEx);
    });

    // Draw Station Markers with custom styled DivIcons
    stationTripCounts.forEach((st) => {
      bounds.push([st.lat, st.lng]);

      const isHotStation = st.count >= 2;
      const html = `
        <div class="relative group cursor-pointer flex flex-col items-center">
          <div class="px-2 py-1 rounded-xl bg-slate-900/90 text-white text-[10px] font-extrabold shadow-md border border-emerald-400 flex items-center gap-1 whitespace-nowrap transform -translate-y-1 group-hover:scale-110 transition-transform">
            <span>🚉</span>
            <span>${st.name}</span>
            <span class="px-1 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-black">${st.count}</span>
          </div>
          <div class="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-md animate-pulse"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html,
        className: 'custom-station-pin',
        iconSize: [80, 40],
        iconAnchor: [40, 36],
      });

      const marker = L.marker([st.lat, st.lng], { icon: customIcon });
      marker.bindPopup(`
        <div class="p-2 space-y-1 font-sans">
          <div class="font-black text-slate-900 text-sm flex items-center gap-1">
            <span>🚉 ${st.name}</span>
            <span class="text-xs text-slate-500">(${st.cityName})</span>
          </div>
          <p class="text-xs text-slate-600 font-bold">累计相关差旅行程: <span class="text-emerald-600">${st.count} 笔</span></p>
        </div>
      `);
      layersGroup.addLayer(marker);
    });

    // Draw Route Lines (Polylines)
    filteredResolvedTrips.forEach(({ trip, originMatch, destMatch }) => {
      const isSelected = selectedTripId === trip.id;

      // Color coding by transport mode
      let color = '#2563eb'; // Default Blue
      if (trip.transport === '火车') color = '#059669'; // Emerald Green
      else if (trip.transport === '飞机') color = '#7c3aed'; // Purple
      else if (trip.transport === '的士' || trip.transport === '网约车') color = '#d97706'; // Amber

      if (isSelected) {
        color = '#ef4444'; // Vivid Red highlight when selected
      }

      const p1: [number, number] = [originMatch.lat, originMatch.lng];
      const p2: [number, number] = [destMatch.lat, destMatch.lng];

      // Polyline line style
      const line = L.polyline([p1, p2], {
        color,
        weight: isSelected ? 6 : 3,
        opacity: isSelected ? 1.0 : 0.65,
        dashArray: trip.transport === '飞机' ? '6, 6' : undefined,
      });

      line.on('click', () => {
        setSelectedTripId(trip.id);
      });

      line.bindPopup(`
        <div class="p-2 space-y-1 font-sans">
          <div class="flex items-center justify-between gap-2 border-b pb-1">
            <span class="font-black text-slate-900 text-xs">${formatChineseDate(trip.date)}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800">${trip.transport} ${trip.trainNumber || ''}</span>
          </div>
          <div class="text-sm font-black text-slate-800 pt-1 flex items-center justify-between">
            <span>${originMatch.stationName} → ${destMatch.stationName}</span>
            <span class="text-rose-600 font-mono">¥${trip.amount.toFixed(2)}</span>
          </div>
          ${trip.remarks ? `<p class="text-xs text-slate-500">${trip.remarks}</p>` : ''}
        </div>
      `);

      layersGroup.addLayer(line);
    });

    // Auto fit bounds if we have points and not currently focusing on a single trip
    if (bounds.length > 0 && !selectedTripId) {
      mapInstanceRef.current.fitBounds(bounds as L.LatLngBoundsExpression, {
        padding: [40, 40],
        maxZoom: 10,
      });
    }
  }, [filteredResolvedTrips, selectedTripId]);

  // 6. Handle Trip Selection -> Fly to Trip on Map (Requirement 2)
  const handleSelectTrip = (tripItem: ResolvedTrip) => {
    setSelectedTripId(tripItem.trip.id);

    if (mapInstanceRef.current) {
      const { originMatch, destMatch } = tripItem;
      const b = L.latLngBounds([
        [originMatch.lat, originMatch.lng],
        [destMatch.lat, destMatch.lng],
      ]);

      mapInstanceRef.current.flyToBounds(b, {
        padding: [80, 80],
        maxZoom: 11,
        duration: 1.2,
      });
    }
  };

  // 7. Route Animation Playback Logic (Requirement 4)
  useEffect(() => {
    if (isPlaying && chronologicalTrips.length > 0) {
      animationTimerRef.current = setInterval(() => {
        setPlaybackIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % chronologicalTrips.length;
          const currentTripObj = chronologicalTrips[nextIndex];
          if (currentTripObj) {
            handleSelectTrip(currentTripObj);
          }
          return nextIndex;
        });
      }, 2500 / playbackSpeed);
    } else if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, chronologicalTrips]);

  const handleStartPlayback = () => {
    if (chronologicalTrips.length === 0) return;
    setIsPlaying(true);
    if (playbackIndex >= chronologicalTrips.length - 1) {
      setPlaybackIndex(0);
      handleSelectTrip(chronologicalTrips[0]);
    } else {
      handleSelectTrip(chronologicalTrips[playbackIndex]);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Search Controls */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-xl bg-blue-600 text-white shadow-xs">
                <Navigation className="w-5 h-5" />
              </span>
              <span>差旅地图可视化看板</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-extrabold border border-blue-200">
                开源地图底层 (OpenStreetMap)
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              基于城市火车站数据库关联，以交互式地图直观呈现始发/目的地热力动线与行程足迹
            </p>
          </div>

          {/* Top Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索城市 / 火车站 / 车次..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none w-48"
              />
            </div>

            {/* Transport Mode Filter */}
            <select
              value={activeTransportFilter}
              onChange={(e) => setActiveTransportFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">🚄✈️ 全部交通类型</option>
              <option value="train">🚆 火车/高铁</option>
              <option value="flight">✈️ 飞机航班</option>
            </select>

            {/* Year Filter */}
            <select
              value={activeYearFilter}
              onChange={(e) => setActiveYearFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">📅 所有年份</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr} 年
                </option>
              ))}
            </select>

            {/* Fullscreen Map Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreenMap(!isFullscreenMap)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              title={isFullscreenMap ? '还原布局' : '全屏地图视角'}
            >
              {isFullscreenMap ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Split Left Map / Right Trip List */}
      <div className={`grid grid-cols-1 ${isFullscreenMap ? 'lg:grid-cols-12' : 'lg:grid-cols-12'} gap-5 items-start`}>
        {/* Left Side: Open-Source Interactive Map (Requirement 2) */}
        <div
          className={`${
            isFullscreenMap ? 'lg:col-span-12' : 'lg:col-span-7 xl:col-span-8'
          } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col relative h-[560px] lg:h-[680px] transition-all`}
        >
          {/* Leaflet Map Canvas Container */}
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Requirement 4 Bonus: Floating Route Animation Playback Controls */}
          <div className="absolute bottom-4 left-4 z-20 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg flex items-center gap-3">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>轨迹连贯播放:</span>
            </span>

            <button
              type="button"
              onClick={() => {
                if (isPlaying) {
                  setIsPlaying(false);
                } else {
                  handleStartPlayback();
                }
              }}
              className={`p-2 rounded-xl text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>暂停</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>播放足迹 ({chronologicalTrips.length})</span>
                </>
              )}
            </button>

            {/* Playback speed selector */}
            <button
              type="button"
              onClick={() => setPlaybackSpeed((sp) => (sp >= 2 ? 1 : sp + 0.5))}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold"
              title="切换播放速度"
            >
              {playbackSpeed}x 速度
            </button>

            {/* Reset View */}
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setSelectedTripId(null);
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([31.5928, 114.3055], 6);
                }
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="复位全国视角"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Chronologically Sorted Trip List (Requirement 2) */}
        {!isFullscreenMap && (
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 flex flex-col h-[560px] lg:h-[680px]">
            {/* Trip List Panel Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1">
              {/* List Panel Header */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      按时间排序的行程列表
                    </h3>
                    <p className="text-[10px] text-slate-400">点击项目即可地图聚焦与路径高亮</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold border border-emerald-300">
                  {filteredResolvedTrips.length} 笔行程
                </span>
              </div>

              {/* Scrollable Trip List */}
              <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
                {filteredResolvedTrips.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs space-y-1">
                    <p>未查找到匹配的行程记录</p>
                    <p className="text-[10px]">可尝试重置顶部筛选条件</p>
                  </div>
                ) : (
                  filteredResolvedTrips.map((item) => {
                    const { trip, originMatch, destMatch } = item;
                    const isSelected = selectedTripId === trip.id;

                    return (
                      <div
                        key={`map-triplist-${trip.id}`}
                        onClick={() => handleSelectTrip(item)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
                            : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        {/* Date & Transport Badge */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-blue-500" />
                            <span>{trip.date}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {trip.transport}
                            </span>
                            {trip.trainNumber && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                                {trip.trainNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Route Nodes */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-100 min-w-0 flex-1">
                            <span className="truncate">{originMatch.stationName}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate text-emerald-600 dark:text-emerald-400">
                              {destMatch.stationName}
                            </span>
                          </div>

                          <span className="text-sm font-black text-[#d65129] dark:text-amber-400 font-mono shrink-0">
                            ¥{trip.amount.toFixed(2)}
                          </span>
                        </div>

                        {/* City Subtitle */}
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            ({originMatch.cityName} → {destMatch.cityName})
                          </span>
                          {isSelected && (
                            <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[10px] animate-pulse">
                              已在地图定位 📍
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Requirement 3: Statistics Panel (Hot Destinations by City & Station) */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                差旅热门目的分析统计
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                按【城市】与【火车站】维度自动汇聚前往频次与累计支出金额
              </p>
            </div>
          </div>

          {/* Dimension Switcher Tab */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveStatTab('city')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                activeStatTab === 'city'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>热门目的地 (城市维度)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStatTab('station')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                activeStatTab === 'station'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span>热门火车站 (车站维度)</span>
            </button>
          </div>
        </div>

        {/* Display City Dimension Stats */}
        {activeStatTab === 'city' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {hotCityStats.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                暂无行程城市统计数据
              </div>
            ) : (
              hotCityStats.map((item, idx) => (
                <div
                  key={`stat-city-${item.cityName}`}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-600 transition-all space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{item.cityName}</span>
                      {item.province && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({item.province})
                        </span>
                      )}
                    </span>

                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center text-white ${
                        idx === 0
                          ? 'bg-amber-500'
                          : idx === 1
                          ? 'bg-slate-400'
                          : idx === 2
                          ? 'bg-amber-700'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      TOP {idx + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/80 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">前往频次</span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                        {item.visitCount} 次
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">费用小计</span>
                      <span className="font-extrabold text-[#d65129] dark:text-amber-400 text-sm font-mono">
                        ¥{item.totalAmount.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {item.stations.size > 0 && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      常用车站: {Array.from(item.stations).join('、')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Display Station Dimension Stats */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {hotStationStats.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                暂无火车站统计数据
              </div>
            ) : (
              hotStationStats.map((item, idx) => (
                <div
                  key={`stat-station-${item.stationName}`}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 block">
                        🚉 {item.stationName}
                      </span>
                      <span className="text-[10px] text-slate-400">所属城市: {item.cityName}</span>
                    </div>

                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center text-white ${
                        idx === 0
                          ? 'bg-emerald-600'
                          : idx === 1
                          ? 'bg-emerald-500'
                          : idx === 2
                          ? 'bg-emerald-400'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/80 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">相关频次</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        {item.totalCount} 次
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">出/到达</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 text-xs font-mono">
                        {item.originCount}发 / {item.destCount}到
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
