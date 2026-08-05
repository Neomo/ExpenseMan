import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { DateDetailModal } from './DateDetailModal';
import { CalendarRightPanel } from './CalendarRightPanel';
import { analyzeTripChains, CHAIN_THEMES } from '../../utils/tripAnalyzer';
import { motion, AnimatePresence } from 'motion/react';
import { X, Repeat, ArrowRight, Compass } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { currentViewMode, calendarFocusDate, trips, expenses, setSelectedDate } = useAppStore();
  const [showTip, setShowTip] = useState(true);

  // Compute all detected complete trip chains
  const tripChains = useMemo(() => analyzeTripChains(trips), [trips]);

  // Auto-hide interaction tip after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTip(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Compute stats for current focused month
  const focusedYear = calendarFocusDate.getFullYear();
  const focusedMonth = calendarFocusDate.getMonth() + 1;
  const currentYYYYMM = `${focusedYear}-${String(focusedMonth).padStart(2, '0')}`;

  const monthTrips = trips.filter((t) => t.date.startsWith(currentYYYYMM));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentYYYYMM));

  const monthTripsTotal = monthTrips.reduce((acc, t) => acc + t.amount, 0);
  const monthExpensesTotal = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
  const monthGrandTotal = monthTripsTotal + monthExpensesTotal;

  // Most frequent destination
  const destCounts: Record<string, number> = {};
  monthTrips.forEach((t) => {
    if (t.destination && t.destination.trim()) {
      const d = t.destination.trim();
      destCounts[d] = (destCounts[d] || 0) + 1;
    }
  });

  let topDest = '暂无记录';
  let maxD = 0;
  Object.entries(destCounts).forEach(([dest, count]) => {
    if (count > maxD) {
      maxD = count;
      topDest = dest;
    }
  });

  return (
    <div className="space-y-6">
      <CalendarHeader />

      {/* Smart Round-Trip Chain Analysis Banner */}
      {tripChains.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-[#eef9f2] via-[#f0f4ff] to-[#fef7eb] dark:from-emerald-950/40 dark:via-indigo-950/40 dark:to-amber-950/40 border-2 border-[#b5e2c8] dark:border-slate-700 rounded-3xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#52c488] text-white text-xs font-black shadow-xs flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5" />
                <span>智能闭环解析</span>
              </span>
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                已自动识别 <span className="text-[#3cae74] dark:text-emerald-400 font-mono text-sm font-black">{tripChains.length}</span> 组从出发地又返回出发地的完整出差行程 (日历格已按同色相连高亮)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-bold">
              💡 点击路线标签可聚焦至首日日历
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {tripChains.map((chain) => {
              const theme = CHAIN_THEMES[chain.themeIndex % CHAIN_THEMES.length];
              return (
                <button
                  key={`chain-banner-${chain.id}`}
                  onClick={() => setSelectedDate(chain.startDate)}
                  className={`px-3 py-2 rounded-2xl border ${theme.borderLight} ${theme.borderDark} ${theme.bgLight} ${theme.bgDark} hover:scale-[1.01] transition-all flex items-center gap-2 text-xs font-bold shadow-2xs group`}
                  title="点击在日历中高亮定位此完整行程"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${theme.dotColor} shrink-0 group-hover:animate-ping`} />
                  <span className={`${theme.badgeText} font-black flex items-center gap-1`}>
                    <span>{chain.startCity}往返闭环</span>
                    <span className="text-[10px] opacity-80">
                      ({chain.cities.join(' ➔ ')})
                    </span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    {chain.startDate} ~ {chain.endDate} ({chain.totalDays}天)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid with Calendar on Left (Expanded for Widescreen) and Details Side Panel on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 2xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 2xl:col-span-9 space-y-6">
          {currentViewMode === 'month' && <MonthView />}
          {currentViewMode === 'week' && <WeekView />}
          {currentViewMode === 'day' && <DayView />}
        </div>

        <div className="xl:col-span-4 2xl:col-span-3 sticky top-4">
          <CalendarRightPanel />
        </div>
      </div>

      {/* Quick Stats Row (Animal Island UI Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="card-island bg-white dark:bg-slate-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#8e8071] dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>🪙 本月总支出</span>
            </p>
            <p className="text-2xl font-black text-[#d65129] dark:text-amber-400 font-mono">
              ¥{monthGrandTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#fdf2e9] text-[#e25f38] flex items-center justify-center font-bold text-lg border border-[#f5d7c8]">
            💰
          </div>
        </div>

        <div className="card-island bg-white dark:bg-slate-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#8e8071] dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>🦤 差旅总次数</span>
            </p>
            <p className="text-2xl font-black text-[#297bb1] dark:text-sky-400 font-mono">
              {monthTrips.length} <span className="text-sm font-bold text-[#8e8071] dark:text-slate-500">次出差</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#eaf5fc] text-[#297bb1] flex items-center justify-center font-bold text-lg border border-[#c3e3f7]">
            ✈️
          </div>
        </div>

        <div className="card-island bg-white dark:bg-slate-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#8e8071] dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>🏝️ 最常目的地</span>
            </p>
            <p className="text-xl font-black text-[#2f8859] dark:text-emerald-400 truncate">
              {topDest}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#e8f7ee] text-[#2f8859] flex items-center justify-center font-bold text-lg border border-[#a2e0bd]">
            🍃
          </div>
        </div>
      </div>

      <DateDetailModal />
    </div>
  );
};

