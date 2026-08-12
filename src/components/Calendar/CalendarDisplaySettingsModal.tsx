import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CALENDAR_THEMES } from '../../utils/calendarThemes';
import { CalendarThemeKey } from '../../types';
import {
  X,
  Palette,
  Eye,
  Check,
  DollarSign,
  Clock,
  Receipt,
  Calculator,
  CalendarDays,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarDisplaySettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { calendarDisplayConfig, updateCalendarDisplayConfig } = useAppStore();

  if (!isOpen) return null;

  const themesList = Object.values(CALENDAR_THEMES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                日历显示与视觉主题设置
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                个性化配置行程显示项目、费用明细及不同季节氛围视觉主题
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Custom Display Toggles */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>日历网格显示项配置</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Toggle 1: Show Expenses */}
            <label className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 cursor-pointer flex items-start justify-between gap-3 transition-colors">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-500" />
                  <span>显示非行程费用项</span>
                </span>
                <p className="text-[10px] text-slate-400">
                  开启时在日历单元格内展示日常餐饮、住宿等独立费用
                </p>
              </div>
              <input
                type="checkbox"
                checked={calendarDisplayConfig.showExpenses}
                onChange={(e) => updateCalendarDisplayConfig({ showExpenses: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            {/* Toggle 2: Show Ticket Cost */}
            <label className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 cursor-pointer flex items-start justify-between gap-3 transition-colors">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>显示行程车票金额</span>
                </span>
                <p className="text-[10px] text-slate-400">
                  关闭后行程仅显示路线，隐藏车票/机票对应价格
                </p>
              </div>
              <input
                type="checkbox"
                checked={calendarDisplayConfig.showTripTicketCost}
                onChange={(e) => updateCalendarDisplayConfig({ showTripTicketCost: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            {/* Toggle 3: Show Start Time */}
            <label className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 cursor-pointer flex items-start justify-between gap-3 transition-colors">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>显示行程出发时间</span>
                </span>
                <p className="text-[10px] text-slate-400">
                  显示如 🕒 08:30 的具体出发车次班次时间
                </p>
              </div>
              <input
                type="checkbox"
                checked={calendarDisplayConfig.showTripStartTime}
                onChange={(e) => updateCalendarDisplayConfig({ showTripStartTime: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            {/* Toggle 4: Show Daily Total */}
            <label className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 cursor-pointer flex items-start justify-between gap-3 transition-colors">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-purple-500" />
                  <span>显示每日合计费用</span>
                </span>
                <p className="text-[10px] text-slate-400">
                  在单元格底部显示当日所有行程及费用的小计徽章
                </p>
              </div>
              <input
                type="checkbox"
                checked={calendarDisplayConfig.showDailyTotal}
                onChange={(e) => updateCalendarDisplayConfig({ showDailyTotal: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>

        {/* Section 2: Weekday Label Format */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span>星期栏显示语言</span>
          </h4>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateCalendarDisplayConfig({ weekdayFormat: 'zh' })}
              className={`flex-1 p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                calendarDisplayConfig.weekdayFormat === 'zh'
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="text-left">
                <div>中文格式</div>
                <div className="text-[10px] text-slate-400 font-normal">周一、周二、周三...</div>
              </div>
              {calendarDisplayConfig.weekdayFormat === 'zh' && (
                <Check className="w-4 h-4 text-emerald-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => updateCalendarDisplayConfig({ weekdayFormat: 'en' })}
              className={`flex-1 p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                calendarDisplayConfig.weekdayFormat === 'en'
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="text-left">
                <div>英文格式</div>
                <div className="text-[10px] text-slate-400 font-normal">MON, TUE, WED...</div>
              </div>
              {calendarDisplayConfig.weekdayFormat === 'en' && (
                <Check className="w-4 h-4 text-emerald-600" />
              )}
            </button>
          </div>
        </div>

        {/* Section 3: Seasonal & Mood Themes */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-emerald-600" />
              <span>日历视觉主题 (季节与心情)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              当前: {CALENDAR_THEMES[calendarDisplayConfig.theme]?.name}
            </span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {themesList.map((t) => {
              const isActive = calendarDisplayConfig.theme === t.key;
              return (
                <button
                  key={`theme-btn-${t.key}`}
                  type="button"
                  onClick={() => updateCalendarDisplayConfig({ theme: t.key as CalendarThemeKey })}
                  className={`p-3 rounded-2xl border text-left transition-all relative space-y-1.5 ${
                    isActive
                      ? 'border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{t.icon}</span>
                    {isActive && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                      {t.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {t.description}
                    </div>
                  </div>

                  {/* Theme Color Preview Swatch */}
                  <div className="flex items-center gap-1 pt-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: t.accentColor }}
                    />
                    <span className="text-[9px] font-bold text-slate-400">
                      {t.season}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            完成设置
          </button>
        </div>
      </div>
    </div>
  );
};
