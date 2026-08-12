import { CalendarThemeKey } from '../types';

export interface ThemeDefinition {
  key: CalendarThemeKey;
  name: string;
  season: string;
  icon: string;
  description: string;
  containerBorder: string;
  weekdayHeaderBg: string;
  weekdayHeaderBorder: string;
  weekdayTextColor: string;
  selectedRing: string;
  selectedBg: string;
  todayBadgeBg: string;
  todayBadgeText: string;
  tripBadgeBg: string;
  tripBadgeText: string;
  tripBadgeBorder: string;
  totalBadgeBg: string;
  totalBadgeText: string;
  accentColor: string;
}

export const CALENDAR_THEMES: Record<CalendarThemeKey, ThemeDefinition> = {
  island: {
    key: 'island',
    name: '春绿草地 (动森风)',
    season: '四季',
    icon: '🍃',
    description: '原野绿意与治愈风手绘感',
    containerBorder: 'border-[#c2e8d0] dark:border-slate-800',
    weekdayHeaderBg: 'bg-[#faf5e8] dark:bg-slate-800/80',
    weekdayHeaderBorder: 'border-[#d0eedb] dark:border-slate-800',
    weekdayTextColor: 'text-[#69533f] dark:text-slate-300',
    selectedRing: 'ring-[#52c488]',
    selectedBg: 'bg-[#e8f7ee] dark:bg-emerald-950/40',
    todayBadgeBg: 'bg-[#52c488]',
    todayBadgeText: 'text-white',
    tripBadgeBg: 'bg-[#eaf7f0] dark:bg-emerald-950/60',
    tripBadgeText: 'text-[#21633f] dark:text-emerald-300',
    tripBadgeBorder: 'border-[#a8e3c1] dark:border-emerald-900/60',
    totalBadgeBg: 'bg-[#52c488]',
    totalBadgeText: 'text-white',
    accentColor: '#52c488',
  },
  sakura: {
    key: 'sakura',
    name: '春樱烂漫 (春季粉)',
    season: '春季',
    icon: '🌸',
    description: '柔和优雅的粉樱与浪漫落花',
    containerBorder: 'border-pink-200 dark:border-pink-950',
    weekdayHeaderBg: 'bg-pink-50 dark:bg-pink-950/40',
    weekdayHeaderBorder: 'border-pink-200 dark:border-pink-900',
    weekdayTextColor: 'text-pink-950 dark:text-pink-200',
    selectedRing: 'ring-pink-400',
    selectedBg: 'bg-pink-100/70 dark:bg-pink-950/60',
    todayBadgeBg: 'bg-pink-500',
    todayBadgeText: 'text-white',
    tripBadgeBg: 'bg-pink-100/80 dark:bg-pink-950/60',
    tripBadgeText: 'text-pink-900 dark:text-pink-200',
    tripBadgeBorder: 'border-pink-300 dark:border-pink-800',
    totalBadgeBg: 'bg-pink-500',
    totalBadgeText: 'text-white',
    accentColor: '#ec4899',
  },
  ocean: {
    key: 'ocean',
    name: '夏日海洋 (夏季蓝)',
    season: '夏季',
    icon: '🌊',
    description: '湛蓝深海与清爽水波纹',
    containerBorder: 'border-sky-200 dark:border-sky-950',
    weekdayHeaderBg: 'bg-sky-50 dark:bg-sky-950/40',
    weekdayHeaderBorder: 'border-sky-200 dark:border-sky-900',
    weekdayTextColor: 'text-sky-950 dark:text-sky-200',
    selectedRing: 'ring-sky-500',
    selectedBg: 'bg-sky-100/70 dark:bg-sky-950/60',
    todayBadgeBg: 'bg-sky-600',
    todayBadgeText: 'text-white',
    tripBadgeBg: 'bg-sky-100/80 dark:bg-sky-950/60',
    tripBadgeText: 'text-sky-900 dark:text-sky-200',
    tripBadgeBorder: 'border-sky-300 dark:border-sky-800',
    totalBadgeBg: 'bg-sky-600',
    totalBadgeText: 'text-white',
    accentColor: '#0284c7',
  },
  maple: {
    key: 'maple',
    name: '金秋枫叶 (秋季橘)',
    season: '秋季',
    icon: '🍁',
    description: '成熟浓郁的枫林晚霞与金黄',
    containerBorder: 'border-amber-200 dark:border-amber-950',
    weekdayHeaderBg: 'bg-amber-50 dark:bg-amber-950/40',
    weekdayHeaderBorder: 'border-amber-200 dark:border-amber-900',
    weekdayTextColor: 'text-amber-950 dark:text-amber-200',
    selectedRing: 'ring-amber-500',
    selectedBg: 'bg-amber-100/70 dark:bg-amber-950/60',
    todayBadgeBg: 'bg-amber-600',
    todayBadgeText: 'text-white',
    tripBadgeBg: 'bg-amber-100/80 dark:bg-amber-950/60',
    tripBadgeText: 'text-amber-900 dark:text-amber-200',
    tripBadgeBorder: 'border-amber-300 dark:border-amber-800',
    totalBadgeBg: 'bg-amber-600',
    totalBadgeText: 'text-white',
    accentColor: '#d97706',
  },
  winter: {
    key: 'winter',
    name: '冬雪极光 (冬季冷灰)',
    season: '冬季',
    icon: '❄️',
    description: '纯净皎洁的晶莹冬雪与极光',
    containerBorder: 'border-indigo-200 dark:border-indigo-950',
    weekdayHeaderBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    weekdayHeaderBorder: 'border-indigo-200 dark:border-indigo-900',
    weekdayTextColor: 'text-indigo-950 dark:text-indigo-200',
    selectedRing: 'ring-indigo-500',
    selectedBg: 'bg-indigo-100/70 dark:bg-indigo-950/60',
    todayBadgeBg: 'bg-indigo-600',
    todayBadgeText: 'text-white',
    tripBadgeBg: 'bg-indigo-100/80 dark:bg-indigo-950/60',
    tripBadgeText: 'text-indigo-900 dark:text-indigo-200',
    tripBadgeBorder: 'border-indigo-300 dark:border-indigo-800',
    totalBadgeBg: 'bg-indigo-600',
    totalBadgeText: 'text-white',
    accentColor: '#4f46e5',
  },
  slate: {
    key: 'slate',
    name: '极简石墨 (现代灰)',
    season: '通用',
    icon: '🪨',
    description: '高对比度极简石墨与商务灰色',
    containerBorder: 'border-slate-300 dark:border-slate-800',
    weekdayHeaderBg: 'bg-slate-100 dark:bg-slate-800',
    weekdayHeaderBorder: 'border-slate-200 dark:border-slate-800',
    weekdayTextColor: 'text-slate-800 dark:text-slate-200',
    selectedRing: 'ring-slate-700 dark:ring-slate-300',
    selectedBg: 'bg-slate-100 dark:bg-slate-800/80',
    todayBadgeBg: 'bg-slate-800 dark:bg-slate-200',
    todayBadgeText: 'text-white dark:text-slate-900',
    tripBadgeBg: 'bg-slate-100 dark:bg-slate-800',
    tripBadgeText: 'text-slate-800 dark:text-slate-200',
    tripBadgeBorder: 'border-slate-300 dark:border-slate-700',
    totalBadgeBg: 'bg-slate-800 dark:bg-slate-200',
    totalBadgeText: 'text-white dark:text-slate-900',
    accentColor: '#475569',
  },
};
