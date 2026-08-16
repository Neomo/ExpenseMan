import React, { useState, useRef } from 'react';
import { z } from 'zod';
import { useAppStore } from '../../store/useAppStore';
import { AddCustomCategoryModal } from '../Forms/AddCustomCategoryModal';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { OcrConfig } from '../../types';
import {
  Settings,
  Download,
  Upload,
  Plus,
  Trash2,
  Tag,
  Sparkles,
  AlertTriangle,
  FileJson,
  Database,
  Key,
  ShieldCheck,
  Save,
  Layers,
  Coins,
  MapPin,
  Zap,
} from 'lucide-react';
import { TicketRegionEditorModal } from '../OCR/TicketRegionEditorModal';
import { DEFAULT_RAILWAY_TEMPLATE } from '../../utils/ticketOcr';
import { CityStationManager } from './CityStationManager';

// Zod Schema for JSON Backup Validation
const backupDataSchema = z.object({
  version: z.string().optional(),
  exportTime: z.string().optional(),
  backupType: z.enum(['data_only', 'full']).optional(),
  trips: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      transport: z.string(),
      amount: z.number(),
    })
  ).optional(),
  expenses: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      category: z.string(),
      amount: z.number(),
    })
  ).optional(),
  customCategories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
    })
  ).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

