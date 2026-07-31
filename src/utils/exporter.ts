import * as XLSX from 'xlsx';
import { TripItem, ExpenseItem } from '../types';
import { formatChineseDate } from './dateUtils';

interface ReportExportData {
  title: string;
  dateRangeText: string;
  trips: TripItem[];
  expenses: ExpenseItem[];
  tripSubtotal: number;
  expenseSubtotal: number;
  grandTotal: number;
  showTrips: boolean;
  showExpenses: boolean;
}

// 1. Export as Single Standalone HTML File
export function exportReportToHTML(data: ReportExportData): void {
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - 差旅费用报告</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1f2937;
      background-color: #f8fafc;
      margin: 0;
      padding: 32px 16px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header h1 {
      margin: 0 0 6px 0;
      font-size: 24px;
      color: #111827;
    }
    .header p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
    }
    .stat-card.total {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    .stat-title {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .stat-amount {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
    }
    .stat-card.total .stat-amount {
      color: #2563eb;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 28px 0 14px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 14px;
    }
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    tr:nth-child(even) {
      background-color: #fbfcfd;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background-color: #e0f2fe;
      color: #0369a1;
    }
    .amount-col {
      text-align: right;
      font-weight: 600;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; max-width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>${data.title}</h1>
        <p>统计区间：${data.dateRangeText}</p>
      </div>
      <div style="text-align: right;">
        <span class="badge" style="background:#f3e8ff; color:#7e22ce;">差旅费用统计表</span>
        <p style="font-size:12px; color:#9ca3af; margin-top:6px;">导出时间：${new Date().toLocaleString()}</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">交通行程小计</div>
        <div class="stat-amount">¥ ${data.tripSubtotal.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">其他费用小计</div>
        <div class="stat-amount">¥ ${data.expenseSubtotal.toFixed(2)}</div>
      </div>
      <div class="stat-card total">
        <div class="stat-title">总花费合计</div>
        <div class="stat-amount">¥ ${data.grandTotal.toFixed(2)}</div>
      </div>
    </div>

    ${
      data.showTrips
        ? `
      <div class="section-title">🚗 行程记录明细 (${data.trips.length} 条)</div>
      ${
        data.trips.length === 0
          ? '<p style="color:#9ca3af; font-size:14px;">暂无行程记录</p>'
          : `
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>交通工具</th>
              <th>起点 → 终点</th>
              <th>起止时间</th>
              <th style="text-align: right;">金额 (元)</th>
              <th>备注/说明</th>
            </tr>
          </thead>
          <tbody>
            ${data.trips
              .map(
                (t) => `
              <tr>
                <td>${t.date}</td>
                <td><span class="badge">${t.transport}</span></td>
                <td>${t.origin || '-'} → ${t.destination || '-'}</td>
                <td>${t.startTime || '-'} ~ ${t.endTime || '-'}</td>
                <td class="amount-col">¥ ${t.amount.toFixed(2)}</td>
                <td style="color:#6b7280;">${t.remarks || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
      }
    `
        : ''
    }

    ${
      data.showExpenses
        ? `
      <div class="section-title">💡 其他费用明细 (${data.expenses.length} 条)</div>
      ${
        data.expenses.length === 0
          ? '<p style="color:#9ca3af; font-size:14px;">暂无费用记录</p>'
          : `
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>费用类别</th>
              <th style="text-align: right;">金额 (元)</th>
              <th>费用说明</th>
            </tr>
          </thead>
          <tbody>
            ${data.expenses
              .map(
                (e) => `
              <tr>
                <td>${e.date}</td>
                <td><span class="badge" style="background:#fef3c7; color:#b45309;">${e.category}</span></td>
                <td class="amount-col">¥ ${e.amount.toFixed(2)}</td>
                <td style="color:#6b7280;">${e.description || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
      }
    `
        : ''
    }

    <div class="footer">
      本报告由 差旅行程记录 Web 应用 自动生成
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `差旅费用报告_${data.dateRangeText.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 2. Export as Excel (.xlsx) file
export function exportReportToExcel(data: ReportExportData): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary Sheet
  const summaryRows = [
    ['差旅费用分析汇总报告'],
    ['统计区间', data.dateRangeText],
    ['导出时间', new Date().toLocaleString()],
    [],
    ['费用维度', '明细笔数', '小计金额 (RMB)'],
    ['交通行程费用', data.trips.length, data.tripSubtotal],
    ['其他日常费用', data.expenses.length, data.expenseSubtotal],
    ['费用总花费', data.trips.length + data.expenses.length, data.grandTotal],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, '汇总统计');

  // Sheet 2: Trips
  if (data.showTrips) {
    const tripRows = [
      ['日期', '交通工具', '出发地', '目的地', '出发时间', '到达时间', '金额(元)', '备注说明'],
      ...data.trips.map((t) => [
        t.date,
        t.transport,
        t.origin || '',
        t.destination || '',
        t.startTime || '',
        t.endTime || '',
        t.amount,
        t.remarks || '',
      ]),
    ];
    const wsTrips = XLSX.utils.aoa_to_sheet(tripRows);
    XLSX.utils.book_append_sheet(wb, wsTrips, '行程明细');
  }

  // Sheet 3: Expenses
  if (data.showExpenses) {
    const expenseRows = [
      ['日期', '费用类别', '金额(元)', '费用说明'],
      ...data.expenses.map((e) => [
        e.date,
        e.category,
        e.amount,
        e.description || '',
      ]),
    ];
    const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows);
    XLSX.utils.book_append_sheet(wb, wsExpenses, '其他费用明细');
  }

  XLSX.writeFile(wb, `差旅费用明细表_${data.dateRangeText.replace(/\s+/g, '_')}.xlsx`);
}

// 3. Export SVG Vector Graphic
export function exportReportToSVG(data: ReportExportData, categoryData: { name: string; value: number }[]): void {
  const svgWidth = 800;
  const svgHeight = 600;

  // Build an SVG infographic
  const total = data.grandTotal || 1;

  let categoryBars = '';
  let yOffset = 260;

  categoryData.forEach((item, index) => {
    const pct = ((item.value / total) * 100).toFixed(1);
    const barWidth = Math.max(10, Math.min(400, (item.value / total) * 400));
    const colors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#2563eb'];
    const color = colors[index % colors.length];

    categoryBars += `
      <g transform="translate(40, ${yOffset})">
        <text x="0" y="15" font-family="sans-serif" font-size="14" fill="#374151">${item.name}</text>
        <rect x="120" y="2" width="400" height="18" rx="4" fill="#f3f4f6" />
        <rect x="120" y="2" width="${barWidth}" height="18" rx="4" fill="${color}" />
        <text x="535" y="16" font-family="sans-serif" font-size="14" font-weight="bold" fill="#111827">¥ ${item.value.toFixed(2)} (${pct}%)</text>
      </g>
    `;
    yOffset += 36;
  });

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${Math.max(svgHeight, yOffset + 60)}" width="${svgWidth}" height="${Math.max(svgHeight, yOffset + 60)}">
    <rect width="100%" height="100%" fill="#ffffff" rx="16" />
    <rect x="20" y="20" width="${svgWidth - 40}" height="${Math.max(svgHeight, yOffset + 60) - 40}" fill="#f8fafc" rx="12" stroke="#e2e8f0" stroke-width="1.5" />

    <!-- Header -->
    <text x="40" y="65" font-family="sans-serif" font-size="22" font-weight="bold" fill="#0f172a">${data.title} - 费用分布图表</text>
    <text x="40" y="90" font-family="sans-serif" font-size="13" fill="#64748b">统计区间: ${data.dateRangeText} | 生成时间: ${new Date().toLocaleDateString()}</text>

    <!-- Cards Summary -->
    <g transform="translate(40, 115)">
      <!-- Card 1 -->
      <rect x="0" y="0" width="220" height="90" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
      <text x="16" y="32" font-family="sans-serif" font-size="13" fill="#64748b">交通行程费用</text>
      <text x="16" y="66" font-family="sans-serif" font-size="20" font-weight="bold" fill="#0284c7">¥ ${data.tripSubtotal.toFixed(2)}</text>

      <!-- Card 2 -->
      <rect x="245" y="0" width="220" height="90" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
      <text x="16" y="32" font-family="sans-serif" font-size="13" fill="#64748b">其他常规费用</text>
      <text x="16" y="66" font-family="sans-serif" font-size="20" font-weight="bold" fill="#059669">¥ ${data.expenseSubtotal.toFixed(2)}</text>

      <!-- Card 3 -->
      <rect x="490" y="0" width="230" height="90" rx="10" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5" />
      <text x="16" y="32" font-family="sans-serif" font-size="13" fill="#1e40af">总花费合计</text>
      <text x="16" y="66" font-family="sans-serif" font-size="22" font-weight="bold" fill="#1d4ed8">¥ ${data.grandTotal.toFixed(2)}</text>
    </g>

    <!-- Section Title -->
    <text x="40" y="245" font-family="sans-serif" font-size="16" font-weight="bold" fill="#1e293b">费用类别分布明细</text>

    <!-- Category Bars -->
    ${categoryBars}

    <text x="40" y="${yOffset + 40}" font-family="sans-serif" font-size="12" fill="#94a3b8">差旅行程记录 Web 应用 矢量信息图表</text>
  </svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `差旅费用矢量图表_${data.dateRangeText.replace(/\s+/g, '_')}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
