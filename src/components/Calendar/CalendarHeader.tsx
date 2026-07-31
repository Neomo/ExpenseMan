import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  formatMonthHeader,
  formatWeekHeader,
  formatDayHeader,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  formatDateStr,
} from '../../utils/dateUtils';
import { ViewMode } from '../../types';

export const CalendarHeader: React.FC = () => {
  const {
    currentViewMode,
    setCurrentViewMode,
    calendarFocusDate,
    setCalendarFocusDate,
    setSelectedDate,
    openDateDetail,
  } = useAppStore();

  const handlePrev = () => {
    if (currentViewMode === 'month') {
      setCalendarFocusDate(subMonths(calendarFocusDate, 1));
    } else if (currentViewMode === 'week') {
      setCalendarFocusDate(subWeeks(calendarFocusDate, 1));
    } else {
      setCalendarFocusDate(subDays(calendarFocusDate, 1));
    }
  };

  const handleNext = () => {
    if (currentViewMode === 'month') {
      setCalendarFocusDate(addMonths(calendarFocusDate, 1));
    } else if (currentViewMode === 'week') {
      setCalendarFocusDate(addWeeks(calendarFocusDate, 1));
    } else {
      setCalendarFocusDate(addDays(calendarFocusDate, 1));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCalendarFocusDate(today);
    setSelectedDate(formatDateStr(today));
  };

  const renderHeaderTitle = () => {
    if (currentViewMode === 'month') {
      return formatMonthHeader(calendarFocusDate);
    } else if (currentViewMode === 'week') {
      return formatWeekHeader(calendarFocusDate);
    } else {
      return formatDayHeader(calendarFocusDate);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 mb-3 border-b-2 border-[#82d8a7]/30 dark:border-slate-800">
      {/* Date Navigation */}
      <div className="flex items-center gap-3">
        <button
          id="calendar-today-btn"
          onClick={handleToday}
          className="btn-island-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>回到今天</span>
        </button>

        <div className="flex items-center bg-[#faf5e8] dark:bg-slate-800 p-1 rounded-2xl border-2 border-[#eadaa8] dark:border-slate-700">
          <button
            id="calendar-prev-btn"
            onClick={handlePrev}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-[#54411f] dark:text-slate-200 transition-colors"
            title="上一个区间"
            aria-label="上一个"
          >
            <ChevronLeft className="w-4 h-4 stroke-[3]" />
          </button>
          <button
            id="calendar-next-btn"
            onClick={handleNext}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-[#54411f] dark:text-slate-200 transition-colors"
            title="下一个区间"
            aria-label="下一个"
          >
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#3b322a] dark:text-slate-100 ml-1 flex items-center gap-1.5">
          <span>🍃</span>
          <span>{renderHeaderTitle()}</span>
        </h2>
      </div>

      {/* Right Controls: View Switcher */}
      <div className="flex items-center justify-between sm:justify-end gap-2">
        <div className="flex p-1 rounded-2xl bg-[#faf5e8] dark:bg-slate-800 border-2 border-[#eadaa8] dark:border-slate-700 text-xs font-black">
          {(['month', 'week', 'day'] as ViewMode[]).map((mode) => {
            const label = mode === 'month' ? '月视图' : mode === 'week' ? '周视图' : '日视图';
            const isActive = currentViewMode === mode;
            return (
              <button
                key={mode}
                id={`calendar-view-mode-${mode}`}
                onClick={() => setCurrentViewMode(mode)}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#52c488] text-white font-black shadow-xs'
                    : 'text-[#84725d] dark:text-slate-400 hover:text-[#3b322a] dark:hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Jump Date Input */}
        <input
          type="date"
          id="calendar-date-jump-input"
          value={formatDateStr(calendarFocusDate)}
          onChange={(e) => {
            if (e.target.value) {
              const d = new Date(e.target.value);
              setCalendarFocusDate(d);
              setSelectedDate(e.target.value);
            }
          }}
          className="px-3 py-1.5 rounded-2xl border-2 border-[#b8e2cb] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#3b322a] dark:text-slate-200 text-xs font-bold focus:ring-2 focus:ring-[#52c488] focus:outline-none"
          title="跳转指定日期"
        />
      </div>
    </div>
  );
};
