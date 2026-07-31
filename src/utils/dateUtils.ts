import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isValid,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateStr(dateStr: string): Date {
  const d = parseISO(dateStr);
  return isValid(d) ? d : new Date();
}

export function formatChineseDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'yyyy年MM月dd日 EEEE', { locale: zhCN });
  } catch {
    return dateStr;
  }
}

export function formatMonthHeader(date: Date): string {
  return format(date, 'yyyy年 MM月', { locale: zhCN });
}

export function formatWeekHeader(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return `${format(start, 'yyyy年MM月dd日')} - ${format(end, 'MM月dd日')}`;
}

export function formatDayHeader(date: Date): string {
  return format(date, 'yyyy年MM月dd日 EEEE', { locale: zhCN });
}

export interface CalendarDayCell {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function getMonthDaysGrid(currentDate: Date): CalendarDayCell[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const todayStr = formatDateStr(new Date());

  return days.map((day) => {
    const dateStr = formatDateStr(day);
    return {
      date: day,
      dateStr,
      dayNumber: day.getDate(),
      isCurrentMonth: isSameMonth(day, currentDate),
      isToday: dateStr === todayStr,
    };
  });
}

export function getWeekDaysGrid(currentDate: Date): CalendarDayCell[] {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const todayStr = formatDateStr(new Date());

  return days.map((day) => {
    const dateStr = formatDateStr(day);
    return {
      date: day,
      dateStr,
      dayNumber: day.getDate(),
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    };
  });
}

export {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
};
