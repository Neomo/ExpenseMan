import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatDateStr, formatChineseDate } from '../../utils/dateUtils';
import { Plane, Receipt, Plus, MapPin, Clock, Edit2, Trash2 } from 'lucide-react';

export const DayView: React.FC = () => {
  const {
    calendarFocusDate,
    trips,
    expenses,
    openTripModal,
    openExpenseModal,
    deleteTrip,
    deleteExpense,
  } = useAppStore();

  const focusDateStr = formatDateStr(calendarFocusDate);

  const dayTrips = trips.filter((t) => t.date === focusDateStr);
  const dayExpenses = expenses.filter((e) => e.date === focusDateStr);

  const tripSum = dayTrips.reduce((sum, t) => sum + t.amount, 0);
  const expSum = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const grandTotal = tripSum + expSum;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
      {/* Date Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatChineseDate(focusDateStr)}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            单日行程与费用聚合时间轴
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openTripModal(undefined, focusDateStr)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>添加行程</span>
          </button>
          <button
            onClick={() => openExpenseModal(undefined, focusDateStr)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>添加费用</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
          <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">交通行程花费</span>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-200 mt-1">
            ¥ {tripSum.toFixed(2)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
          <span className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">日常其他费用</span>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-200 mt-1">
            ¥ {expSum.toFixed(2)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">当日花费总计</span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            ¥ {grandTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          明细记录 ({dayTrips.length + dayExpenses.length})
        </h3>

        {dayTrips.length === 0 && dayExpenses.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm">
            该日暂无行程或费用记录，点击右上角按钮开始添加
          </div>
        ) : (
          <div className="space-y-3">
            {/* Trips */}
            {dayTrips.map((t, idx) => (
              <div
                key={`dtrip-${t.id}-${idx}`}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        {t.transport} 行程
                      </span>
                      {(t.startTime || t.endTime) && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t.startTime || '--:--'} ~ {t.endTime || '--:--'}
                        </span>
                      )}
                    </div>
                    {(t.origin || t.destination) && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span>{t.origin || '起点'}</span>
                        <span className="text-slate-400">→</span>
                        <span>{t.destination || '终点'}</span>
                      </p>
                    )}
                    {t.remarks && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        备注：{t.remarks}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    ¥ {t.amount.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openTripModal(t, focusDateStr)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTrip(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Expenses */}
            {dayExpenses.map((e, idx) => (
              <div
                key={`dexp-${e.id}-${idx}`}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {e.category}
                    </span>
                    {e.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        说明：{e.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    ¥ {e.amount.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openExpenseModal(e, focusDateStr)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteExpense(e.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