export const DataSettingsView: React.FC = () => {
  const {
    customCategories,
    deleteCustomCategory,
    exportData,
    importData,
    clearAllData,
    seedDemoData,
    showToast,
    trips,
    expenses,
    ocrConfig,
    saveOcrConfig,
    allowanceConfig,
    updateAllowanceConfig,
    generateTripAllowances,
  } = useAppStore();

  const [allowanceForm, setAllowanceForm] = useState({
    homeCity: allowanceConfig?.homeCity || '武汉',
    allowanceRate: allowanceConfig?.allowanceRate || 80,
    autoAddAllowance: allowanceConfig?.autoAddAllowance !== false,
  });

  const [ocrForm, setOcrForm] = useState<OcrConfig>({
    provider: ocrConfig?.provider || 'system_gemini',
    apiKey: ocrConfig?.apiKey || '',
    apiSecret: ocrConfig?.apiSecret || '',
  });

  const [addCatModal, setAddCatModal] = useState<{ isOpen: boolean; type: 'transport' | 'expense' }>({
    isOpen: false,
    type: 'transport',
  });

  const [confirmDeleteCat, setConfirmDeleteCat] = useState<{ id: string; name: string } | null>(null);
  const [confirmClearData, setConfirmClearData] = useState(false);

  // Import Modal & File Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importModeModalOpen, setImportModeModalOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);

  // Coordinate Editor Modal state
  const [isCoordinateEditorOpen, setIsCoordinateEditorOpen] = useState(false);

  const transportCategories = customCategories.filter((c) => c.type === 'transport');
  const expenseCategories = customCategories.filter((c) => c.type === 'expense');

  // Handle Export Data Only
  const handleExportDataOnly = async () => {
    try {
      const data = await exportData('data_only');
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `差旅行程与费用数据_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('行程及费用数据已成功导出', 'success');
    } catch (err) {
      showToast('导出数据失败', 'error');
    }
  };

  // Handle Export Full Backup with all settings
  const handleExportFull = async () => {
    try {
      const data = await exportData('full');
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `差旅系统完整配置备份_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('全量数据与用户偏好设置已成功打包导出', 'success');
    } catch (err) {
      showToast('导出数据失败', 'error');
    }
  };

  // Handle Select JSON File for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // Zod validation
        const result = backupDataSchema.safeParse(parsed);
        if (!result.success) {
          showToast('JSON 文件格式非法或不完整，请提供有效的备份文件', 'error');
          return;
        }

        setPendingImportData(parsed);
        setImportModeModalOpen(true);
      } catch (err) {
        showToast('JSON 解析失败，请确认文件是否有效', 'error');
      }
    };
    reader.readAsText(file);
    // Reset value so user can re-select same file if needed
    e.target.value = '';
  };

  const handleConfirmImport = async (mode: 'override' | 'merge') => {
    if (!pendingImportData) return;
    await importData(pendingImportData, mode);
    setPendingImportData(null);
    setImportModeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              数据管理与分类扩展
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              管理自定义交通/费用类别、导出或导入 JSON 数据，以及进行本地数据库维护
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Custom Categories Management */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                自定义分类扩展
              </h3>
            </div>
            <p className="text-xs text-slate-400">本地自动持久化</p>
          </div>

          {/* Transport Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                交通工具类别 ({transportCategories.length})
              </span>
              <button
                id="settings-add-transport-cat-btn"
                onClick={() => setAddCatModal({ isOpen: true, type: 'transport' })}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                新增交通方式
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {transportCategories.map((c, idx) => (
                <div
                  key={`tcat-${c.id}-${idx}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center gap-2"
                >
                  <span>{c.name}</span>
                  {!c.isDefault && (
                    <button
                      onClick={() => setConfirmDeleteCat({ id: c.id, name: c.name })}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                      title="删除自定义类别"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Expense Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                日常费用类别 ({expenseCategories.length})
              </span>
              <button
                id="settings-add-expense-cat-btn"
                onClick={() => setAddCatModal({ isOpen: true, type: 'expense' })}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                新增费用类别
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((c, idx) => (
                <div
                  key={`ecat-${c.id}-${idx}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center gap-2"
                >
                  <span>{c.name}</span>
                  {!c.isDefault && (
                    <button
                      onClick={() => setConfirmDeleteCat({ id: c.id, name: c.name })}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                      title="删除自定义类别"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 1.5: Travel Subsidy / Allowance Settings */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                出差补贴与异地行程设置
              </h3>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              自动闭环检测
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            系统可自动检测离开常驻本地城市的【闭环差旅行程】，并在出差的全周期（含往返和中间出差留宿日期）中按日补贴标准自动生成补贴费用。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                常驻本地城市
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={allowanceForm.homeCity}
                  onChange={(e) => setAllowanceForm((prev) => ({ ...prev, homeCity: e.target.value }))}
                  onBlur={() => updateAllowanceConfig({ homeCity: allowanceForm.homeCity })}
                  placeholder="例如：武汉"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                补贴标准金额 (元/天)
              </label>
              <div className="relative">
                <span className="text-xs text-slate-400 absolute left-3 top-2.5 font-semibold">¥</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={allowanceForm.allowanceRate}
                  onChange={(e) => setAllowanceForm((prev) => ({ ...prev, allowanceRate: Number(e.target.value) }))}
                  onBlur={() => updateAllowanceConfig({ allowanceRate: Number(allowanceForm.allowanceRate) })}
                  placeholder="例如：80"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={allowanceForm.autoAddAllowance}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAllowanceForm((prev) => ({ ...prev, autoAddAllowance: checked }));
                  updateAllowanceConfig({ autoAddAllowance: checked });
                }}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700"
              />
              <span>检测到异地闭环行程时自动添加补贴</span>
            </label>

            <button
              onClick={() => generateTripAllowances(true)}
              className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>一键计算并补全异地补贴</span>
            </button>
          </div>
        </div>

        {/* Section 2: Backup / Migration / Demo Data */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                JSON 数据备份与迁移
              </h3>
            </div>
            <p className="text-xs text-slate-400">IndexedDB 本地引擎</p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            支持仅导出行程与费用明细（方便跨用户数据迁移与统计），或导出包含日历视觉主题、高级导出配置、OCR 与车站数据库等全部用户偏好的完整备份。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              id="settings-export-data-only-btn"
              onClick={handleExportDataOnly}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 transition-all flex flex-col items-center justify-center text-center gap-1.5"
            >
              <Download className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                仅导出行程及费用
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                纯业务数据/轻量归档
              </span>
            </button>

            <button
              id="settings-export-full-btn"
              onClick={handleExportFull}
              className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/70 hover:border-blue-400 transition-all flex flex-col items-center justify-center text-center gap-1.5 shadow-xs"
            >
              <FileJson className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                导出完整备份 (含设置)
              </span>
              <span className="text-[10px] text-blue-600/80 dark:text-blue-300/80">
                含日历主题/导出/OCR等
              </span>
            </button>

            <button
              id="settings-import-json-btn"
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 transition-all flex flex-col items-center justify-center text-center gap-1.5"
            >
              <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                导入 JSON 备份
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                自动识别数据与设置
              </span>
            </button>

            {/* Hidden Input for File Selector */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Database Maintenance Tools */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              维护工具
            </span>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                id="settings-seed-demo-btn"
                onClick={seedDemoData}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>载入示例文档数据</span>
              </button>

              <button
                id="settings-clear-all-btn"
                onClick={() => setConfirmClearData(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-medium transition-colors border border-rose-200 dark:border-rose-900"
              >
                <Trash2 className="w-4 h-4" />
                <span>清空所有历史数据</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* City & Railway Station Database Manager Section */}
      <CityStationManager />

      {/* Section 3: OCR Service & Security Configuration */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              智能票据 OCR 识别服务配置
            </h3>
          </div>
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            密钥安全：仅保存在本地 IndexedDB
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              识别引擎 / 服务提供商
            </label>
            <select
              value={ocrForm.provider}
              onChange={(e) =>
                setOcrForm((prev) => ({
                  ...prev,
                  provider: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="local_paddle">🚀 本地浏览器 Web-PaddleOCR (纯前端 / 零数据外传)</option>
              <option value="system_gemini">⚡ 系统默认（配置于服务器 .env 的 Gemini API）</option>
              <option value="custom_gemini">🔑 自定义 Gemini 3.6 Flash API Key</option>
              <option value="baidu_ocr">🇨🇳 百度智能云 - 火车票 OCR 接口</option>
              <option value="tencent_ocr">🐧 腾讯云 - 运单与交通票据 OCR</option>
              <option value="aliyun_ocr">🟠 阿里云 - 火车票/行程单识别</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              API Key / Client ID
            </label>
            <input
              type="password"
              placeholder={
                ocrForm.provider === 'local_paddle' || ocrForm.provider === 'system_gemini'
                  ? '本地/系统默认引擎无需 API Key（留空即可）'
                  : '请输入您的 API Key'
              }
              disabled={ocrForm.provider === 'local_paddle' || ocrForm.provider === 'system_gemini'}
              value={ocrForm.apiKey || ''}
              onChange={(e) =>
                setOcrForm((prev) => ({ ...prev, apiKey: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Secret Key (部分第三方需要)
            </label>
            <input
              type="password"
              placeholder={
                ocrForm.provider === 'local_paddle' || ocrForm.provider === 'system_gemini' || ocrForm.provider === 'custom_gemini'
                  ? '当前引擎无需 Secret Key'
                  : '请输入 Secret Key'
              }
              disabled={ocrForm.provider === 'local_paddle' || ocrForm.provider === 'system_gemini' || ocrForm.provider === 'custom_gemini'}
              value={ocrForm.apiSecret || ''}
              onChange={(e) =>
                setOcrForm((prev) => ({ ...prev, apiSecret: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            🔐 安全声明：系统默认密钥保存在服务端 .env 中。您填写的私密 API Key 仅存储在浏览器 IndexedDB 本地，绝对不会上传第三方服务器。
          </p>

          <button
            onClick={() => saveOcrConfig(ocrForm)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>保存 OCR 密钥配置</span>
          </button>
        </div>
      </div>

      {/* Section 4: Ticket Coordinate Region Mapping Profiles */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#52c488]" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>车票物理坐标校准 & 区域识别配对模板</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                  物理坐标锁定引擎
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                可自定义划框配置中国铁路 12306 电子行程单、机票与大巴票关键字段的位置坐标，彻底消除开票日期与出发地错位的识别难题。
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCoordinateEditorOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#52c488] hover:bg-[#3f9e6d] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all shrink-0 border-b-2 border-[#32855b]"
          >
            <Layers className="w-4 h-4" />
            <span>📐 校准车票字段物理坐标</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="space-y-1">
            <div className="font-bold text-slate-800 dark:text-slate-200">
              当前全局默认模板：中国铁路电子客票 / 行程单标准模板
            </div>
            <div className="text-[#8e8071] dark:text-slate-400 text-[11px]">
              包含字段：起点、终点、车次/航班、乘车日期（排除开票日期）、发车时间、票价、席别
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300">
            已激活
          </span>
        </div>
      </div>

      {/* Coordinate Editor Modal */}
      {isCoordinateEditorOpen && (
        <TicketRegionEditorModal
          isOpen={isCoordinateEditorOpen}
          onClose={() => setIsCoordinateEditorOpen(false)}
          currentTemplate={DEFAULT_RAILWAY_TEMPLATE}
          onSaveTemplate={(updatedTemplate) => {
            showToast(`已成功保存车票物理坐标匹配模板【${updatedTemplate.name}】！`, 'success');
            setIsCoordinateEditorOpen(false);
          }}
        />
      )}

      {/* Modal for Custom Category Add */}
      <AddCustomCategoryModal
        isOpen={addCatModal.isOpen}
        type={addCatModal.type}
        onClose={() => setAddCatModal({ ...addCatModal, isOpen: false })}
      />

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteCat}
        title="确认删除该分类？"
        description={`确定删除类别「${confirmDeleteCat?.name}」吗？历史已关联的记录不会受影响。`}
        onConfirm={async () => {
          if (confirmDeleteCat) await deleteCustomCategory(confirmDeleteCat.id);
          setConfirmDeleteCat(null);
        }}
        onCancel={() => setConfirmDeleteCat(null)}
      />

      {/* Clear All Data Confirmation */}
      <ConfirmDialog
        isOpen={confirmClearData}
        title="警告：清空所有数据"
        description={`此操作将永久清空本地 IndexedDB 中的所有 ${trips.length} 条行程和 ${expenses.length} 条日常费用记录，且无法恢复。建议先导出 JSON 备份。`}
        confirmText="确认清空"
        variant="danger"
        onConfirm={async () => {
          await clearAllData();
          setConfirmClearData(false);
        }}
        onCancel={() => setConfirmClearData(false)}
      />

      {/* Import Mode Selection Modal */}
      {importModeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 shrink-0">
                <FileJson className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  选择 JSON 备份导入方式
                </h3>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {pendingImportData?.backupType === 'full' || pendingImportData?.settings
                    ? '🗂️ 完整备份 (含用户设置偏好)'
                    : '📦 业务数据备份 (行程与费用)'}
                </span>
              </div>
            </div>

            {/* Content summary breakdown */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>备份文件解析明细：</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {pendingImportData?.exportTime ? new Date(pendingImportData.exportTime).toLocaleDateString() : '未知时间'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                <div className="flex items-center gap-1">
                  <span>🚆 行程记录:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{pendingImportData?.trips?.length || 0} 条</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🪙 费用记录:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{pendingImportData?.expenses?.length || 0} 条</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🏷️ 分类扩充:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{pendingImportData?.customCategories?.length || 0} 项</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⚙️ 用户偏好设置:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {pendingImportData?.settings ? '包含' : '无'}
                  </span>
                </div>
              </div>
              {pendingImportData?.settings && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                  ✅ 包含：日历视觉与显示、高级导出参数、出差补贴与本地常驻地、OCR 密钥及城市车站库等设置
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              请选择要处理现有本地数据的方式：
            </p>

            <div className="space-y-2">
              <button
                id="import-mode-merge-btn"
                onClick={() => handleConfirmImport('merge')}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-300 text-left transition-all group"
              >
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                  🔀 追加合并 (推荐)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  保留当前已有的记录，并将导入文件中的新数据追加合并，更新系统配置
                </div>
              </button>

              <button
                id="import-mode-override-btn"
                onClick={() => handleConfirmImport('override')}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-300 text-left transition-all group"
              >
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-rose-600">
                  ⚠️ 完全覆盖替换
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  清空当前本地 IndexedDB 数据，完全替换为导入文件中的内容与配置
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setPendingImportData(null);
                  setImportModeModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                取消导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
