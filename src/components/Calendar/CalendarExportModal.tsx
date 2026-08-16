import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getMonthDaysGrid, sortTripsByStartTime } from '../../utils/dateUtils';
import { CALENDAR_THEMES } from '../../utils/calendarThemes';
import { CalendarThemeKey } from '../../types';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import {
  X,
  Download,
  Image as ImageIcon,
  FileCode,
  Calendar,
  Loader2,
  Sparkles,
  Maximize2,
  ListOrdered,
  Receipt,
  Plane,
  Palette,
  Briefcase,
  Code,
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
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'svg' | 'html'>('png');

  // Export Month selection state
  const [exportYear, setExportYear] = useState<number>(calendarFocusDate.getFullYear());
  const [exportMonth, setExportMonth] = useState<number>(calendarFocusDate.getMonth() + 1);

  // New Export Customization Options
  const [canvasWidth, setCanvasWidth] = useState<1100 | 1350 | 1600>(1350);
  const [selectedTheme, setSelectedTheme] = useState<CalendarThemeKey>(
    calendarDisplayConfig.theme || 'island'
  );
  const [includeTripList, setIncludeTripList] = useState<boolean>(true);
  const [includeExpenseList, setIncludeExpenseList] = useState<boolean>(true);
  
  // Requirement 5: Workdays Only option (Mon-Fri)
  const [workdaysOnly, setWorkdaysOnly] = useState<boolean>(false);

  if (!isOpen) return null;

  const exportDate = new Date(exportYear, exportMonth - 1, 1);
  const rawDaysGrid = getMonthDaysGrid(exportDate);

  // Filter grid if workdaysOnly is active
  const daysGrid = workdaysOnly
    ? rawDaysGrid.filter((cell) => {
        const dayOfWeek = cell.date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6;
      })
    : rawDaysGrid;

  const themeObj = CALENDAR_THEMES[selectedTheme] || CALENDAR_THEMES.island;
  const isSkeuomorphic = selectedTheme === 'skeuomorphic';

  const currentYYYYMM = `${exportYear}-${String(exportMonth).padStart(2, '0')}`;
  const monthTrips = trips
    .filter((t) => t.date.startsWith(currentYYYYMM))
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthExpenses = expenses
    .filter((e) => e.date.startsWith(currentYYYYMM))
    .sort((a, b) => a.date.localeCompare(b.date));

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

  const WEEKDAYS = workdaysOnly
    ? (calendarDisplayConfig.weekdayFormat === 'zh'
        ? ['周一', '周二', '周三', '周四', '周五']
        : ['MON', 'TUE', 'WED', 'THU', 'FRI'])
    : (calendarDisplayConfig.weekdayFormat === 'zh'
        ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);

  // Generate complete standalone HTML report
  const generateHtmlReport = (): string => {
    const weekdayColsHtml = WEEKDAYS.map((day, idx) => {
      const isWeekend = !workdaysOnly && idx >= 5;
      return `<th style="padding: 10px 6px; text-align: center; font-size: 13px; font-weight: 700; color: ${isWeekend ? '#e11d48' : '#2d3748'}; background-color: #f0fdf4; border: 1px solid #d1fae5;">${day}</th>`;
    }).join('');

    const gridRowsHtml: string[] = [];
    const colCount = workdaysOnly ? 5 : 7;

    for (let i = 0; i < daysGrid.length; i += colCount) {
      const rowCells = daysGrid.slice(i, i + colCount);
      const cellsHtml = rowCells.map((cell) => {
        const dTrips = sortTripsByStartTime(tripsByDate[cell.dateStr] || []);
        const dExpenses = expensesByDate[cell.dateStr] || [];
        const dCost = dTrips.reduce((sum, t) => sum + t.amount, 0) + dExpenses.reduce((sum, e) => sum + e.amount, 0);

        const tripsHtml = dTrips.map((t) => {
          const originStr = t.origin || '始发';
          const destStr = t.destination || '到达';
          const tIcon = t.transport === '飞机' ? '✈️' : (t.transport === '高铁' || t.transport === '火车' ? '🚄' : '🚗');
          return `
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 4px 6px; margin-bottom: 4px; font-size: 11px; line-height: 1.3;">
              <div style="display: flex; justify-content: space-between; font-weight: 700; color: #0369a1;">
                <span>${tIcon} ${originStr} → ${destStr}</span>
                <span style="color: #0284c7; font-family: monospace;">¥${t.amount.toFixed(1)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-top: 2px;">
                <span>${t.startTime ? '🕒 ' + t.startTime : ''} ${t.trainNumber || ''}</span>
                <span style="background-color: #e0f2fe; padding: 1px 4px; border-radius: 3px;">${t.transport}</span>
              </div>
            </div>
          `;
        }).join('');

        const expHtml = calendarDisplayConfig.showExpenses ? dExpenses.map((exp) => `
          <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 5px; padding: 3px 5px; margin-bottom: 3px; font-size: 10px; display: flex; justify-content: space-between; color: #92400e;">
            <span>🧾 ${exp.category}</span>
            <span style="font-family: monospace; font-weight: bold;">¥${exp.amount.toFixed(1)}</span>
          </div>
        `).join('') : '';

        const costBadgeHtml = calendarDisplayConfig.showDailyTotal && dCost > 0
          ? `<div style="text-align: right; margin-top: 4px;"><span style="background-color: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; font-family: monospace;">¥${dCost.toFixed(0)}</span></div>`
          : '';

        return `
          <td style="vertical-align: top; width: ${100 / colCount}%; min-height: 80px; padding: 6px; border: 1px solid #e2e8f0; background-color: ${cell.isCurrentMonth ? '#ffffff' : '#f8fafc'};">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-bottom: 4px; color: ${cell.isToday ? '#059669' : '#475569'};">
              <span>${cell.dayNumber}</span>
              ${cell.isToday ? '<span style="font-size: 9px; background-color: #d1fae5; color: #065f46; padding: 1px 4px; border-radius: 3px;">今日</span>' : ''}
            </div>
            <div>${tripsHtml}${expHtml}${costBadgeHtml}</div>
          </td>
        `;
      }).join('');

      gridRowsHtml.push(`<tr>${cellsHtml}</tr>`);
    }

    // Attached Trip List HTML
    let attachedTripTableHtml = '';
    if (includeTripList) {
      const tripRows = monthTrips.map((t, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 6px 8px; color: #64748b; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-family: monospace;">${t.date}</td>
          <td style="padding: 6px 8px;"><span style="background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${t.transport}</span></td>
          <td style="padding: 6px 8px; font-weight: bold; font-family: monospace;">${t.trainNumber || '-'}</td>
          <td style="padding: 6px 8px; font-family: monospace;">${t.startTime || '-'}</td>
          <td style="padding: 6px 8px; font-weight: bold;">${t.origin || '-'} → ${t.destination || '-'}</td>
          <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #059669;">¥${t.amount.toFixed(2)}</td>
          <td style="padding: 6px 8px; color: #64748b;">${t.remarks || '-'}</td>
        </tr>
      `).join('');

      attachedTripTableHtml = `
        <div style="margin-top: 24px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; background-color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #0f172a;">✈️ 附表一：${exportYear}年${exportMonth}月 行程明细清单 (${monthTrips.length} 项)</h3>
            <span style="font-size: 13px; font-weight: bold; font-family: monospace; color: #0284c7;">行程开支小计: ¥${monthTripsTotal.toFixed(2)}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: bold;">
                <th style="padding: 6px 8px; width: 40px;">#</th>
                <th style="padding: 6px 8px;">日期</th>
                <th style="padding: 6px 8px;">交通类型</th>
                <th style="padding: 6px 8px;">车次/航班</th>
                <th style="padding: 6px 8px;">出发时间</th>
                <th style="padding: 6px 8px;">起止路线</th>
                <th style="padding: 6px 8px; text-align: right;">票面金额</th>
                <th style="padding: 6px 8px;">备注</th>
              </tr>
            </thead>
            <tbody>${tripRows || '<tr><td colspan="8" style="text-align: center; padding: 12px; color: #94a3b8;">暂无记录</td></tr>'}</tbody>
          </table>
        </div>
      `;
    }

    // Attached Expense List HTML
    let attachedExpenseTableHtml = '';
    if (includeExpenseList) {
      const expRows = monthExpenses.map((e, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 6px 8px; color: #64748b; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-family: monospace;">${e.date}</td>
          <td style="padding: 6px 8px;"><span style="background-color: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${e.category}</span></td>
          <td style="padding: 6px 8px; color: #334155;">${e.description || '-'}</td>
          <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #d97706;">¥${e.amount.toFixed(2)}</td>
        </tr>
      `).join('');

      attachedExpenseTableHtml = `
        <div style="margin-top: 16px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; background-color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #0f172a;">🪙 附表二：${exportYear}年${exportMonth}月 日常费用及补贴清单 (${monthExpenses.length} 项)</h3>
            <span style="font-size: 13px; font-weight: bold; font-family: monospace; color: #d97706;">日常开支小计: ¥${monthExpensesTotal.toFixed(2)}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: bold;">
                <th style="padding: 6px 8px; width: 40px;">#</th>
                <th style="padding: 6px 8px;">日期</th>
                <th style="padding: 6px 8px;">费用类别</th>
                <th style="padding: 6px 8px;">开支说明/商家</th>
                <th style="padding: 6px 8px; text-align: right;">费用金额</th>
              </tr>
            </thead>
            <tbody>${expRows || '<tr><td colspan="5" style="text-align: center; padding: 12px; color: #94a3b8;">暂无记录</td></tr>'}</tbody>
          </table>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>差旅核算日历_${exportYear}年${exportMonth}月</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      margin: 0;
      padding: 24px;
    }
    .report-container {
      max-width: ${canvasWidth}px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 2px solid #cbd5e1;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .report-title {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }
    .report-subtitle {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: #64748b;
    }
    .stats-box {
      display: flex;
      gap: 12px;
    }
    .stat-badge {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 6px 12px;
      border-radius: 8px;
      text-align: right;
    }
    .calendar-table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }
    .sign-block {
      margin-top: 20px;
      padding: 14px 18px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #475569;
    }
    .sign-fields {
      display: flex;
      gap: 24px;
    }
    @media print {
      body { background: none; padding: 0; }
      .report-container { box-shadow: none; border: none; max-width: 100%; padding: 0; }
      @page { size: landscape; margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <div>
        <h1 class="report-title">🍃 ${exportYear} 年 ${exportMonth} 月 差旅记账与核算日历 ${workdaysOnly ? '(工作日版)' : ''}</h1>
        <p class="report-subtitle">Smart Travel Ledger • 生成时间: ${new Date().toLocaleString('zh-CN')}</p>
      </div>
      <div class="stats-box">
        <div class="stat-badge">
          <div style="font-size: 10px; color: #64748b;">差旅总次数</div>
          <div style="font-size: 16px; font-weight: bold; color: #0284c7; font-family: monospace;">${monthTrips.length} 次</div>
        </div>
        <div class="stat-badge">
          <div style="font-size: 10px; color: #64748b;">本月核算总额</div>
          <div style="font-size: 16px; font-weight: bold; color: #d97706; font-family: monospace;">¥${monthGrandTotal.toFixed(2)}</div>
        </div>
      </div>
    </div>

    <table class="calendar-table">
      <thead>
        <tr>${weekdayColsHtml}</tr>
      </thead>
      <tbody>
        ${gridRowsHtml.join('')}
      </tbody>
    </table>

    ${attachedTripTableHtml}
    ${attachedExpenseTableHtml}

    <div class="sign-block">
      <div class="sign-fields">
        <span>填报人: ________________</span>
        <span>部门审核: ________________</span>
        <span>财务复核: ________________</span>
      </div>
      <div style="font-weight: bold;">
        实报实销核准金额: <span style="font-size: 16px; color: #059669; font-family: monospace;">¥${monthGrandTotal.toFixed(2)}</span>
      </div>
    </div>

    <div style="margin-top: 14px; text-align: center; font-size: 10px; color: #94a3b8;">
      动森差旅日历系统 出具 • 遵照财务合规报销标准
    </div>
  </div>
</body>
</html>`;
  };

  // Handle Export File Generation & Download
  const handleExport = async () => {
    setIsExporting(true);

    try {
      const fileName = `差旅核算日历_${exportYear}年${exportMonth}月_${workdaysOnly ? '工作日_' : ''}.${exportFormat}`;

      if (exportFormat === 'html') {
        const htmlContent = generateHtmlReport();
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        downloadDataUrl(url, fileName);
        URL.revokeObjectURL(url);
      } else {
        if (!exportRef.current) return;
        const node = exportRef.current;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      {/* Expanded Modal Box */}
      <div className="w-full max-w-[96vw] 2xl:max-w-[1560px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#52c488] text-white shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                <span>高级定制导出差旅日历</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  {themeObj.name}
                </span>
                {workdaysOnly && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold">
                    仅工作日 (周一至周五)
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                支持 PNG / JPEG / SVG / 独立 HTML 网页格式导出，支持工作日视图、拟物桌历与完整报销附表
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

        {/* Export Controls Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
          {/* Row 1: Target Month, Canvas Width, Format Selector */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Target Date */}
            <div className="flex items-center gap-2 flex-wrap">
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

            {/* Canvas Width Selection */}
            <div className="flex items-center gap-2 flex-wrap">
              <Maximize2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">画布宽度:</span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                {[
                  { width: 1100, label: '1100px (标准)' },
                  { width: 1350, label: '1350px (高清)' },
                  { width: 1600, label: '1600px (超宽)' },
                ].map((w) => (
                  <button
                    key={`w-btn-${w.width}`}
                    type="button"
                    onClick={() => setCanvasWidth(w.width as 1100 | 1350 | 1600)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      canvasWidth === w.width
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Format Selector Pills */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex-wrap">
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
                <span>PNG</span>
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
                <span>JPEG</span>
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
                <span>SVG</span>
              </button>

              {/* Requirement 4: HTML Export Format */}
              <button
                type="button"
                onClick={() => setExportFormat('html')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  exportFormat === 'html'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML 网页</span>
              </button>
            </div>
          </div>

          {/* Row 2: Theme Selection & Filter Checkboxes */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
            {/* Style / Theme selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <Palette className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">视觉风格:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.values(CALENDAR_THEMES).map((t) => {
                  const isActive = selectedTheme === t.key;
                  return (
                    <button
                      key={`export-theme-${t.key}`}
                      type="button"
                      onClick={() => setSelectedTheme(t.key as CalendarThemeKey)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checkbox settings */}
            <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 flex-wrap">
              {/* Requirement 5: Workdays Only setting */}
              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 hover:bg-sky-100 transition-colors">
                <input
                  type="checkbox"
                  checked={workdaysOnly}
                  onChange={(e) => setWorkdaysOnly(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                  <span>只导出工作日 (周一至周五)</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors">
                <input
                  type="checkbox"
                  checked={includeTripList}
                  onChange={(e) => setIncludeTripList(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <ListOrdered className="w-3.5 h-3.5 text-blue-500" />
                  <span>附带行程明细清单</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors">
                <input
                  type="checkbox"
                  checked={includeExpenseList}
                  onChange={(e) => setIncludeExpenseList(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-amber-500" />
                  <span>附带日常费用及补贴清单</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Export Preview Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>实时渲染导出预览 (全高不截断):</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">
              渲染尺寸: {canvasWidth}px x 动态自适应高度 {workdaysOnly ? '(5列工作日)' : '(7列完整周)'}
            </span>
          </div>

          <div className="overflow-x-auto p-4 bg-slate-200/80 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner">
            {/* The exported canvas node container */}
            <div
              ref={exportRef}
              style={{ width: `${canvasWidth}px` }}
              className={`mx-auto p-8 rounded-2xl bg-white dark:bg-slate-900 border-2 ${themeObj.containerBorder} space-y-6 text-slate-800 dark:text-slate-100 ${
                isSkeuomorphic ? 'shadow-2xl bg-[#faf6ed] text-[#423223]' : ''
              }`}
            >
              {/* Skeuomorphic Ring Loop Binder Top Accent */}
              {isSkeuomorphic && (
                <div className="relative -mt-8 -mx-8 mb-6 h-10 bg-gradient-to-r from-[#2c1e14] via-[#4d3623] to-[#2c1e14] rounded-t-xl flex items-center justify-around px-12 border-b-2 border-[#1c120a] shadow-md">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={`ring-${i}`} className="relative flex flex-col items-center">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#120b06] shadow-inner border border-[#523d2a]" />
                      <div className="absolute -top-4 w-3 h-8 rounded-full bg-gradient-to-r from-[#e6c667] via-[#fff1b8] to-[#9e7a1b] shadow-md border border-[#8c6b12]" />
                    </div>
                  ))}
                </div>
              )}

              {/* Export Header Info */}
              <div className={`flex items-center justify-between border-b-2 pb-4 ${isSkeuomorphic ? 'border-[#d1c0a5]' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl text-2xl ${isSkeuomorphic ? 'bg-[#e0cfb3] text-[#5c3c1e] border border-[#bd9b71] shadow-xs' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                    {themeObj.icon}
                  </div>
                  <div>
                    <h2 className={`text-2xl font-black tracking-tight flex items-center gap-3 ${isSkeuomorphic ? 'font-serif text-[#472d17]' : ''}`}>
                      <span>{exportYear} 年 {exportMonth} 月差旅记账与核算日历 {workdaysOnly ? '(工作日)' : ''}</span>
                    </h2>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Smart Travel Calendar Ledger • 生成日期: {new Date().toISOString().split('T')[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className={`p-2.5 rounded-xl border ${isSkeuomorphic ? 'bg-[#f0e4cf] border-[#cfbe9d]' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                    <span className="text-[10px] text-slate-400 block font-bold">出差行次数</span>
                    <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {monthTrips.length} 次
                    </span>
                  </div>

                  {calendarDisplayConfig.showDailyTotal && (
                    <div className={`p-2.5 rounded-xl border ${isSkeuomorphic ? 'bg-[#f0e4cf] border-[#cfbe9d]' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                      <span className="text-[10px] text-slate-400 block font-bold">本月消费总计</span>
                      <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                        ¥{monthGrandTotal.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Stamp / Seal for Skeuomorphic theme */}
                  {isSkeuomorphic && (
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-rose-700/80 text-rose-700 flex flex-col items-center justify-center rotate-12 font-serif select-none shrink-0 bg-rose-50/20">
                      <span className="text-[10px] font-bold">验讫归档</span>
                      <span className="text-[8px] font-black font-mono">APPROVED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Export Weekday Header Bar (5 cols if workdaysOnly, else 7 cols) */}
              <div className={`grid ${workdaysOnly ? 'grid-cols-5' : 'grid-cols-7'} border-b ${themeObj.weekdayHeaderBorder} ${themeObj.weekdayHeaderBg} text-center py-2.5 text-xs font-black ${themeObj.weekdayTextColor} rounded-xl shadow-2xs`}>
                {WEEKDAYS.map((day, idx) => (
                  <div key={`exp-wd-${idx}`} className={!workdaysOnly && idx >= 5 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : ''}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Export Days Grid - 5 or 7 cols with Minimal Dynamic Cell Heights */}
              <div className={`grid ${workdaysOnly ? 'grid-cols-5' : 'grid-cols-7'} divide-x divide-y border rounded-xl overflow-hidden ${
                isSkeuomorphic
                  ? 'divide-[#dcd0b9] border-[#cfbe9d] bg-[#fdfbf7]'
                  : 'divide-slate-100 dark:divide-slate-800 border-slate-100 dark:border-slate-800'
              }`}>
                {daysGrid.map((cell, idx) => {
                  const dayTrips = sortTripsByStartTime(tripsByDate[cell.dateStr] || []);
                  const dayExpenses = expensesByDate[cell.dateStr] || [];

                  const tripSum = dayTrips.reduce((sum, t) => sum + t.amount, 0);
                  const expSum = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                  const totalCost = tripSum + expSum;

                  return (
                    <div
                      key={`exp-cell-${cell.dateStr}-${idx}`}
                      className={`min-h-[75px] p-2.5 flex flex-col justify-between transition-colors ${
                        !cell.isCurrentMonth
                          ? isSkeuomorphic
                            ? 'bg-[#f0e8d8]/60 text-slate-400'
                            : 'bg-slate-50/50 dark:bg-slate-950/30 text-slate-300 dark:text-slate-700'
                          : 'bg-white/90 dark:bg-slate-900/90'
                      }`}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between pb-1">
                        <span className={`text-xs font-black ${
                          cell.isToday
                            ? themeObj.todayBadgeBg + ' ' + themeObj.todayBadgeText + ' px-1.5 py-0.5 rounded-md shadow-xs'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {cell.dayNumber}
                        </span>
                      </div>

                      {/* Items Stacking Area */}
                      <div className="my-1 space-y-1.5 flex-1">
                        {/* Render ALL Trips for the day */}
                        {dayTrips.map((t, i) => {
                          const originStr = t.origin || '始发';
                          const destStr = t.destination || '到达';
                          const transportIcon = t.transport === '飞机' ? '✈️' : t.transport === '高铁' || t.transport === '火车' ? '🚄' : '🚗';

                          return (
                            <div
                              key={`exp-t-${t.id}-${i}`}
                              className={`p-1.5 rounded-lg text-[10px] font-extrabold ${themeObj.tripBadgeBg} ${themeObj.tripBadgeText} border ${themeObj.tripBadgeBorder} shadow-2xs space-y-0.5`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="flex items-center gap-1 min-w-0 flex-1 leading-snug break-all">
                                  <span>{transportIcon}</span>
                                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                    {originStr} <span className="text-emerald-600 font-normal mx-0.5">→</span> {destStr}
                                  </span>
                                </span>
                                {calendarDisplayConfig.showTripTicketCost && (
                                  <span className="font-mono text-[9.5px] font-black shrink-0 text-emerald-700 dark:text-emerald-300 ml-1">
                                    ¥{t.amount}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[9px] opacity-85 font-mono pt-0.5">
                                {calendarDisplayConfig.showTripStartTime && t.startTime && (
                                  <span>🕒 {t.startTime}</span>
                                )}
                                {t.transport && (
                                  <span className="px-1 rounded bg-slate-200/60 dark:bg-slate-700/60 font-sans font-bold">
                                    {t.transport}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Render ALL Expenses for the day (if enabled) */}
                        {calendarDisplayConfig.showExpenses &&
                          dayExpenses.map((exp, i) => (
                            <div
                              key={`exp-e-${exp.id}-${i}`}
                              className="p-1 rounded-md text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between"
                            >
                              <span className="truncate">🧾 {exp.category}</span>
                              <span className="font-mono text-[8.5px] font-extrabold">¥{exp.amount}</span>
                            </div>
                          ))}
                      </div>

                      {/* Total cost if enabled */}
                      {calendarDisplayConfig.showDailyTotal && totalCost > 0 ? (
                        <div className="mt-auto pt-1 text-right">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-mono font-bold shadow-2xs">
                            ¥{totalCost.toFixed(0)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* ATTACHED LIST 1: Trip Details Table */}
              {includeTripList && (
                <div className={`p-4 rounded-xl border space-y-3 pt-4 ${
                  isSkeuomorphic
                    ? 'bg-[#f7f0e1] border-[#d8c7ab]'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Plane className="w-4 h-4 text-blue-600" />
                      <span>附表一：{exportYear}年{exportMonth}月 行程明细清单 ({monthTrips.length} 项)</span>
                    </h4>
                    <span className="text-xs font-black font-mono text-blue-600 dark:text-blue-400">
                      行程开支小计: ¥{monthTripsTotal.toFixed(2)}
                    </span>
                  </div>

                  {monthTrips.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">本月暂无差旅行程记录</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold text-[11px]">
                            <th className="py-1.5 px-2 w-10">#</th>
                            <th className="py-1.5 px-2">日期</th>
                            <th className="py-1.5 px-2">交通类型</th>
                            <th className="py-1.5 px-2">车次/航班</th>
                            <th className="py-1.5 px-2">出发时间</th>
                            <th className="py-1.5 px-2">起止路线</th>
                            <th className="py-1.5 px-2 text-right">票面金额</th>
                            <th className="py-1.5 px-2">备注</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60 text-[11px]">
                          {monthTrips.map((t, idx) => (
                            <tr key={`att-t-${t.id}-${idx}`}>
                              <td className="py-1.5 px-2 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-1.5 px-2 font-mono font-medium">{t.date}</td>
                              <td className="py-1.5 px-2">
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px]">
                                  {t.transport}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {t.trainNumber || '-'}
                              </td>
                              <td className="py-1.5 px-2 font-mono">{t.startTime || '-'}</td>
                              <td className="py-1.5 px-2 font-bold text-slate-800 dark:text-slate-100">
                                {t.origin || '未知'} → {t.destination || '未知'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                ¥{t.amount.toFixed(2)}
                              </td>
                              <td className="py-1.5 px-2 text-slate-500 max-w-[150px] truncate">{t.remarks || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ATTACHED LIST 2: Expense Details Table */}
              {includeExpenseList && (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isSkeuomorphic
                    ? 'bg-[#f7f0e1] border-[#d8c7ab]'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-600" />
                      <span>附表二：{exportYear}年{exportMonth}月 日常费用及补贴清单 ({monthExpenses.length} 项)</span>
                    </h4>
                    <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400">
                      日常开支小计: ¥{monthExpensesTotal.toFixed(2)}
                    </span>
                  </div>

                  {monthExpenses.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">本月暂无其他费用及补贴记录</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold text-[11px]">
                            <th className="py-1.5 px-2 w-10">#</th>
                            <th className="py-1.5 px-2">日期</th>
                            <th className="py-1.5 px-2">费用类别</th>
                            <th className="py-1.5 px-2">开支说明/商家</th>
                            <th className="py-1.5 px-2 text-right">费用金额</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60 text-[11px]">
                          {monthExpenses.map((e, idx) => (
                            <tr key={`att-e-${e.id}-${idx}`}>
                              <td className="py-1.5 px-2 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-1.5 px-2 font-mono font-medium">{e.date}</td>
                              <td className="py-1.5 px-2">
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                                  {e.category}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 text-slate-700 dark:text-slate-200 font-medium">
                                {e.description || '-'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-black text-amber-600 dark:text-amber-400">
                                ¥{e.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Signature & Approval Block */}
              <div className={`p-4 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-4 font-mono ${
                isSkeuomorphic
                  ? 'bg-[#eedebd] border-[#cbb895] text-[#523d29]'
                  : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                <div className="flex items-center gap-6 flex-wrap">
                  <span>填报人: ______________</span>
                  <span>部门审核: ______________</span>
                  <span>财务复核: ______________</span>
                </div>
                <div className="font-bold">
                  实报实销合计金额: <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">¥{monthGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Branding Footer */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 flex items-center justify-between">
                <span>🍃 自动归集•智算记账</span>
                <span>智能差旅日历记账平台 出具</span>
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
                <span>立即导出 {exportFormat.toUpperCase()} {exportFormat === 'html' ? '网页文件' : '高清文件'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
