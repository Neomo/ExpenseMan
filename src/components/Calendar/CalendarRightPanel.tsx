import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatChineseDate, sortTripsByStartTime } from '../../utils/dateUtils';
import { analyzeTripChains, getChainForDate, CHAIN_THEMES } from '../../utils/tripAnalyzer';
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
  Repeat,
  Sparkles,
  Ticket,
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
    setSelectedDate,
  } = useAppStore();

  const allChains = useMemo(() => analyzeTripChains(trips), [trips]);
  const activeChain = useMemo(() => getChainForDate(allChains, selectedDate), [allChains, selectedDate]);
  const activeTheme = activeChain ? CHAIN_THEMES[activeChain.themeIndex % CHAIN_THEMES.length] : null;

  // Filter dayTrips and sort by departure time (earliest to latest)
  const dayTrips = sortTripsByStartTime(trips.filter((t) => t.date === selectedDate));
  const dayExpenses = expenses.filter((e) => e.date === selectedDate);

  const tripSum = dayTrips.reduce((sum, t) => sum + t.amount, 0);
  const expSum = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const grandTotal = tripSum + expSum;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-3 border-[#c2e8d0] dark:border-slate-800 rounded-3xl shadow-md p-5 xl:p-6 flex flex-col space-y-4 transition-all">
      {/* Panel Header */}
      <div className="pb-3 border-b-2 border-[#d0eedb] dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2.5 rounded-2xl bg-[#e3f6ec] text-[#2f8859] dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
            <CalendarDays className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base xl:text-lg font-black text-[#3b322a] dark:text-slate-100 truncate">
              {formatChineseDate(selectedDate)}
            </h3>
            <p className="text-xs font-bold text-[#8e8071] dark:text-slate-400 flex items-center gap-1">
              <span>🍃</span>
              <span>当日差旅详情与记账明细</span>
            </p>
          </div>
        </div>

        {/* Double click / expand detail button */}
        <button
          onClick={() => openDateDetail(selectedDate)}
          className="p-2 rounded-2xl bg-[#faf5e8] hover:bg-[#eadaa8]/50 text-[#54411f] dark:bg-slate-800 dark:text-slate-300 border-2 border-[#eadaa8] dark:border-slate-700 transition-colors shrink-0 flex items-center gap-1 text-xs font-bold"
          title="全屏弹窗查看详情 (或直接双击日期)"
        >
          <Maximize2 className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">全屏</span>
        </button>
      </div>

      {/* 智能闭环解析 区域，仅显示当天相关的闭环 */}
      {activeChain && activeTheme ? (
        <div className={`p-4 rounded-2xl border-2 ${activeTheme.borderLight} ${activeTheme.borderDark} ${activeTheme.bgLight} ${activeTheme.bgDark} space-y-2.5 shadow-xs transition-all`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${activeTheme.badgeBg} flex items-center gap-1 shadow-2xs`}>
              <Repeat className="w-3.5 h-3.5" />
              <span>所属闭环行程</span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
              {activeChain.startDate} ~ {activeChain.endDate} ({activeChain.totalDays}天)
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
              往返闭环线路：
            </span>
            <div className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
              {activeChain.cities.map((city, cIdx) => (
                <React.Fragment key={`chain-city-${cIdx}`}>
                  <span className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    {city}
                  </span>
                  {cIdx < activeChain.cities.length - 1 && (
                    <span className="text-slate-400">➔</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 pt-2 border-t border-black/5 dark:border-white/10">
            <span>涵盖 {activeChain.legs.length} 段交通</span>
            <span className="font-mono text-[#d65129] dark:text-amber-300 font-black text-sm">
              闭环交通费: ¥{activeChain.totalCost.toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500">
              <Repeat className="w-3.5 h-3.5" />
            </div>
            <span>当日闭环：<span className="font-normal text-slate-400">独立单程或暂无闭环</span></span>
          </div>
        </div>
      )}

      {/* Daily Cost Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-[#eaf5fc] dark:bg-sky-950/40 border border-[#c3e3f7] dark:border-sky-900/40 text-center flex flex-col justify-center">
          <span className="text-[11px] font-extrabold text-[#297bb1] dark:text-sky-300 block mb-0.5">
            ✈️ 交通开支
          </span>
          <span className="text-sm xl:text-base font-black text-[#297bb1] dark:text-sky-200 font-mono">
            ¥{tripSum.toFixed(1)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#e8f7ee] dark:bg-emerald-950/40 border border-[#a2e0bd] dark:border-emerald-900/40 text-center flex flex-col justify-center">
          <span className="text-[11px] font-extrabold text-[#2f8859] dark:text-emerald-300 block mb-0.5">
            🪙 日常费用
          </span>
          <span className="text-sm xl:text-base font-black text-[#2f8859] dark:text-emerald-200 font-mono">
            ¥{expSum.toFixed(1)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#fdf2e9] dark:bg-amber-950/40 border border-[#f5d7c8] dark:border-amber-900/40 text-center flex flex-col justify-center">
          <span className="text-[11px] font-extrabold text-[#d65129] dark:text-amber-300 block mb-0.5">
            🍃 当日总计
          </span>
          <span className="text-sm xl:text-base font-black text-[#d65129] dark:text-amber-200 font-mono">
            ¥{grandTotal.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Quick Add Buttons Bar */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          onClick={() => openTripModal(undefined, selectedDate)}
          className="flex-1 btn-island-dodo py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>添加行程</span>
        </button>
        <button
          onClick={() => openExpenseModal(undefined, selectedDate)}
          className="flex-1 btn-island-primary py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>添加费用</span>
        </button>
      </div>

      {/* Records Section */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[260px] max-h-[calc(100vh-360px)] pr-1 scrollbar-thin">
        {dayTrips.length === 0 && dayExpenses.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-[#b8e2cb] dark:border-slate-800 rounded-3xl bg-[#fbfdfc] dark:bg-slate-900/50 flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#e3f6ec] text-[#2f8859] flex items-center justify-center text-3xl font-black">
              🏝️
            </div>
            <div>
              <p className="text-sm font-black text-[#3b322a] dark:text-slate-200">
                当天暂无行程与费用记录
              </p>
              <p className="text-xs font-bold text-[#8e8071] dark:text-slate-400 mt-1">
                点击上方按钮或双击日历格子，即可添加差旅与消费
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Trips List Header */}
            {dayTrips.length > 0 && (
              <div className="flex items-center justify-between text-xs font-extrabold text-[#297bb1] dark:text-sky-300 px-1">
                <span className="flex items-center gap-1">
                  <Plane className="w-3.5 h-3.5" />
                  <span>差旅行程 ({dayTrips.length})</span>
                </span>
                <span className="font-mono">¥{tripSum.toFixed(2)}</span>
              </div>
            )}

            {/* Trips List */}
            {dayTrips.map((t, idx) => (
              <div
                key={`crtrip-${t.id}-${idx}`}
                className="p-4 rounded-2xl border-2 border-[#c3e3f7] bg-[#f4f9fd] dark:bg-slate-800/80 dark:border-slate-700 flex flex-col gap-2.5 shadow-xs hover:border-[#297bb1] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl bg-[#297bb1] text-white text-xs font-black flex items-center gap-1 shadow-2xs">
                      <Plane className="w-3.5 h-3.5" />
                      <span>{t.transport}</span>
                    </span>
                    {t.trainNumber && (
                      <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-mono font-bold text-xs">
                        {t.trainNumber}
                      </span>
                    )}
                    {(t.startTime || t.endTime) && (
                      <span className="text-xs font-bold text-[#5c8cae] dark:text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#297bb1]" />
                        {t.startTime || '--:--'} ~ {t.endTime || '--:--'}
                      </span>
                    )}
                  </div>

                  <span className="text-base font-black text-[#1d5275] dark:text-sky-300 font-mono">
                    ¥{t.amount.toFixed(2)}
                  </span>
                </div>

                {/* Route */}
                {(t.origin || t.destination) && (
                  <div className="flex items-center gap-2 text-sm font-black text-[#1d5275] dark:text-slate-100 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700">
                    <MapPin className="w-4 h-4 text-[#297bb1] shrink-0" />
                    <span className="truncate">{t.origin || '出发地'}</span>
                    <span className="text-[#297bb1] font-normal mx-1">➔</span>
                    <span className="truncate">{t.destination || '目的地'}</span>
                  </div>
                )}

                {/* Remarks & Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-100/60 dark:border-slate-700/60 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 truncate flex-1">
                    {t.remarks || '无附加备注'}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openTripModal(t, selectedDate)}
                      className="p-1.5 rounded-lg text-[#5c8cae] hover:text-[#1d5275] hover:bg-[#dbeefa] transition-colors"
                      title="编辑行程"
                    >
                      <Edit2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={() => deleteTrip(t.id)}
                      className="p-1.5 rounded-lg text-[#e85a4f] hover:bg-[#fcebe6] transition-colors"
                      title="删除行程"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Expenses List Header */}
            {dayExpenses.length > 0 && (
              <div className="flex items-center justify-between text-xs font-extrabold text-[#2f8859] dark:text-emerald-300 px-1 pt-2">
                <span className="flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>日常费用及补贴 ({dayExpenses.length})</span>
                </span>
                <span className="font-mono">¥{expSum.toFixed(2)}</span>
              </div>
            )}

            {/* Expenses List */}
            {dayExpenses.map((e, idx) => (
              <div
                key={`crexp-${e.id}-${idx}`}
                className="p-4 rounded-2xl border-2 border-[#a2e0bd] bg-[#f0faf4] dark:bg-slate-800/80 dark:border-slate-700 flex flex-col gap-2 shadow-xs hover:border-[#52c488] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-[#52c488] text-white text-xs font-black flex items-center gap-1 shadow-2xs">
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{e.category}</span>
                    </span>
                  </div>

                  <span className="text-base font-black text-[#21633f] dark:text-emerald-300 font-mono">
                    ¥{e.amount.toFixed(2)}
                  </span>
                </div>

                {e.description && (
                  <p className="text-xs font-bold text-[#3d835d] dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-slate-700">
                    {e.description}
                  </p>
                )}

                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-emerald-100/60 dark:border-slate-700/60">
                  <button
                    onClick={() => openExpenseModal(e, selectedDate)}
                    className="p-1.5 rounded-lg text-[#3d835d] hover:text-[#21633f] hover:bg-[#d2f2e0] transition-colors"
                    title="编辑费用"
                  >
                    <Edit2 className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => deleteExpense(e.id)}
                    className="p-1.5 rounded-lg text-[#e85a4f] hover:bg-[#fcebe6] transition-colors"
                    title="删除费用"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

