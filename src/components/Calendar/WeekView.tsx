import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getWeekDaysGrid, sortTripsByStartTime } from '../../utils/dateUtils';
import { CALENDAR_THEMES } from '../../utils/calendarThemes';
import { Plane, Receipt, Plus } from 'lucide-react';

export const WeekView: React.FC = () => {
  const {
    calendarFocusDate,
    trips,
    expenses,
    setSelectedDate,
    openDateDetail,
    selectedDate,
    openTripModal,
    openExpenseModal,
    calendarDisplayConfig,
  } = useAppStore();

  const weekGrid = getWeekDaysGrid(calendarFocusDate);
  const themeObj = CALENDAR_THEMES[calendarDisplayConfig.theme] || CALENDAR_THEMES.island;

  const WEEKDAYS = calendarDisplayConfig.weekdayFormat === 'zh'
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {weekGrid.map((cell, idx) => {
        const dayTrips = sortTripsByStartTime(trips.filter((t) => t.date === cell.dateStr));
        const dayExpenses = calendarDisplayConfig.showExpenses ? expenses.filter((e) => e.date === cell.dateStr) : [];

        const tripSum = dayTrips.reduce((sum, t) => sum + t.amount, 0);
        const expSum = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
        const total = tripSum + expSum;

        const isSelected = selectedDate === cell.dateStr;

        return (
          <div
            key={`week-cell-${cell.dateStr}-${idx}`}
            id={`week-col-${cell.dateStr}`}
            onClick={() => setSelectedDate(cell.dateStr)}
            onDoubleClick={() => openDateDetail(cell.dateStr)}
            className={`p-3 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:border-emerald-500 ${
              isSelected
                ? `ring-3 ${themeObj.selectedRing} ${themeObj.selectedBg}`
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Column Header */}
            <div className="pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{WEEKDAYS[idx]}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-sm font-black w-6 h-6 rounded-lg flex items-center justify-center ${
                      cell.isToday
                        ? `${themeObj.todayBadgeBg} ${themeObj.todayBadgeText}`
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {cell.date.getMonth() + 1}月
                  </span>
                </div>
              </div>

              {calendarDisplayConfig.showDailyTotal && total > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">小计</span>
                  <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ¥{total.toFixed(0)}
                  </span>
                </div>
              )}
            </div>

            {/* List Preview */}
            <div className="space-y-2 flex-1 my-1 min-h-[140px] overflow-y-auto">
              {dayTrips.map((t, tIdx) => (
                <div
                  key={`wtrip-${t.id}-${tIdx}`}
                  className={`p-2 rounded-xl ${themeObj.tripBadgeBg} ${themeObj.tripBadgeText} border ${themeObj.tripBadgeBorder} text-xs space-y-1`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      <Plane className="w-3 h-3 shrink-0" />
                      {t.transport}
                    </span>
                    {calendarDisplayConfig.showTripTicketCost && (
                      <span className="font-mono font-black">¥{t.amount}</span>
                    )}
                  </div>
                  {t.origin && t.destination ? (
                    <div className="text-[10px] opacity-90 truncate">
                      {t.origin} → {t.destination}
                    </div>
                  ) : t.destination ? (
                    <div className="text-[10px] opacity-90 truncate">
                      到: {t.destination}
                    </div>
                  ) : null}
                  {calendarDisplayConfig.showTripStartTime && t.startTime && (
                    <div className="text-[9px] opacity-75 font-mono">
                      🕒 {t.startTime}
                    </div>
                  )}
                </div>
              ))}

              {calendarDisplayConfig.showExpenses && dayExpenses.map((e, eIdx) => (
                <div
                  key={`wexp-${e.id}-${eIdx}`}
                  className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs space-y-1 text-amber-950 dark:text-amber-200"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-amber-600 shrink-0" />
                      {e.category}
                    </span>
                    <span className="font-mono font-black">¥{e.amount}</span>
                  </div>
                  {e.description && (
                    <div className="text-[10px] opacity-80 truncate">
                      {e.description}
                    </div>
                  )}
                </div>
              ))}

              {dayTrips.length === 0 && (!calendarDisplayConfig.showExpenses || dayExpenses.length === 0) && (
                <div className="text-center py-8 text-slate-300 dark:text-slate-700 text-xs">
                  无记录
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openTripModal(undefined, cell.dateStr);
                }}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <Plus className="w-3 h-3" /> 行程
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openExpenseModal(undefined, cell.dateStr);
                }}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold"
              >
                <Plus className="w-3 h-3" /> 费用
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
