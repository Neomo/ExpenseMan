import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatChineseDate } from '../../utils/dateUtils';
import {
  Plane,
  Receipt,
  Plus,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  CalendarDays,
  Maximize2,
} from 'lucide-react';

export const CalendarRightPanel: React.FC = () => {
  const {
    selectedDate,
    trips,
    expenses,
    openTripModal,
    openExpenseModal,
    openDateDetail,
    deleteTrip,
    deleteExpense,
  } = useAppStore();

  const dayTrips = trips.filter((t) => t.date === selectedDate);
  const dayExpenses = expenses.filter((e) => e.date === selectedDate);

  const tripSum = dayTrips.reduce((sum, t) => sum + t.amount, 0);
  const expSum = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const grandTotal = tripSum + expSum;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-3 border-[#c2e8d0] dark:border-slate-800 rounded-3xl shadow-md p-5 flex flex-col space-y-4 transition-all">
      {/* Panel Header */}
      <div className="pb-3 border-b-2 border-[#d0eedb] dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-[#e3f6ec] text-[#2f8859] dark:bg-emerald-950 dark:text-emerald-300">
            <CalendarDays className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#3b322a] dark:text-slate-100 flex items-center gap-1">
              <span>{formatChineseDate(selectedDate)}</span>
            </h3>
            <p className="text-[11px] font-bold text-[#8e8071] dark:text-slate-400">
              单击选中的具体日期明细
            </p>
          </div>
        </div>

        {/* Double click / expand detail button */}
        <button
          onClick={() => openDateDetail(selectedDate)}
          className="p-2 rounded-2xl bg-[#faf5e8] hover:bg-[#eadaa8]/50 text-[#54411f] dark:bg-slate-800 dark:text-slate-300 border-2 border-[#eadaa8] dark:border-slate-700 transition-colors"
          title="弹窗全屏查看详情 (或直接双击日期)"
        >
          <Maximize2 className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Daily Cost Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-2xl bg-[#eaf5fc] dark:bg-sky-950/40 border border-[#c3e3f7] dark:border-sky-900/40 text-center">
          <span className="text-[10px] font-extrabold text-[#297bb1] dark:text-sky-300 block">
            ✈️ 交通
          </span>
          <span className="text-xs font-black text-[#297bb1] dark:text-sky-200 font-mono">
            ¥{tripSum.toFixed(1)}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-[#e8f7ee] dark:bg-emerald-950/40 border border-[#a2e0bd] dark:border-emerald-900/40 text-center">
          <span className="text-[10px] font-extrabold text-[#2f8859] dark:text-emerald-300 block">
            🪙 费用
          </span>
          <span className="text-xs font-black text-[#2f8859] dark:text-emerald-200 font-mono">
            ¥{expSum.toFixed(1)}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-[#fdf2e9] dark:bg-amber-950/40 border border-[#f5d7c8] dark:border-amber-900/40 text-center">
          <span className="text-[10px] font-extrabold text-[#d65129] dark:text-amber-300 block">
            🍃 总计
          </span>
          <span className="text-xs font-black text-[#d65129] dark:text-amber-200 font-mono">
            ¥{grandTotal.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Quick Add Buttons Bar */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => openTripModal(undefined, selectedDate)}
          className="flex-1 btn-island-dodo py-2 text-xs flex items-center justify-center gap-1 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>加行程</span>
        </button>
        <button
          onClick={() => openExpenseModal(undefined, selectedDate)}
          className="flex-1 btn-island-primary py-2 text-xs flex items-center justify-center gap-1 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>加费用</span>
        </button>
      </div>

      {/* Records Section */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px] max-h-[480px] pr-1">
        {dayTrips.length === 0 && dayExpenses.length === 0 ? (
          <div className="py-10 px-4 text-center border-2 border-dashed border-[#b8e2cb] dark:border-slate-800 rounded-3xl bg-[#fbfdfc] dark:bg-slate-900/50 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#e3f6ec] text-[#2f8859] flex items-center justify-center text-2xl font-black">
              🏝️
            </div>
            <p className="text-sm font-black text-[#3b322a] dark:text-slate-200">
              当天暂无行程与费用记录
            </p>
            <p className="text-xs font-bold text-[#8e8071] dark:text-slate-400 max-w-[200px]">
              点击上方按钮或双击日历格，即可为此日期添加差旅信息
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Trips List */}
            {dayTrips.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl border-2 border-[#c3e3f7] bg-[#f4f9fd] dark:bg-slate-800/80 dark:border-slate-700 flex items-start justify-between gap-3 shadow-xs hover:border-[#297bb1] transition-all"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-[#297bb1] text-white shrink-0 mt-0.5 shadow-xs">
                    <Plane className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-[#1d5275] dark:text-sky-200 text-xs">
                        {t.transport}
                      </span>
                      {(t.startTime || t.endTime) && (
                        <span className="text-[10px] font-bold text-[#5c8cae] dark:text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {t.startTime || '--:--'} ~ {t.endTime || '--:--'}
                        </span>
                      )}
                    </div>
                    {(t.origin || t.destination) && (
                      <p className="text-xs font-bold text-[#356180] dark:text-slate-300 mt-1 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#297bb1] shrink-0" />
                        <span className="truncate">{t.origin || '出发地'}</span>
                        <span className="text-[#88adc8]">→</span>
                        <span className="truncate">{t.destination || '目的地'}</span>
                      </p>
                    )}
                    {t.remarks && (
                      <p className="text-[11px] font-medium text-[#658ba5] dark:text-slate-400 mt-0.5 truncate">
                        {t.remarks}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 justify-between h-full gap-2">
                  <span className="text-sm font-black text-[#1d5275] dark:text-sky-300 font-mono">
                    ¥{t.amount.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openTripModal(t, selectedDate)}
                      className="p-1 rounded-lg text-[#5c8cae] hover:text-[#1d5275] hover:bg-[#dbeefa] transition-colors"
                      title="编辑行程"
                    >
                      <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={() => deleteTrip(t.id)}
                      className="p-1 rounded-lg text-[#e85a4f] hover:bg-[#fcebe6] transition-colors"
                      title="删除行程"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Expenses List */}
            {dayExpenses.map((e) => (
              <div
                key={e.id}
                className="p-3.5 rounded-2xl border-2 border-[#a2e0bd] bg-[#f0faf4] dark:bg-slate-800/80 dark:border-slate-700 flex items-start justify-between gap-3 shadow-xs hover:border-[#52c488] transition-all"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-[#52c488] text-white shrink-0 mt-0.5 shadow-xs">
                    <Receipt className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-[#21633f] dark:text-emerald-200 text-xs block">
                      {e.category}
                    </span>
                    {e.description && (
                      <p className="text-xs font-bold text-[#3d835d] dark:text-slate-300 mt-1 truncate">
                        {e.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 justify-between h-full gap-2">
                  <span className="text-sm font-black text-[#21633f] dark:text-emerald-300 font-mono">
                    ¥{e.amount.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openExpenseModal(e, selectedDate)}
                      className="p-1 rounded-lg text-[#3d835d] hover:text-[#21633f] hover:bg-[#d2f2e0] transition-colors"
                      title="编辑费用"
                    >
                      <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={() => deleteExpense(e.id)}
                      className="p-1 rounded-lg text-[#e85a4f] hover:bg-[#fcebe6] transition-colors"
                      title="删除费用"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
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
