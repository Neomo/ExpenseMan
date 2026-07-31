import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Calendar, ListOrdered, BarChart3, Settings, Plane, Sparkles } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, seedDemoData, trips, expenses } = useAppStore();

  const navItems = [
    { id: 'calendar', label: '日历视图', icon: Calendar },
    { id: 'list', label: '明细清单', icon: ListOrdered },
    { id: 'report', label: '费用报告', icon: BarChart3 },
    { id: 'settings', label: '数据与分类', icon: Settings },
  ] as const;

  const totalCount = trips.length + expenses.length;

  return (
    <aside className="w-60 hidden md:flex flex-col border-r-2 border-[#82d8a7]/30 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md min-h-[calc(100vh-5rem)] p-4 shrink-0 transition-colors">
      <div className="mb-3 px-3 flex items-center justify-between">
        <p className="text-[10px] font-extrabold text-[#789984] dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
          <span>🍃 ISLAND NAVI</span>
        </p>
      </div>

      <nav className="space-y-2 flex-1">
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

      {/* Demo Data Seeder Banner if empty */}
      {totalCount === 0 && (
        <div className="p-4 rounded-3xl bg-[#faf5e8] dark:bg-slate-800 border-2 border-[#eadaa8] dark:border-slate-700 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-[#a85a2a] dark:text-amber-400 font-bold mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>动森新人试用？</span>
          </div>
          <p className="text-[#695d51] dark:text-slate-300 mb-3 leading-relaxed">
            点击载入无人岛示范差旅记录，快速体验护照与日历账单。
          </p>
          <button
            id="sidebar-seed-demo-btn"
            onClick={seedDemoData}
            className="btn-island-secondary w-full py-2.5 px-3 text-xs flex items-center justify-center gap-1"
          >
            <span>🍃 载入动森示例数据</span>
          </button>
        </div>
      )}

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
