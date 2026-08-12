import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getMonthDaysGrid, sortTripsByStartTime } from '../../utils/dateUtils';
import { analyzeTripChains, getChainForDate, CHAIN_THEMES } from '../../utils/tripAnalyzer';
import { CALENDAR_THEMES } from '../../utils/calendarThemes';
import { Plane, Receipt, Plus, Repeat } from 'lucide-react';

export const MonthView: React.FC = () => {
  const {
    calendarFocusDate,
    trips,
    expenses,
    setSelectedDate,
    openDateDetail,
    selectedDate,
    openTripModal,
    calendarDisplayConfig,
  } = useAppStore();

  const daysGrid = getMonthDaysGrid(calendarFocusDate);

  const themeObj = CALENDAR_THEMES[calendarDisplayConfig.theme] || CALENDAR_THEMES.island;

  const WEEKDAYS = calendarDisplayConfig.weekdayFormat === 'zh'
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Analyze all complete round-trip chains
  const allChains = useMemo(() => analyzeTripChains(trips), [trips]);

  // Helper maps for quick lookup per date string
  const tripsByDate = trips.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {} as Record<string, typeof trips>);

  const expensesByDate = expenses.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {} as Record<string, typeof expenses>);

  return (
    <div className={`w-full border-3 ${themeObj.containerBorder} rounded-3xl bg-white dark:bg-slate-900 shadow-md overflow-hidden transition-all`}>
      {/* Weekday Header */}
      <div className={`grid grid-cols-7 border-b-2 ${themeObj.weekdayHeaderBorder} ${themeObj.weekdayHeaderBg} text-center py-3 text-xs font-black ${themeObj.weekdayTextColor}`}>
        {WEEKDAYS.map((day, idx) => (
          <div key={`mwd-${idx}-${day}`} className={idx >= 5 ? 'text-rose-500 font-extrabold' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800">
        {daysGrid.map((cell, idx) => {
          const dayTrips = sortTripsByStartTime(tripsByDate[cell.dateStr] || []);
          const dayExpenses = calendarDisplayConfig.showExpenses ? (expensesByDate[cell.dateStr] || []) : [];

          const tripSum = dayTrips.reduce((sum, t) => sum + t.amount, 0);
          const expSum = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
          const totalCost = tripSum + expSum;

          const isSelected = selectedDate === cell.dateStr;

          // Check if this date belongs to a complete trip chain
          const chain = getChainForDate(allChains, cell.dateStr);
          const chainTheme = chain ? CHAIN_THEMES[chain.themeIndex % CHAIN_THEMES.length] : null;

          return (
            <div
              key={`month-cell-${cell.dateStr}-${idx}`}
              id={`month-cell-${cell.dateStr}`}
              onClick={() => setSelectedDate(cell.dateStr)}
              onDoubleClick={() => openDateDetail(cell.dateStr)}
              className={`min-h-[90px] sm:min-h-[105px] md:min-h-[115px] xl:min-h-[125px] 2xl:min-h-[140px] p-2 flex flex-col justify-between cursor-pointer group transition-all relative rounded-xl border ${
                chain
                  ? `${chainTheme?.bgLight} ${chainTheme?.bgDark} ${chainTheme?.borderLight} ${chainTheme?.borderDark} shadow-xs`
                  : !cell.isCurrentMonth
                  ? 'bg-slate-50/60 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 opacity-60 border-transparent'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-transparent'
              } ${
                isSelected
                  ? `ring-3 ${themeObj.selectedRing} ring-inset ${themeObj.selectedBg} shadow-sm`
                  : ''
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between pb-1">
                <span
                  className={`text-xs font-black w-6 h-6 rounded-xl flex items-center justify-center ${
                    cell.isToday
                      ? `${themeObj.todayBadgeBg} ${themeObj.todayBadgeText} shadow-xs`
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* Quick Add icon on hover */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openTripModal(undefined, cell.dateStr);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 transition-colors"
                    title="为当日添加行程"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Complete Trip Chain Badge */}
              {chain && (
                <div className="mb-1">
                  <span
                    className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md ${chainTheme?.badgeBg} truncate max-w-full flex items-center gap-1 shadow-2xs`}
                    title={`${chain.title} (${chain.startDate}~${chain.endDate})`}
                  >
                    <Repeat className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">
                      {cell.dateStr === chain.startDate
                        ? `🚀 ${chain.startCity}出发`
                        : cell.dateStr === chain.endDate
                        ? `🏁 返还${chain.startCity}`
                        : `📍 ${chain.startCity}往返中`}
                    </span>
                  </span>
                </div>
              )}

              {/* Day Content Area */}
              <div className="my-1 space-y-1.5 flex-1 overflow-hidden">
                {/* Trip items preview */}
                {dayTrips.slice(0, 2).map((t, i) => {
                  const routeStr = t.origin && t.destination
                    ? `${t.origin}→${t.destination}`
                    : t.destination || t.transport;

                  return (
                    <div
                      key={`month-trip-${t.id}-${i}`}
                      className={`p-1.5 rounded-xl ${themeObj.tripBadgeBg} ${themeObj.tripBadgeText} border ${themeObj.tripBadgeBorder} text-[10px] space-y-0.5`}
                    >
                      <div className="flex items-center justify-between font-extrabold truncate">
                        <span className="flex items-center gap-1 truncate">
                          <Plane className="w-3 h-3 shrink-0 transform -rotate-45 opacity-80" />
                          <span className="truncate">{routeStr}</span>
                        </span>
                        {calendarDisplayConfig.showTripTicketCost && (
                          <span className="font-mono text-[9.5px] font-black shrink-0 ml-1">
                            ¥{t.amount}
                          </span>
                        )}
                      </div>
                      {calendarDisplayConfig.showTripStartTime && t.startTime && (
                        <p className="text-[9px] opacity-80 font-mono flex items-center gap-1">
                          <span>🕒 {t.startTime}</span>
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Expense items preview (if showExpenses is true) */}
                {calendarDisplayConfig.showExpenses &&
                  dayExpenses.slice(0, 2 - Math.min(dayTrips.length, 2)).map((exp, i) => (
                    <div
                      key={`month-exp-${exp.id}-${i}`}
                      className="p-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-[10px] flex items-center justify-between font-extrabold"
                    >
                      <span className="flex items-center gap-1 truncate">
                        <Receipt className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">{exp.category}</span>
                      </span>
                      <span className="font-mono font-black shrink-0">
                        ¥{exp.amount}
                      </span>
                    </div>
                  ))}

                {/* Remaining items count indicator */}
                {dayTrips.length + dayExpenses.length > 2 && (
                  <div className="text-[9px] font-extrabold text-slate-400 pl-1">
                    +{dayTrips.length + dayExpenses.length - 2} 项记录...
                  </div>
                )}
              </div>

              {/* Total Daily Cost Badge (if showDailyTotal is true) */}
              {calendarDisplayConfig.showDailyTotal && totalCost > 0 ? (
                <div className="mt-auto pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">合计</span>
                  <div className={`px-2 py-0.5 rounded-lg ${themeObj.totalBadgeBg} ${themeObj.totalBadgeText} text-[10px] font-black shadow-xs font-mono`}>
                    ¥{totalCost.toLocaleString('zh-CN', { maximumFractionDigits: 1 })}
                  </div>
                </div>
              ) : (
                <div className="mt-auto h-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
