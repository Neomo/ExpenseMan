import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Plane,
  Trash2,
  Edit2,
  Lock,
  ChevronRight,
  Info,
  Check,
  Cpu,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { processTicketOcr, getOcrProviderName } from '../../utils/ticketOcr';
import { TicketOcrResult, TripItem, TransportType } from '../../types';

interface DraftTrip extends TicketOcrResult {
  // Editable fields for user verification
  editedTrainNumber: string;
  editedTransport: TransportType;
  editedOrigin: string;
  editedDestination: string;
  editedDate: string;
  editedStartTime: string;
  editedAmount: number;
  editedRemarks: string;
  isEditing?: boolean;
}

export const TicketOcrModal: React.FC = () => {
  const {
    ocrModalOpen,
    closeOcrModal,
    ocrConfig,
    batchAddTrips,
    openTripModal,
    showToast,
  } = useAppStore();

  const [drafts, setDrafts] = useState<DraftTrip[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!ocrModalOpen) return null;

  const activeProviderName = getOcrProviderName(ocrConfig?.provider);

  // Handle file selection (single or batch)
  const handleFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png'];

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && allowedExts.includes(ext)) {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) {
      showToast('仅支持上传 .pdf, .jpg, .jpeg, .png 格式的文件', 'error');
      return;
    }

    setIsProcessing(true);
    setProgressText(`准备识别 ${validFiles.length} 张票据...`);

    const newDrafts: DraftTrip[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setProgressText(`正在处理第 ${i + 1}/${validFiles.length} 张: ${file.name}`);

      const result = await processTicketOcr(file, ocrConfig);

      // Create draft trip state
      const draft: DraftTrip = {
        ...result,
        editedTrainNumber: result.trainNumber || '',
        editedTransport: result.transportType || '火车',
        editedOrigin: result.origin || '',
        editedDestination: result.destination || '',
        editedDate: result.departureDate || new Date().toISOString().split('T')[0],
        editedStartTime: result.departureTime || '',
        editedAmount: result.price || 0,
        editedRemarks: result.seatInfo ? `席别: ${result.seatInfo}` : '',
      };

      newDrafts.push(draft);
    }

    setDrafts((prev) => [...prev, ...newDrafts]);
    setIsProcessing(false);
    setProgressText('');

    const successCount = newDrafts.filter((d) => d.status === 'success').length;
    if (successCount > 0) {
      showToast(`已完成 ${successCount} 张票据识别`, 'success');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Re-run recognition for a single item
  const handleRetryItem = async (index: number) => {
    // Open file chooser to replace this item
    fileInputRef.current?.click();
  };

  // Remove a draft
  const handleRemoveDraft = (index: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all drafts
  const handleClearAll = () => {
    setDrafts([]);
  };

  // Save single draft to Trip form
  const handleSingleFillForm = (draft: DraftTrip) => {
    const tripItem: TripItem = {
      id: `trip-ocr-${Date.now()}`,
      date: draft.editedDate || new Date().toISOString().split('T')[0],
      transport: draft.editedTransport,
      origin: draft.editedOrigin || undefined,
      destination: draft.editedDestination || undefined,
      startTime: draft.editedStartTime || undefined,
      amount: Number(draft.editedAmount) || 0,
      remarks: draft.editedRemarks || undefined,
      createdAt: Date.now(),
    };

    closeOcrModal();
    openTripModal(tripItem);
  };

  // Batch save all valid drafts
  const handleBatchSaveAll = async () => {
    const validDrafts = drafts.filter((d) => d.status === 'success');
    if (validDrafts.length === 0) {
      showToast('没有可保存的成功识别记录', 'error');
      return;
    }

    const tripItems: TripItem[] = validDrafts.map((d, index) => ({
      id: `trip-ocr-${Date.now()}-${index}`,
      date: d.editedDate || new Date().toISOString().split('T')[0],
      transport: d.editedTransport,
      origin: d.editedOrigin || undefined,
      destination: d.editedDestination || undefined,
      startTime: d.editedStartTime || undefined,
      amount: Number(d.editedAmount) || 0,
      remarks: d.editedRemarks || undefined,
      createdAt: Date.now() + index,
    }));

    await batchAddTrips(tripItems);
    setDrafts([]);
  };

  // Helper function to render confidence border
  const getFieldBorderClass = (scores: Record<string, number> | undefined, fieldKey: string) => {
    if (!scores) return 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20';
    const score = scores[fieldKey];
    if (score === undefined || score >= 0.8) {
      return 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20 focus:ring-emerald-500';
    }
    return 'border-amber-400 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 focus:ring-amber-500';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md">
        <motion.div
          id="ticket-ocr-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl bg-white dark:bg-slate-900 border-3 border-[#a2e0bd] dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b-2 border-[#d0eedb] dark:border-slate-800 flex items-center justify-between bg-[#f0faf4] dark:bg-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#52c488] text-white shadow-xs">
                <Sparkles className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-lg text-[#21633f] dark:text-emerald-300">
                    智能票据识别录入
                  </h3>
                  {/* Engine Indicator Badge */}
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 font-extrabold text-xs border border-indigo-300 dark:border-indigo-700 flex items-center gap-1 shadow-xs">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>识别引擎：{activeProviderName}</span>
                  </span>
                </div>
                <p className="text-xs font-bold text-[#3d835d] dark:text-slate-400 mt-0.5">
                  支持电子火车票 PDF、纸质车票照片及机票行程单，自动填充表单
                </p>
              </div>
            </div>

            <button
              id="ticket-ocr-close-btn"
              onClick={closeOcrModal}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                dragActive
                  ? 'border-[#52c488] bg-[#e8f7ee] dark:bg-emerald-950/40 scale-[1.01]'
                  : 'border-[#b8e2cb] hover:border-[#52c488] bg-[#fbfdfc] dark:bg-slate-900/60 hover:bg-[#f0faf4] dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFiles(e.target.files);
                  }
                }}
              />

              <div className="w-16 h-16 rounded-3xl bg-[#e3f6ec] dark:bg-emerald-950 text-[#2f8859] dark:text-emerald-300 flex items-center justify-center text-3xl shadow-sm">
                ✈️
              </div>

              <div>
                <p className="text-base font-black text-[#3b322a] dark:text-slate-100">
                  点击或将票据文件拖拽至此处上传
                </p>
                <p className="text-xs font-bold text-[#8e8071] dark:text-slate-400 mt-1">
                  支持 12306 电子客票 PDF、蓝/红纸质火车票照片、大巴与机票等（可批量多选）
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] font-extrabold text-[#52c488] dark:text-emerald-400">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300">
                  📄 .PDF (12306 行程单)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300">
                  🖼️ .JPG / .PNG (纸质拍照)
                </span>
              </div>
            </div>

            {/* Processing Banner with Active Engine Indicator */}
            {isProcessing && (
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border-2 border-indigo-200 dark:border-indigo-800 flex items-center gap-3.5 shadow-sm">
                <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>正在调用【{activeProviderName}】进行图像与票据字段扫描...</span>
                  </div>
                  <p className="text-xs font-bold text-indigo-900/80 dark:text-indigo-200 mt-0.5">
                    {progressText}
                  </p>
                </div>
              </div>
            )}

            {/* Drafts List */}
            {drafts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-black text-[#3b322a] dark:text-slate-100 flex items-center gap-2">
                    <span>已识别票据列表 ({drafts.length})</span>
                    <span className="text-xs font-bold text-[#52c488] bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200">
                      点击绿色/黄色边框字段可编辑修正
                    </span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearAll}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      清空列表
                    </button>
                  </div>
                </div>

                {/* Helpful Legend */}
                <div className="bg-[#faf5e8] dark:bg-slate-800/80 p-3 rounded-2xl border border-[#eadaa8] dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#54411f] dark:text-slate-300">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      绿色边框：OCR 高置信度 (&ge;80%) 自动识别
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                      黄色边框：待确认 (置信度&lt;80%)
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8e8071] dark:text-slate-400">
                    💡 提示：火车票票面通常不含到达时间，可手动补充
                  </span>
                </div>

                {/* Individual Draft Cards */}
                <div className="space-y-4">
                  {drafts.map((draft, idx) => (
                    <div
                      key={draft.fileId}
                      className="p-5 rounded-3xl border-2 bg-white dark:bg-slate-800/90 shadow-md transition-all space-y-4 border-[#b8e2cb] dark:border-slate-700"
                    >
                      {/* Card Top Header */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <FileText className="w-4 h-4 text-[#52c488] shrink-0" />
                          <span className="font-extrabold text-xs text-[#3b322a] dark:text-slate-200 truncate max-w-[160px] sm:max-w-[240px]">
                            {draft.fileName}
                          </span>
                          {/* Engine Indicator on Card */}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            引擎: {draft.providerName || activeProviderName}
                          </span>

                          {draft.status === 'success' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              识别成功
                            </span>
                          )}
                          {draft.status === 'error' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1 border border-rose-300">
                              <AlertTriangle className="w-3 h-3" />
                              {draft.isEncryptedPdf ? '加密 PDF' : '识别异常'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemoveDraft(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                            title="删除此票据"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Error State Handler */}
                      {draft.status === 'error' ? (
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-2">
                          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                            {draft.isEncryptedPdf ? <Lock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            <span>{draft.errorMessage || '识别失败，建议手动录入'}</span>
                          </div>
                          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                            {draft.isEncryptedPdf
                              ? '提示：12306 导出的部分 PDF 文件设置了密码保护。您可以将 PDF 打开并截图为图片 (.png/.jpg) 后重新上传识别。'
                              : '未能从图片中解析出有效字段。请确保票据清晰无遮挡，或直接点击下方按钮手动填入行程。'}
                          </p>
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={() => {
                                closeOcrModal();
                                openTripModal(undefined, new Date().toISOString().split('T')[0]);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
                            >
                              手动录入行程
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Recognized Fields Form Grid */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          {/* Transport & Train Number */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              交通工具 / 车次航班
                            </label>
                            <div className="flex gap-1.5">
                              <select
                                value={draft.editedTransport}
                                onChange={(e) => {
                                  const val = e.target.value as TransportType;
                                  setDrafts((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, editedTransport: val } : d))
                                  );
                                }}
                                className="w-24 px-2 py-1.5 rounded-xl text-xs font-bold border focus:outline-none bg-white dark:bg-slate-900 dark:text-slate-100"
                              >
                                <option value="高铁">高铁</option>
                                <option value="火车">火车</option>
                                <option value="飞机">飞机</option>
                                <option value="大巴">大巴</option>
                                <option value="的士">的士</option>
                                <option value="网约车">网约车</option>
                              </select>
                              <input
                                type="text"
                                placeholder="如 G1234"
                                value={draft.editedTrainNumber}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDrafts((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, editedTrainNumber: val } : d))
                                  );
                                }}
                                className={`flex-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${getFieldBorderClass(
                                  draft.confidenceScores,
                                  'trainNumber'
                                )}`}
                              />
                            </div>
                          </div>

                          {/* Origin & Destination */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              起点 → 终点
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="出发站"
                                value={draft.editedOrigin}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDrafts((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, editedOrigin: val } : d))
                                  );
                                }}
                                className={`w-1/2 px-2.5 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${getFieldBorderClass(
                                  draft.confidenceScores,
                                  'origin'
                                )}`}
                              />
                              <span className="text-slate-400 font-bold">→</span>
                              <input
                                type="text"
                                placeholder="到达站"
                                value={draft.editedDestination}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDrafts((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, editedDestination: val } : d))
                                  );
                                }}
                                className={`w-1/2 px-2.5 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${getFieldBorderClass(
                                  draft.confidenceScores,
                                  'destination'
                                )}`}
                              />
                            </div>
                          </div>

                          {/* Date & Time */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              出发日期 & 发车时间
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="date"
                                value={draft.editedDate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDrafts((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, editedDate: val } : d))
                                  );
                                }}
                                className={`flex-1 px-2 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${getFieldBorderClass(
                                  draft.confidenceScores,
                                  'departureDate'
                                )}`}
                              />
                              <input
                                type="time"
                                value={draft.editedStartTime}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDrafts((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, editedStartTime: val } : d))
                                  );
                                }}
                                className={`w-20 px-2 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${getFieldBorderClass(
                                  draft.confidenceScores,
                                  'departureTime'
                                )}`}
                              />
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              票价/金额 (元)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.1"
                                value={draft.editedAmount}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setDrafts((prev) =>
                                    prev.map((d, i) => (i === idx ? { ...d, editedAmount: val } : d))
                                  );
                                }}
                                className={`flex-1 px-2.5 py-1.5 rounded-xl text-xs font-black font-mono border focus:outline-none ${getFieldBorderClass(
                                  draft.confidenceScores,
                                  'price'
                                )}`}
                              />

                              <button
                                onClick={() => handleSingleFillForm(draft)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#e3f6ec] hover:bg-[#d0eedb] text-[#2f8859] font-black text-xs shrink-0 flex items-center gap-1 border border-[#a2e0bd] transition-colors"
                                title="打开独立表单精细编辑或保存"
                              >
                                <span>单条精修</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t-2 border-[#d0eedb] dark:border-slate-800 bg-[#f0faf4] dark:bg-slate-800/80 flex items-center justify-between gap-3">
            <div className="text-xs font-bold text-[#3d835d] dark:text-slate-400">
              {drafts.length > 0 ? (
                <span>共 {drafts.length} 张票据解析，就绪后可一键批量导入行程表</span>
              ) : (
                <span>支持单次选择多文件进行批量 AI 智能 OCR 扫描</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={closeOcrModal}
                className="btn-island-secondary px-4 py-2 text-xs font-extrabold"
              >
                取消
              </button>

              {drafts.length > 0 && drafts.some((d) => d.status === 'success') && (
                <button
                  onClick={handleBatchSaveAll}
                  className="btn-island-primary px-5 py-2 text-xs font-extrabold flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>一键保存全套行程 ({drafts.filter((d) => d.status === 'success').length})</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
