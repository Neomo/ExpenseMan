import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Repeat,
  Sparkles,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { analyzeTripChains, CHAIN_THEMES } from '../../utils/tripAnalyzer';

interface ClosedLoopDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const ClosedLoopDrawer: React.FC<ClosedLoopDrawerProps> = ({
  isOpen,
  onClose,
  onOpen,
}) => {
  const { trips, setSelectedDate, showToast } = useAppStore();

  const tripChains = React.useMemo(() => analyzeTripChains(trips), [trips]);

  const handleSelectChain = (startDate: string, startCity: string) => {
    setSelectedDate(startDate);
    showToast(`已自动切换日历至闭环首日 (${startDate})，出发地：${startCity}`, 'success');
  };

  return (
    <>
      {/* Floating Trigger Tab on the Right Edge of Viewport */}
      <button
        type="button"
        onClick={onOpen}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-b from-emerald-600 to-teal-700 text-white pl-3 pr-2 py-3.5 rounded-l-2xl shadow-2xl border-l-2 border-y-2 border-white/30 flex flex-col items-center gap-2 group hover:pl-4 transition-all cursor-pointer"
        title="展开智能闭环解析列表"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
          {tripChains.length > 0 && (
            <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-400 text-slate-900 font-mono text-[10px] font-black flex items-center justify-center shadow-xs">
              {tripChains.length}
            </span>
          )}
        </div>
        <span className="text-[11px] font-black tracking-widest [writing-mode:vertical-lr] text-emerald-50">
          智能闭环解析
        </span>
        <ChevronRight className="w-4 h-4 text-emerald-200 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Drawer Overlay & Slide-Over Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-over Right Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>智能闭环解析</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold">
                        {tripChains.length} 组
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      自动辨识出发并最终归巢的完整出差全链
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {/* Information Callout */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs font-bold text-indigo-900 dark:text-indigo-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-indigo-700 dark:text-indigo-300">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>交互说明：</span>
                  </div>
                  <p className="text-indigo-800/80 dark:text-indigo-300/80 font-medium text-[11px] leading-relaxed">
                    点击下方任意一条闭环路线，日历将自动切换月份并聚焦至该闭环的<strong className="text-indigo-900 dark:text-indigo-100">出差首日</strong>。
                  </p>
                </div>

                {tripChains.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl">
                      🧭
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                        暂未识别到闭环出差路线
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        当系统识别到连贯行程从某一城市出发，经过多站转乘后最终返回该城市时，将自动聚合为闭环。
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tripChains.map((chain, cIdx) => {
                      const theme = CHAIN_THEMES[chain.themeIndex % CHAIN_THEMES.length];
                      return (
                        <div
                          key={`drawer-chain-${chain.id}-${cIdx}`}
                          onClick={() => handleSelectChain(chain.startDate, chain.startCity)}
                          className={`p-4 rounded-2xl border-2 ${theme.borderLight} ${theme.borderDark} ${theme.bgLight} ${theme.bgDark} space-y-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all group relative overflow-hidden`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-1 rounded-lg ${theme.badgeBg} text-xs font-black flex items-center gap-1 shadow-2xs`}>
                              <span className={`w-2 h-2 rounded-full ${theme.dotColor} group-hover:animate-ping`} />
                              <span>{chain.startCity} 往返闭环</span>
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                              {chain.startDate} ~ {chain.endDate} ({chain.totalDays}天)
                            </span>
                          </div>

                          {/* Route Path */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                              城市路线全链：
                            </span>
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                              {chain.cities.map((city, cityIdx) => (
                                <React.Fragment key={`drawer-city-${cityIdx}`}>
                                  {cityIdx > 0 && (
                                    <span className="text-slate-400 font-bold text-xs">➔</span>
                                  )}
                                  <span className="px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
                                    {city}
                                  </span>
                                </React.Fragment>
                              ))}
                            </p>
                          </div>

                          {/* Stats footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/10 text-xs font-bold">
                            <span className="text-slate-600 dark:text-slate-400">
                              涵盖 {chain.legs.length} 段交通行程
                            </span>
                            <span className="font-mono text-[#d65129] dark:text-amber-300 font-black text-sm">
                              交通总额: ¥{chain.totalCost.toFixed(2)}
                            </span>
                          </div>

                          <div className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>点击定位日历至该日</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>出差自动归巢追踪系统</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
