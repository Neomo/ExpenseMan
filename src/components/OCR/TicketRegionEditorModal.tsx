import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  MapPin,
  Calendar,
  Clock,
  Train,
  CreditCard,
  Armchair,
  Save,
  HelpCircle,
  Eye,
  Maximize2,
} from 'lucide-react';
import {
  TicketTemplateProfile,
  RegionBox,
  TicketFieldKey,
  PdfTextItemWithPos,
} from '../../types';
import {
  DEFAULT_RAILWAY_TEMPLATE,
  DEFAULT_FLIGHT_TEMPLATE,
  DEFAULT_BUS_TEMPLATE,
  extractTextInRegionBox,
  parseFieldFromText,
} from '../../utils/ticketOcr';

interface TicketRegionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc?: string;
  pdfTextItemsWithPos?: PdfTextItemWithPos[];
  pdfTextLines?: string[];
  currentTemplate?: TicketTemplateProfile;
  savedTemplates?: TicketTemplateProfile[];
  onSaveTemplate: (template: TicketTemplateProfile, setAsActive?: boolean) => void;
}

const FIELD_CONFIGS: {
  key: TicketFieldKey;
  label: string;
  icon: any;
  color: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
}[] = [
  {
    key: 'origin',
    label: '起点 / 始发站',
    icon: MapPin,
    color: '#3b82f6',
    borderClass: 'border-blue-500',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'destination',
    label: '终点 / 到达站',
    icon: MapPin,
    color: '#6366f1',
    borderClass: 'border-indigo-500',
    bgClass: 'bg-indigo-500/20',
    textClass: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    key: 'trainNumber',
    label: '车次 / 航班号',
    icon: Train,
    color: '#a855f7',
    borderClass: 'border-purple-500',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-600 dark:text-purple-400',
  },
  {
    key: 'departureDate',
    label: '出发 / 乘车日期',
    icon: Calendar,
    color: '#10b981',
    borderClass: 'border-emerald-500',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'departureTime',
    label: '出发 / 发车时间',
    icon: Clock,
    color: '#f59e0b',
    borderClass: 'border-amber-500',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'price',
    label: '票价 / 金额',
    icon: CreditCard,
    color: '#f43f5e',
    borderClass: 'border-rose-500',
    bgClass: 'bg-rose-500/20',
    textClass: 'text-rose-600 dark:text-rose-400',
  },
  {
    key: 'seatInfo',
    label: '席别 / 车厢座位',
    icon: Armchair,
    color: '#14b8a6',
    borderClass: 'border-teal-500',
    bgClass: 'bg-teal-500/20',
    textClass: 'text-teal-600 dark:text-teal-400',
  },
];

