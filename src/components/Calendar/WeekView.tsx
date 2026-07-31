import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getWeekDaysGrid, formatChineseDate } from '../../utils/dateUtils';
import { Plane, Receipt, Plus, MapPin, Clock } from 'lucide-react';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

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
  } = useAppStore();

  const weekGrid = getWeekDaysGrid(calendarFocusDate);

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {weekGrid.map((cell, idx) => {
        const dayTrips = trips.filter((t) => t.date === cell.dateStr);
        const dayExpenses = expenses.filter((e) => e.date === cell.dateStr);

        const tripSum = dayTrips.reduce((sum, t) => sum + t.amount, 0);
        const expSum = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
        const total = tripSum + expSum;

        const isSelected = selectedDate === cell.dateStr;

        return (
          <div
            key={cell.dateStr}
            id={`week-col-${cell.dateStr}`}
            onClick={() => setSelectedDate(cell.dateStr)}
            onDoubleClick={() => openDateDetail(cell.dateStr)}
            className={`p-3 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:border-[#52c488] dark:hover:border-[#52c488] ${
              isSelected
                ? 'border-[#52c488] ring-3 ring-[#52c488]/30 bg-[#e8f7ee]/30 dark:bg-emerald-950/20'
                : 'border-[#e0f0e6] dark:border-slate-800'
            }`}
          >
            {/* Column Header */}
            <div className="pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{WEEKDAYS[idx]}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      cell.isToday
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {cell.date.getMonth() + 1}月
                  </span>
                </div>
              </div>

              {total > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">小计</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ¥{total.toFixed(0)}
                  </span>
                </div>
              )}
            </div>

            {/* List Preview */}
            <div className="space-y-2 flex-1 my-1 min-h-[140px] overflow-y-auto">
              {dayTrips.map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-medium text-blue-900 dark:text-blue-200">
                    <span className="flex items-center gap-1">
                      <Plane className="w-3 h-3 text-blue-500 shrink-0" />
                      {t.transport}
                    </span>
                    <span className="font-bold">¥{t.amount}</span>
                  </div>
                  {t.destination && (
                    <div className="text-[10px] text-blue-700 dark:text-blue-300 truncate">
                      到: {t.destination}
                    </div>
                  )}
                </div>
              ))}

              {dayExpenses.map((e) => (
                <div
                  key={e.id}
                  className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-medium text-emerald-900 dark:text-emerald-200">
                    <span className="flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-emerald-500 shrink-0" />
                      {e.category}
                    </span>
                    <span className="font-bold">¥{e.amount}</span>
                  </div>
                  {e.description && (
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate">
                      {e.description}
                    </div>
                  )}
                </div>
              ))}

              {dayTrips.length === 0 && dayExpenses.length === 0 && (
                <div className="text-center py-8 text-slate-300 dark:text-slate-700 text-xs">
                  无记录
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openTripModal(undefined, cell.dateStr);
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> 行程
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openExpenseModal(undefined, cell.dateStr);
                }}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
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
