import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { DateDetailModal } from './DateDetailModal';
import { CalendarRightPanel } from './CalendarRightPanel';
import { ClosedLoopDrawer } from './ClosedLoopDrawer';

export const CalendarView: React.FC = () => {
  const { currentViewMode, calendarFocusDate, trips, expenses } = useAppStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

      {/* Main Layout with Calendar in Center (Expands to fill) and Details Side Panel on Right */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        <div className="flex-1 min-w-0 w-full space-y-6">
          {currentViewMode === 'month' && <MonthView />}
          {currentViewMode === 'week' && <WeekView />}
          {currentViewMode === 'day' && <DayView />}
        </div>

        <div className="w-full lg:w-[280px] xl:w-[320px] 2xl:w-[360px] shrink-0 sticky top-20">
          <CalendarRightPanel />
        </div>
      </div>

      {/* Requirement 1: Slide-Over Drawer on Right Edge of Viewport */}
      <ClosedLoopDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpen={() => setIsDrawerOpen(true)}
      />

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

