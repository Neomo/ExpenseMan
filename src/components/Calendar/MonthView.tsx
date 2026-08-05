import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getMonthDaysGrid } from '../../utils/dateUtils';
import { Plane, Receipt, MapPin, Plus } from 'lucide-react';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const MonthView: React.FC = () => {
  const {
    calendarFocusDate,
    trips,
    expenses,
    setSelectedDate,
    openDateDetail,
    selectedDate,
    openTripModal,
  } = useAppStore();

  const daysGrid = getMonthDaysGrid(calendarFocusDate);

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
    <div className="w-full border-3 border-[#c2e8d0] dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-md overflow-hidden transition-colors">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b-2 border-[#d0eedb] dark:border-slate-800 bg-[#faf5e8] dark:bg-slate-800/80 text-center py-3 text-xs font-black text-[#69533f] dark:text-slate-300">
        {WEEKDAYS.map((day, idx) => (
          <div key={`mwd-${idx}-${day}`} className={idx >= 5 ? 'text-[#e85a4f] dark:text-rose-400 font-extrabold' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#eaf4ed] dark:divide-slate-800/80">
        {daysGrid.map((cell, idx) => {
          const dayTrips = tripsByDate[cell.dateStr] || [];
          const dayExpenses = expensesByDate[cell.dateStr] || [];

          const tripSum = dayTrips.reduce((sum, t) => sum + t.amount, 0);
          const expSum = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
          const totalCost = tripSum + expSum;

          // Unique destinations visited
          const destinations = Array.from(
            new Set(
              dayTrips
                .map((t) => t.destination)
                .filter((d): d is string => Boolean(d && d.trim()))
            )
          );

          const isSelected = selectedDate === cell.dateStr;

          return (
            <div
              key={`month-cell-${cell.dateStr}-${idx}`}
              id={`month-cell-${cell.dateStr}`}
              onClick={() => setSelectedDate(cell.dateStr)}
              onDoubleClick={() => openDateDetail(cell.dateStr)}
              className={`min-h-[140px] sm:min-h-[160px] lg:min-h-[175px] xl:min-h-[190px] p-2.5 flex flex-col justify-between cursor-pointer group transition-all relative rounded-xl border border-transparent ${
                !cell.isCurrentMonth
                  ? 'bg-[#f8fbf9]/60 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 opacity-60'
                  : 'bg-white dark:bg-slate-900 text-[#433932] dark:text-slate-200 hover:bg-[#f0f8f3] dark:hover:bg-slate-800/60'
              } ${
                isSelected
                  ? 'ring-3 ring-[#52c488] ring-inset bg-[#e8f7ee] dark:bg-emerald-950/40 shadow-sm'
                  : ''
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between pb-1">
                <span
                  className={`text-xs font-black w-6 h-6 rounded-xl flex items-center justify-center ${
                    cell.isToday
                      ? 'bg-[#52c488] text-white shadow-xs border-b-2 border-[#379462]'
                      : 'text-[#53473c] dark:text-slate-300'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* Quick Add icons on hover */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openTripModal(undefined, cell.dateStr);
                    }}
                    className="p-1 rounded-lg hover:bg-[#d0eedb] dark:hover:bg-slate-700 text-[#52c488] transition-colors"
                    title="为当日添加行程"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Day Content Area (Rich Trips & Expenses display) */}
              <div className="my-1 space-y-1.5 flex-1 overflow-hidden">
                {/* Trip items preview */}
                {dayTrips.slice(0, 2).map((t, i) => {
                  const routeStr = t.origin && t.destination
                    ? `${t.origin}→${t.destination}`
                    : t.destination || t.transport;

                  return (
                    <div
                      key={`month-trip-${t.id}-${i}`}
                      className="p-1.5 rounded-xl bg-[#eaf7f0] dark:bg-emerald-950/60 text-[#21633f] dark:text-emerald-300 border border-[#a8e3c1] dark:border-emerald-900/60 text-[10px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between font-extrabold truncate">
                        <span className="flex items-center gap-1 truncate">
                          <Plane className="w-3 h-3 text-[#52c488] shrink-0 transform -rotate-45" />
                          <span className="truncate">{routeStr}</span>
                        </span>
                        <span className="font-mono text-[9.5px] font-black shrink-0 text-[#1d5435] dark:text-emerald-200">
                          ¥{t.amount}
                        </span>
                      </div>
                      {t.startTime && (
                        <p className="text-[9px] text-[#4d8262] dark:text-slate-400 font-mono flex items-center gap-1">
                          <span>🕒 {t.startTime}</span>
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Expense items preview */}
                {dayExpenses.slice(0, 2 - Math.min(dayTrips.length, 2)).map((exp, i) => (
                  <div
                    key={`month-exp-${exp.id}-${i}`}
                    className="p-1.5 rounded-xl bg-[#fdf6ea] dark:bg-amber-950/50 text-[#85531d] dark:text-amber-300 border border-[#f0d3a5] dark:border-amber-900/60 text-[10px] flex items-center justify-between font-extrabold"
                  >
                    <span className="flex items-center gap-1 truncate">
                      <Receipt className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{exp.category}</span>
                    </span>
                    <span className="font-mono font-black shrink-0 text-[#633a0e] dark:text-amber-200">
                      ¥{exp.amount}
                    </span>
                  </div>
                ))}

                {/* Remaining items count indicator */}
                {dayTrips.length + dayExpenses.length > 2 && (
                  <div className="text-[9px] font-extrabold text-[#7e9987] dark:text-slate-400 pl-1">
                    +{dayTrips.length + dayExpenses.length - 2} 项记录...
                  </div>
                )}
              </div>

              {/* Total Daily Cost Badge */}
              {totalCost > 0 ? (
                <div className="mt-auto pt-1 flex items-center justify-between border-t border-[#edf6f0] dark:border-slate-800/80">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">合计</span>
                  <div className="px-2 py-0.5 rounded-lg bg-[#52c488] text-white text-[10px] font-black shadow-xs font-mono">
                    ¥{totalCost.toLocaleString('zh-CN', { maximumFractionDigits: 1 })}
                  </div>
                </div>
              ) : (
                <div className="mt-auto h-3" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
