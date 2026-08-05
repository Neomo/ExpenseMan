import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plane, Sun, Moon, Plus, FileSpreadsheet } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme, trips, expenses, openTripModal, openExpenseModal, setActiveTab } = useAppStore();

  // Calculate current month expenditure
  const now = new Date();
  const currentYYYYMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthTripsTotal = trips
    .filter((t) => t.date.startsWith(currentYYYYMM))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpensesTotal = expenses
    .filter((e) => e.date.startsWith(currentYYYYMM))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthGrandTotal = monthTripsTotal + monthExpensesTotal;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b-2 border-[#82d8a7]/40 dark:border-slate-800 transition-colors h-20 px-4 sm:px-8 flex items-center shadow-sm">
      <div className="max-w-[1920px] mx-auto w-full flex items-center justify-between gap-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('calendar')}>
          <div className="w-11 h-11 bg-[#52c488] rounded-2xl flex items-center justify-center text-white border-b-4 border-[#379462] shadow-sm group-hover:scale-105 transition-all shrink-0">
            <Plane className="w-6 h-6 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-[#3b322a] dark:text-slate-100 leading-tight">
                动森差旅行程
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#e3f6ec] text-[#2f8859] dark:bg-slate-800 dark:text-[#6ee7a4] border border-[#a2e0bd] dark:border-slate-700">
                🍃 Animal Island
              </span>
            </div>
            <p className="text-[11px] text-[#706458] dark:text-slate-400 font-bold uppercase tracking-widest hidden sm:block">
              Nook Travel & Expense Passport
            </p>
          </div>
        </div>

        {/* Middle Quick Stat Badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#faf5e8] dark:bg-slate-800 border-2 border-[#eadaa8] dark:border-slate-700 text-xs shadow-xs">
          <span className="font-bold text-[#8a7251] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span>🪙 本月支出:</span>
          </span>
          <span className="text-base font-black text-[#d65129] dark:text-amber-400 font-mono">
            ¥ {monthGrandTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="nav-add-trip-btn"
              onClick={() => openTripModal()}
              className="btn-island-dodo px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>加行程</span>
            </button>
            <button
              id="nav-add-expense-btn"
              onClick={() => openExpenseModal()}
              className="btn-island-primary px-3.5 py-2 text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>加费用</span>
            </button>
          </div>

          <div className="h-6 w-0.5 bg-[#d8e8dc] dark:bg-slate-800 hidden sm:block rounded-full" />

          {/* Theme Toggle Button */}
          <button
            id="nav-theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl bg-[#f0f7f3] dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#e2f2e8] dark:hover:bg-slate-700 border border-[#b8e2cb] dark:border-slate-700 transition-colors"
            title={theme === 'light' ? '切换为暗黑模式' : '切换为明亮模式'}
            aria-label="切换主题"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-slate-700" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
