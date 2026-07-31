import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  formatDateStr,
  formatChineseDate,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseDateStr,
} from '../../utils/dateUtils';
import {
  ReportDimension,
  TripItem,
  ExpenseItem,
} from '../../types';
import {
  exportReportToHTML,
  exportReportToExcel,
  exportReportToSVG,
} from '../../utils/exporter';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Calendar as CalendarIcon,
  Download,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Plane,
  Receipt,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';

const COLORS = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#db2777',
  '#0284c7',
  '#0891b2',
];

export const ReportView: React.FC = () => {
  const { trips, expenses, selectedDate } = useAppStore();

  const [dimension, setDimension] = useState<ReportDimension>('month');
  const [targetDateStr, setTargetDateStr] = useState<string>(selectedDate || formatDateStr(new Date()));
  const [startDateStr, setStartDateStr] = useState<string>(formatDateStr(startOfMonth(new Date())));
  const [endDateStr, setEndDateStr] = useState<string>(formatDateStr(endOfMonth(new Date())));

  // Toggle sections
  const [showTrips, setShowTrips] = useState<boolean>(true);
  const [showExpenses, setShowExpenses] = useState<boolean>(true);

  // Compute active date range based on dimension
  const dateRange = useMemo(() => {
    const targetDate = parseDateStr(targetDateStr);
    if (dimension === 'day') {
      return {
        start: targetDateStr,
        end: targetDateStr,
        text: `${targetDateStr} (单日)`,
      };
    } else if (dimension === 'week') {
      const s = startOfWeek(targetDate, { weekStartsOn: 1 });
      const e = endOfWeek(targetDate, { weekStartsOn: 1 });
      const sStr = formatDateStr(s);
      const eStr = formatDateStr(e);
      return {
        start: sStr,
        end: eStr,
        text: `${sStr} ~ ${eStr} (按周)`,
      };
    } else if (dimension === 'month') {
      const s = startOfMonth(targetDate);
      const e = endOfMonth(targetDate);
      const sStr = formatDateStr(s);
      const eStr = formatDateStr(e);
      return {
        start: sStr,
        end: eStr,
        text: `${targetDateStr.substring(0, 7)} (按月)`,
      };
    } else {
      return {
        start: startDateStr,
        end: endDateStr,
        text: `${startDateStr} ~ ${endDateStr} (自定义区间)`,
      };
    }
  }, [dimension, targetDateStr, startDateStr, endDateStr]);

  // Filter items in range
  const filteredTrips = useMemo(() => {
    if (!showTrips) return [];
    return trips.filter((t) => t.date >= dateRange.start && t.date <= dateRange.end);
  }, [trips, dateRange, showTrips]);

  const filteredExpenses = useMemo(() => {
    if (!showExpenses) return [];
    return expenses.filter((e) => e.date >= dateRange.start && e.date <= dateRange.end);
  }, [expenses, dateRange, showExpenses]);

  // Totals
  const tripSubtotal = filteredTrips.reduce((sum, t) => sum + t.amount, 0);
  const expenseSubtotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const grandTotal = tripSubtotal + expenseSubtotal;

  // Category Distribution for Chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    if (showTrips) {
      filteredTrips.forEach((t) => {
        const key = `交通:${t.transport}`;
        map[key] = (map[key] || 0) + t.amount;
      });
    }
    if (showExpenses) {
      filteredExpenses.forEach((e) => {
        const key = `日常:${e.category}`;
        map[key] = (map[key] || 0) + e.amount;
      });
    }
    return Object.keys(map).map((k) => ({
      name: k,
      value: map[k],
    }));
  }, [filteredTrips, filteredExpenses, showTrips, showExpenses]);

  // Daily Trend Data for Bar Chart
  const trendData = useMemo(() => {
    const map: Record<string, { date: string; tripAmount: number; expenseAmount: number }> = {};
    try {
      const start = parseDateStr(dateRange.start);
      const end = parseDateStr(dateRange.end);
      const days = eachDayOfInterval({ start, end });

      days.forEach((day) => {
        const dStr = formatDateStr(day);
        map[dStr] = { date: dStr.substring(5), tripAmount: 0, expenseAmount: 0 };
      });
    } catch {
      // Fallback
    }

    if (showTrips) {
      filteredTrips.forEach((t) => {
        if (!map[t.date]) {
          map[t.date] = { date: t.date.substring(5), tripAmount: 0, expenseAmount: 0 };
        }
        map[t.date].tripAmount += t.amount;
      });
    }

    if (showExpenses) {
      filteredExpenses.forEach((e) => {
        if (!map[e.date]) {
          map[e.date] = { date: e.date.substring(5), tripAmount: 0, expenseAmount: 0 };
        }
        map[e.date].expenseAmount += e.amount;
      });
    }

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTrips, filteredExpenses, dateRange, showTrips, showExpenses]);

  // Handle Exports
  const getExportData = () => ({
    title: `${dimension === 'day' ? '日' : dimension === 'week' ? '周' : dimension === 'month' ? '月度' : '自定义'}差旅费用分析报告`,
    dateRangeText: dateRange.text,
    trips: filteredTrips,
    expenses: filteredExpenses,
    tripSubtotal,
    expenseSubtotal,
    grandTotal,
    showTrips,
    showExpenses,
  });

  const handleExportHTML = () => {
    exportReportToHTML(getExportData());
  };

  const handleExportExcel = () => {
    exportReportToExcel(getExportData());
  };

  const handleExportSVG = () => {
    exportReportToSVG(getExportData(), categoryData);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Dimension Selector */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                差旅费用分析与报告生成
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              按日、周、月或自定义区间汇总账单，支持独立 HTML、Excel 及 SVG 图表一键导出
            </p>
          </div>

          {/* Dimension Buttons */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium self-start lg:self-auto">
            {(
              [
                { id: 'month', label: '月报告' },
                { id: 'week', label: '周报告' },
                { id: 'day', label: '日报告' },
                { id: 'custom', label: '自定义区间' },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                id={`report-dim-${d.id}`}
                onClick={() => setDimension(d.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dimension === d.id
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Selector row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">目标时间:</span>

            {dimension !== 'custom' ? (
              <input
                type="date"
                id="report-target-date-input"
                value={targetDateStr}
                onChange={(e) => e.target.value && setTargetDateStr(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-xs"
              />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  id="report-start-date-input"
                  value={startDateStr}
                  onChange={(e) => e.target.value && setStartDateStr(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  id="report-end-date-input"
                  value={endDateStr}
                  onChange={(e) => e.target.value && setEndDateStr(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>
            )}

            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs">
              {dateRange.text}
            </span>
          </div>

          {/* Section Visibility Toggles (3.2 筛选显示) */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">板块显示:</span>
            <button
              id="report-toggle-trips-btn"
              onClick={() => setShowTrips(!showTrips)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                showTrips
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 line-through'
              }`}
            >
              {showTrips ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>行程信息</span>
            </button>

            <button
              id="report-toggle-expenses-btn"
              onClick={() => setShowExpenses(!showExpenses)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                showExpenses
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 line-through'
              }`}
            >
              {showExpenses ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>其他费用</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-island bg-white dark:bg-slate-900 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-[#8e8071] dark:text-slate-400 uppercase tracking-wider">
              🦤 交通行程费用小计
            </span>
            <div className="text-2xl font-black text-[#297bb1] dark:text-sky-400 font-mono mt-1">
              ¥ {tripSubtotal.toFixed(2)}
            </div>
            <p className="text-[11px] text-[#8e8071] dark:text-slate-400 font-bold mt-0.5">包含 {filteredTrips.length} 笔行程</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#eaf5fc] text-[#297bb1] border border-[#c3e3f7]">
            <Plane className="w-6 h-6" />
          </div>
        </div>

        <div className="card-island bg-white dark:bg-slate-900 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-[#8e8071] dark:text-slate-400 uppercase tracking-wider">
              🪙 其他常规费用小计
            </span>
            <div className="text-2xl font-black text-[#2f8859] dark:text-emerald-400 font-mono mt-1">
              ¥ {expenseSubtotal.toFixed(2)}
            </div>
            <p className="text-[11px] text-[#8e8071] dark:text-slate-400 font-bold mt-0.5">包含 {filteredExpenses.length} 笔明细</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#e8f7ee] text-[#2f8859] border border-[#a2e0bd]">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="card-island bg-[#faf5e8] dark:bg-slate-900 p-5 flex items-center justify-between border-2 border-[#eadaa8]">
          <div>
            <span className="text-xs font-black text-[#8e8071] dark:text-slate-400 uppercase tracking-wider">🍃 区间总花费合计</span>
            <div className="text-2xl font-black text-[#d65129] dark:text-amber-400 font-mono mt-1">
              ¥ {grandTotal.toFixed(2)}
            </div>
            <p className="text-[11px] text-[#8e8071] dark:text-slate-400 font-bold mt-0.5">
              总计 {filteredTrips.length + filteredExpenses.length} 笔无人岛差旅消费
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#fdf2e9] text-[#e25f38] border border-[#f5d7c8]">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Export Action Bar (3.3 报告导出) */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Download className="w-4 h-4 text-blue-600" />
          <span>导出当前报告文件:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="report-export-html-btn"
            onClick={handleExportHTML}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700"
          >
            <FileCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>导出 HTML 文件</span>
          </button>

          <button
            id="report-export-excel-btn"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-medium transition-colors border border-emerald-200 dark:border-emerald-800"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>导出 Excel 表格 (.xlsx)</span>
          </button>

          <button
            id="report-export-svg-btn"
            onClick={handleExportSVG}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-medium transition-colors border border-blue-200 dark:border-blue-800"
          >
            <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>导出 SVG 矢量图</span>
          </button>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Category Distribution Pie */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              费用类别比例分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name.replace(/^(交通:|日常:)/, '')} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`¥${val.toFixed(2)}`, '金额']}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: '#334155',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Daily Cost Trend Bar Chart */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              每日费用趋势分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    formatter={(val: number) => [`¥${val.toFixed(2)}`]}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: '#334155',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {showTrips && <Bar dataKey="tripAmount" name="行程交通" fill="#2563eb" stackId="a" radius={[2, 2, 0, 0]} />}
                  {showExpenses && <Bar dataKey="expenseAmount" name="日常费用" fill="#059669" stackId="a" radius={[4, 4, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Tables */}
      <div className="space-y-6">
        {/* Table 1: Travel Trips */}
        {showTrips && (
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-blue-600" />
                行程明细表 ({filteredTrips.length} 条)
              </span>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                小计: ¥ {tripSubtotal.toFixed(2)}
              </span>
            </h3>

            {filteredTrips.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">选定区间内暂无行程记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">日期</th>
                      <th className="py-2.5 px-3">交通工具</th>
                      <th className="py-2.5 px-3">起止地点</th>
                      <th className="py-2.5 px-3">起止时间</th>
                      <th className="py-2.5 px-3 text-right">金额 (元)</th>
                      <th className="py-2.5 px-3">备注说明</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredTrips.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-medium">{t.date}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-medium">
                            {t.transport}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {t.origin || '-'} → {t.destination || '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          {t.startTime || '-'} ~ {t.endTime || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          ¥ {t.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{t.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Table 2: Other Expenses */}
        {showExpenses && (
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                其他费用明细表 ({filteredExpenses.length} 条)
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                小计: ¥ {expenseSubtotal.toFixed(2)}
              </span>
            </h3>

            {filteredExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">选定区间内暂无其他费用记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">日期</th>
                      <th className="py-2.5 px-3">费用类别</th>
                      <th className="py-2.5 px-3 text-right">金额 (元)</th>
                      <th className="py-2.5 px-3">费用说明</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-medium">{e.date}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-medium">
                            {e.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          ¥ {e.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{e.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
