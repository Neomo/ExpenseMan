import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getMonthDaysGrid, sortTripsByStartTime } from '../../utils/dateUtils';
import { CALENDAR_THEMES } from '../../utils/calendarThemes';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import {
  X,
  Download,
  Image as ImageIcon,
  FileCode,
  Calendar,
  Loader2,
  Check,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarExportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    calendarFocusDate,
    trips,
    expenses,
    calendarDisplayConfig,
  } = useAppStore();

  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'svg'>('png');

  // Export Month selection state
  const [exportYear, setExportYear] = useState<number>(calendarFocusDate.getFullYear());
  const [exportMonth, setExportMonth] = useState<number>(calendarFocusDate.getMonth() + 1);

  if (!isOpen) return null;

  const exportDate = new Date(exportYear, exportMonth - 1, 1);
  const daysGrid = getMonthDaysGrid(exportDate);

  const themeObj = CALENDAR_THEMES[calendarDisplayConfig.theme] || CALENDAR_THEMES.island;

  const currentYYYYMM = `${exportYear}-${String(exportMonth).padStart(2, '0')}`;
  const monthTrips = trips.filter((t) => t.date.startsWith(currentYYYYMM));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentYYYYMM));

  const monthTripsTotal = monthTrips.reduce((acc, t) => acc + t.amount, 0);
  const monthExpensesTotal = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
  const monthGrandTotal = monthTripsTotal + monthExpensesTotal;

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

  const WEEKDAYS = calendarDisplayConfig.weekdayFormat === 'zh'
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Handle Export File Generation & Download
  const handleExport = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);

    try {
      const node = exportRef.current;
      const fileName = `差旅日历_${exportYear}年${exportMonth}月.${exportFormat}`;

      if (exportFormat === 'png') {
        const dataUrl = await toPng(node, { quality: 0.98, cacheBust: true });
        downloadDataUrl(dataUrl, fileName);
      } else if (exportFormat === 'jpeg') {
        const dataUrl = await toJpeg(node, { quality: 0.95, cacheBust: true });
        downloadDataUrl(dataUrl, fileName);
      } else if (exportFormat === 'svg') {
        const dataUrl = await toSvg(node, { cacheBust: true });
        downloadDataUrl(dataUrl, fileName);
      }
    } catch (err) {
      console.error('Failed to export calendar:', err);
      alert('导出日历发生错误，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#52c488] text-white shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>导出月度差旅日历</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  {themeObj.name}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                可自定义导出指定月份，支持 PNG、JPEG 图片及 SVG 矢量图格式
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Controls Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">目标月份:</span>
            
            <select
              value={exportYear}
              onChange={(e) => setExportYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {[2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y} 年</option>
              ))}
            </select>

            <select
              value={exportMonth}
              onChange={(e) => setExportMonth(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m} 月</option>
              ))}
            </select>
          </div>

          {/* Format Selector Pills */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setExportFormat('png')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                exportFormat === 'png'
                  ? 'bg-[#52c488] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>PNG 图片</span>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('jpeg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                exportFormat === 'jpeg'
                  ? 'bg-[#52c488] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>JPEG 图片</span>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('svg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                exportFormat === 'svg'
                  ? 'bg-[#52c488] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>矢量 SVG</span>
            </button>
          </div>
        </div>

        {/* Live Export Preview Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>实时导出渲染预览:</span>
            <span>当前套用设置：{calendarDisplayConfig.showExpenses ? '包含独立费用' : '仅行程信息'} / {calendarDisplayConfig.showDailyTotal ? '含每日合计' : '隐藏每日合计'}</span>
          </div>

          <div className="overflow-x-auto p-2 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* The exported canvas node container */}
            <div
              ref={exportRef}
              className={`w-full min-w-[700px] p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 ${themeObj.containerBorder} space-y-4 text-slate-800 dark:text-slate-100`}
            >
              {/* Export Header Info */}
              <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{themeObj.icon}</span>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">
                      {exportYear} 年 {exportMonth} 月差旅日历
                    </h2>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Generated by 智能差旅日历记账平台 • {new Date().toISOString().split('T')[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">本月差旅次数</span>
                    <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {monthTrips.length} 次
                    </span>
                  </div>
                  {calendarDisplayConfig.showDailyTotal && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">本月消费总计</span>
                      <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                        ¥{monthGrandTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Export Weekday Header Bar */}
              <div className={`grid grid-cols-7 border-b ${themeObj.weekdayHeaderBorder} ${themeObj.weekdayHeaderBg} text-center py-2 text-xs font-black ${themeObj.weekdayTextColor} rounded-xl`}>
                {WEEKDAYS.map((day, idx) => (
                  <div key={`exp-wd-${idx}`} className={idx >= 5 ? 'text-rose-500 font-extrabold' : ''}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Export Days Grid */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                {daysGrid.map((cell, idx) => {
                  const dayTrips = sortTripsByStartTime(tripsByDate[cell.dateStr] || []);
                  const dayExpenses = expensesByDate[cell.dateStr] || [];

                  const tripSum = dayTrips.reduce((sum, t) => sum + t.amount, 0);
                  const expSum = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                  const totalCost = tripSum + expSum;

                  return (
                    <div
                      key={`exp-cell-${cell.dateStr}-${idx}`}
                      className={`min-h-[85px] p-1.5 flex flex-col justify-between ${
                        !cell.isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-950/30 text-slate-300 dark:text-slate-700' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      {/* Day Number */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-black ${cell.isToday ? 'px-1.5 py-0.5 rounded-md bg-emerald-500 text-white' : ''}`}>
                          {cell.dayNumber}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="my-1 space-y-1">
                        {/* Trips */}
                        {dayTrips.slice(0, 2).map((t, i) => {
                          const routeStr = t.origin && t.destination
                            ? `${t.origin}→${t.destination}`
                            : t.destination || t.transport;

                          return (
                            <div
                              key={`exp-t-${t.id}-${i}`}
                              className={`p-1 rounded-md text-[9px] font-bold ${themeObj.tripBadgeBg} ${themeObj.tripBadgeText} border ${themeObj.tripBadgeBorder}`}
                            >
                              <div className="flex items-center justify-between truncate">
                                <span className="truncate">✈️ {routeStr}</span>
                                {calendarDisplayConfig.showTripTicketCost && (
                                  <span className="font-mono text-[8.5px] ml-1 shrink-0">
                                    ¥{t.amount}
                                  </span>
                                )}
                              </div>
                              {calendarDisplayConfig.showTripStartTime && t.startTime && (
                                <div className="text-[8px] opacity-80 font-mono">
                                  🕒 {t.startTime}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Expenses (if enabled) */}
                        {calendarDisplayConfig.showExpenses &&
                          dayExpenses.slice(0, 2 - Math.min(dayTrips.length, 2)).map((exp, i) => (
                            <div
                              key={`exp-e-${exp.id}-${i}`}
                              className="p-1 rounded-md text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between"
                            >
                              <span className="truncate">🧾 {exp.category}</span>
                              <span className="font-mono text-[8.5px]">¥{exp.amount}</span>
                            </div>
                          ))}
                      </div>

                      {/* Total cost if enabled */}
                      {calendarDisplayConfig.showDailyTotal && totalCost > 0 ? (
                        <div className="mt-auto pt-0.5 text-right">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[8.5px] font-mono font-bold">
                            ¥{totalCost.toFixed(0)}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-auto h-2" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Branding Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 flex items-center justify-between">
                <span>🍃 自动归集•智算记账</span>
                <span>智能差旅日历系统出具</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
          >
            取消
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2.5 rounded-2xl bg-[#52c488] hover:bg-[#3ea872] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 border-b-2 border-[#32855b] disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在高精渲染生成中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>立即导出 {exportFormat.toUpperCase()} 文件</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
