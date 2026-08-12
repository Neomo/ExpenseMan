import React, { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Calendar,
  ListOrdered,
  MapPin,
  BarChart3,
  Settings,
  Sparkles,
  Upload,
  RefreshCw,
  FileCheck2,
  Cpu,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    seedDemoData,
    trips,
    expenses,
    processOcrFiles,
    isOcrProcessing,
    ocrProgressText,
    ocrDrafts,
    ocrTotalFiles,
    ocrCompletedFiles,
    openOcrModal,
  } = useAppStore();

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: 'calendar', label: '日历视图', icon: Calendar },
    { id: 'list', label: '明细清单', icon: ListOrdered },
    { id: 'map', label: '地图视图', icon: MapPin },
    { id: 'report', label: '费用报告', icon: BarChart3 },
    { id: 'settings', label: '数据与分类', icon: Settings },
  ] as const;

  const totalCount = trips.length + expenses.length;

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
      processOcrFiles(e.dataTransfer.files);
    }
  };

  return (
    <aside className="w-64 xl:w-72 hidden md:flex flex-col border-r-2 border-[#82d8a7]/30 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md h-screen sticky top-0 p-4 shrink-0 transition-all gap-4 overflow-y-auto">
      <div className="px-2 flex items-center justify-between">
        <p className="text-[10px] font-extrabold text-[#789984] dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
          <span>🍃 ISLAND NAVI</span>
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                isActive
                  ? 'bg-[#52c488] text-white border-b-4 border-[#379462] shadow-sm'
                  : 'text-[#53473c] dark:text-slate-300 hover:bg-[#f0f8f3] dark:hover:bg-slate-800/80 hover:text-[#2d8e5b] dark:hover:text-[#6ee7a4]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#68a881] dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* SMART TICKET OCR DROPZONE & ACTION AREA */}
      <div className="my-1 flex-1 flex flex-col justify-end space-y-3">
        <div className="p-4 rounded-3xl bg-gradient-to-b from-[#f0faf4] to-[#e4f6ec] dark:from-slate-800/90 dark:to-emerald-950/40 border-2 border-[#a2e0bd] dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#52c488] text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#21633f] dark:text-emerald-300">
                  智能票据识别
                </h4>
                <p className="text-[10px] text-[#3d835d] dark:text-slate-400 font-bold">
                  车票/PDF行程单极速识别
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
              快捷传图
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processOcrFiles(e.target.files);
              }
            }}
          />

          {/* Drag & Drop Target Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-3.5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-[#52c488] bg-emerald-100 dark:bg-emerald-900/60 scale-[1.02]'
                : 'border-[#a2e0bd] hover:border-[#52c488] bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900'
            }`}
          >
            {isOcrProcessing ? (
              <div className="space-y-2 py-1 w-full">
                <div className="flex items-center justify-center gap-2 text-xs font-black text-[#2f8859] dark:text-emerald-300">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#52c488]" />
                  <span>后台自动识别中...</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#52c488] h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${
                        ocrTotalFiles > 0
                          ? Math.round((ocrCompletedFiles / ocrTotalFiles) * 100)
                          : 10
                      }%`,
                    }}
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate px-1">
                  {ocrProgressText || 'AI 图像引擎分析中...'}
                </p>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-2xl bg-[#e3f6ec] dark:bg-emerald-950 text-[#2f8859] dark:text-emerald-300 flex items-center justify-center text-xl shadow-xs">
                  ✈️
                </div>
                <div>
                  <p className="text-xs font-black text-[#3b322a] dark:text-slate-100">
                    点击或将文件拖至此处
                  </p>
                  <p className="text-[10px] font-extrabold text-[#789984] dark:text-slate-400 mt-0.5">
                    支持 .pdf, .jpg, .png (可批量多选)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Unsaved / Draft Count Banner if any exists */}
          {ocrDrafts.length > 0 && !isOcrProcessing && (
            <button
              onClick={openOcrModal}
              className="w-full py-2 px-3 rounded-2xl bg-[#52c488] hover:bg-[#43a873] text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all border-b-2 border-[#379462]"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>查看已识别票据 ({ocrDrafts.length} 张)</span>
            </button>
          )}
        </div>

        {/* Demo Data Seeder Banner if empty */}
        {totalCount === 0 && (
          <div className="p-3.5 rounded-3xl bg-[#faf5e8] dark:bg-slate-800 border-2 border-[#eadaa8] dark:border-slate-700 text-xs">
            <div className="flex items-center gap-1.5 text-[#a85a2a] dark:text-amber-400 font-bold mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>动森新人试用？</span>
            </div>
            <p className="text-[#695d51] dark:text-slate-300 mb-2.5 leading-relaxed text-[11px]">
              点击载入无人岛示范差旅记录，快速体验护照与日历账单。
            </p>
            <button
              id="sidebar-seed-demo-btn"
              onClick={seedDemoData}
              className="btn-island-secondary w-full py-2 px-3 text-xs flex items-center justify-center gap-1"
            >
              <span>🍃 载入动森示例数据</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t-2 border-[#d8e8dc] dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-[#7e9987] dark:text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span>🏝️ NOOK PASSPORT</span>
        </span>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#52c488] border border-white" title="本地数据就绪" />
      </div>
    </aside>
  );
};