export const TicketRegionEditorModal: React.FC<TicketRegionEditorModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  pdfTextItemsWithPos,
  pdfTextLines,
  currentTemplate = DEFAULT_RAILWAY_TEMPLATE,
  savedTemplates = [],
  onSaveTemplate,
}) => {
  const [templateName, setTemplateName] = useState(currentTemplate.name || '我的车票坐标匹配模板');
  const [regions, setRegions] = useState<Record<TicketFieldKey, RegionBox>>(
    currentTemplate.regions || DEFAULT_RAILWAY_TEMPLATE.regions
  );
  const [activeFieldKey, setActiveFieldKey] = useState<TicketFieldKey>('origin');

  // Mouse drag drawing state on image container
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTemplate) {
      setTemplateName(currentTemplate.name);
      setRegions(currentTemplate.regions);
    }
  }, [currentTemplate]);

  if (!isOpen) return null;

  // Compute live extracted values for each field based on region boxes
  const liveExtractedValues = useMemo(() => {
    const result: Record<TicketFieldKey, string> = {
      origin: '',
      destination: '',
      trainNumber: '',
      departureDate: '',
      departureTime: '',
      price: '',
      seatInfo: '',
    };

    FIELD_CONFIGS.forEach(({ key }) => {
      const box = regions[key];
      if (box) {
        const rawText = pdfTextItemsWithPos && pdfTextItemsWithPos.length > 0
          ? extractTextInRegionBox(pdfTextItemsWithPos, box)
          : '';
        result[key] = parseFieldFromText(key, rawText, pdfTextLines);
      }
    });

    return result;
  }, [regions, pdfTextItemsWithPos, pdfTextLines]);

  // Handle preset selection
  const handleLoadPreset = (preset: TicketTemplateProfile) => {
    setTemplateName(preset.name);
    setRegions(preset.regions);
  };

  // Canvas Mouse events for drawing box
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setIsDragging(true);
    setDragStartPos({ x: xPct, y: yPct });
    setDragCurrentPos({ x: xPct, y: yPct });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setDragCurrentPos({ x: xPct, y: yPct });
  };

  const handleMouseUp = () => {
    if (isDragging && dragStartPos && dragCurrentPos) {
      const minX = Math.min(dragStartPos.x, dragCurrentPos.x);
      const minY = Math.min(dragStartPos.y, dragCurrentPos.y);
      const width = Math.abs(dragCurrentPos.x - dragStartPos.x);
      const height = Math.abs(dragCurrentPos.y - dragStartPos.y);

      // Only apply if user dragged at least 2% width and height
      if (width > 2 && height > 2) {
        setRegions((prev) => ({
          ...prev,
          [activeFieldKey]: {
            x: Math.round(minX * 10) / 10,
            y: Math.round(minY * 10) / 10,
            width: Math.round(width * 10) / 10,
            height: Math.round(height * 10) / 10,
          },
        }));
      }
    }
    setIsDragging(false);
    setDragStartPos(null);
    setDragCurrentPos(null);
  };

  const handleSave = () => {
    const updatedProfile: TicketTemplateProfile = {
      id: currentTemplate.id || `tpl-${Date.now()}`,
      name: templateName.trim() || '自定义车票坐标模板',
      regions,
      createdAt: Date.now(),
    };
    onSaveTemplate(updatedProfile, true);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-[#52c488] dark:border-slate-700 w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#faf5e8] dark:bg-slate-800/90 border-b border-[#e5f3ea] dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-2xl bg-[#52c488] text-white shadow-sm flex-shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>车票物理坐标校准 & 区域解析配置</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-extrabold border border-emerald-300">
                    可视化拖框配对
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  在车票图上划框定位各个关键字段（解决开票日期误混与起点终点反向的问题），保存后后续车票将自动精准匹配提取。
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls & Field List (5 cols) */}
            <div className="lg:col-span-5 space-y-4 flex flex-col">
              {/* Template Preset Selector & Name */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#52c488]" />
                    <span>模板名称 & 标准预设</span>
                  </label>
                  <span className="text-[10px] text-slate-400">一键套用经典布局</span>
                </div>

                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="如：中国铁路电子客票坐标模板"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#52c488] focus:outline-none"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => handleLoadPreset(DEFAULT_RAILWAY_TEMPLATE)}
                    className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 text-[11px] font-bold hover:bg-blue-200 transition-all border border-blue-200 dark:border-blue-800"
                  >
                    🚆 铁路电子行程单
                  </button>
                  <button
                    onClick={() => handleLoadPreset(DEFAULT_FLIGHT_TEMPLATE)}
                    className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 text-[11px] font-bold hover:bg-purple-200 transition-all border border-purple-200 dark:border-purple-800"
                  >
                    ✈️ 航空行程单
                  </button>
                  <button
                    onClick={() => handleLoadPreset(DEFAULT_BUS_TEMPLATE)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-200 transition-all border border-emerald-200 dark:border-emerald-800"
                  >
                    🚌 大巴客运票
                  </button>
                </div>
              </div>

              {/* Fields List */}
              <div className="space-y-2 flex-1">
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between px-1">
                  <span>选择需配对的字段 (点击选定后在右图拖框):</span>
                  <span className="text-[10px] text-slate-500 font-normal">坐标单位: 图像百分比%</span>
                </div>

                <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
                  {FIELD_CONFIGS.map((field) => {
                    const Icon = field.icon;
                    const isActive = activeFieldKey === field.key;
                    const box = regions[field.key] || { x: 0, y: 0, width: 0, height: 0 };
                    const liveValue = liveExtractedValues[field.key];

                    return (
                      <div
                        key={field.key}
                        onClick={() => setActiveFieldKey(field.key)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                          isActive
                            ? 'border-[#52c488] bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="p-1.5 rounded-lg text-white font-bold flex items-center justify-center text-xs"
                              style={{ backgroundColor: field.color }}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {field.label}
                            </span>
                          </div>

                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            X:{box.x}% Y:{box.y}% W:{box.width}% H:{box.height}%
                          </span>
                        </div>

                        {/* Live Extracted Value Preview */}
                        <div className="mt-2 text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Eye className="w-3 h-3 text-[#52c488]" />
                            <span>当前框内实时抓取:</span>
                          </span>
                          <span className={`font-bold font-mono ${liveValue ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 italic'}`}>
                            {liveValue || '暂未识别到有效内容'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Interactive Ticket Preview & Canvas Bounding Box Overlay (7 cols) */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-[#52c488]" />
                  <span>车票定位图（拖拽鼠标划定【{FIELD_CONFIGS.find((f) => f.key === activeFieldKey)?.label}】框选区）:</span>
                </span>
                <span className="text-[10px] text-slate-400">蓝色框表示当前选定调节字段</span>
              </div>

              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="relative rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-900/90 select-none cursor-crosshair min-h-[380px] max-h-[520px] flex items-center justify-center shadow-inner"
              >
                {/* Background Ticket Image or Mock Canvas */}
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Ticket Preview"
                    className="w-full h-full object-contain pointer-events-none max-h-[500px]"
                  />
                ) : (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <Train className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                    <p className="text-xs font-bold">暂无上传车票图片，使用通用标准数字矢量摹本渲染定位</p>
                  </div>
                )}

                {/* Render All Configured Region Bounding Boxes */}
                {FIELD_CONFIGS.map((field) => {
                  const box = regions[field.key];
                  if (!box) return null;
                  const isActive = activeFieldKey === field.key;
                  const liveVal = liveExtractedValues[field.key];

                  return (
                    <div
                      key={field.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFieldKey(field.key);
                      }}
                      style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                        borderColor: field.color,
                        backgroundColor: isActive ? `${field.color}33` : `${field.color}15`,
                      }}
                      className={`absolute border-2 rounded-lg transition-all flex flex-col justify-between p-1 z-10 ${
                        isActive ? 'ring-4 ring-emerald-400/60 shadow-lg z-20' : 'hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 pointer-events-none">
                        <span
                          className="text-[9px] font-black text-white px-1.5 py-0.5 rounded shadow-xs truncate"
                          style={{ backgroundColor: field.color }}
                        >
                          {field.label.split('/')[0]}
                        </span>
                      </div>

                      {liveVal && (
                        <div className="text-[9px] font-mono font-bold text-slate-900 bg-white/90 dark:bg-slate-900/90 dark:text-emerald-300 px-1 py-0.5 rounded shadow-xs truncate border border-slate-200">
                          {liveVal}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Drawing Indicator Box during active mouse drag */}
                {isDragging && dragStartPos && dragCurrentPos && (
                  <div
                    style={{
                      left: `${Math.min(dragStartPos.x, dragCurrentPos.x)}%`,
                      top: `${Math.min(dragStartPos.y, dragCurrentPos.y)}%`,
                      width: `${Math.abs(dragCurrentPos.x - dragStartPos.x)}%`,
                      height: `${Math.abs(dragCurrentPos.y - dragStartPos.y)}%`,
                    }}
                    className="absolute border-2 border-dashed border-emerald-400 bg-emerald-400/30 rounded-lg pointer-events-none z-30 animate-pulse"
                  />
                )}
              </div>

              {/* Helper notice */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>操作提示：</strong>
                  在上面图像区域上用鼠标拖拽拉出一个矩形框，即可直接覆盖更新左侧选中的【
                  <span className="font-bold underline">
                    {FIELD_CONFIGS.find((f) => f.key === activeFieldKey)?.label}
                  </span>
                  】的物理匹配坐标区域。
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-[#faf5e8] dark:bg-slate-800/90 border-t border-[#e5f3ea] dark:border-slate-700 flex items-center justify-between gap-3">
            <button
              onClick={() => setRegions(DEFAULT_RAILWAY_TEMPLATE.regions)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重置为默认标准坐标</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-[#52c488] hover:bg-[#3f9e6d] text-white font-bold text-xs shadow-md border-b-2 border-[#32855b] flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>保存坐标模板并应用于识别</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
