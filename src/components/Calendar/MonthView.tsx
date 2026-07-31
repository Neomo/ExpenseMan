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
          <div key={day} className={idx >= 5 ? 'text-[#e85a4f] dark:text-rose-400 font-extrabold' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#eaf4ed] dark:divide-slate-800/80">
        {daysGrid.map((cell) => {
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
              key={cell.dateStr}
              id={`month-cell-${cell.dateStr}`}
              onClick={() => setSelectedDate(cell.dateStr)}
              onDoubleClick={() => openDateDetail(cell.dateStr)}
              className={`min-h-[105px] sm:min-h-[120px] p-2 flex flex-col justify-between cursor-pointer group transition-all relative ${
                !cell.isCurrentMonth
                  ? 'bg-[#f8fbf9]/60 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 opacity-60'
                  : 'bg-white dark:bg-slate-900 text-[#433932] dark:text-slate-200 hover:bg-[#f0f8f3] dark:hover:bg-slate-800/60'
              } ${
                isSelected
                  ? 'ring-3 ring-[#52c488] ring-inset bg-[#e8f7ee] dark:bg-emerald-950/40'
                  : ''
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-extrabold w-6 h-6 rounded-xl flex items-center justify-center ${
                    cell.isToday
                      ? 'bg-[#52c488] text-white shadow-xs border-b-2 border-[#379462]'
                      : 'text-[#53473c] dark:text-slate-300'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* Quick Add icon on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openTripModal(undefined, cell.dateStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-[#d0eedb] dark:hover:bg-slate-700 text-[#52c488] transition-opacity"
                  title="为当日添加行程"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>

              {/* Destinations Tag List */}
              <div className="my-1 space-y-1 overflow-hidden">
                {destinations.slice(0, 2).map((dest, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded-lg bg-[#e3f6ec] text-[#2f8859] dark:bg-emerald-950/80 dark:text-emerald-300 border border-[#a2e0bd] dark:border-emerald-900/60 truncate"
                    title={dest}
                  >
                    <MapPin className="w-2.5 h-2.5 text-[#52c488] shrink-0" />
                    <span className="truncate">{dest}</span>
                  </div>
                ))}
                {destinations.length > 2 && (
                  <span className="text-[9px] text-[#8e8071] dark:text-slate-500 pl-1 font-mono font-bold">
                    +{destinations.length - 2} 处
                  </span>
                )}
              </div>

              {/* Total Daily Cost Badge */}
              {totalCost > 0 ? (
                <div className="mt-auto pt-1 flex items-center justify-between">
                  <div className="px-2 py-0.5 rounded-lg bg-[#52c488] text-white text-[10px] font-black shadow-xs truncate max-w-full font-mono">
                    ¥{totalCost.toLocaleString('zh-CN', { maximumFractionDigits: 1 })}
                  </div>
                </div>
              ) : (
                <div className="mt-auto h-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
