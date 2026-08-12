import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Calendar, ListOrdered, MapPin, BarChart3, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  const navItems = [
    { id: 'calendar', label: '日历', icon: Calendar },
    { id: 'list', label: '清单', icon: ListOrdered },
    { id: 'map', label: '地图', icon: MapPin },
    { id: 'report', label: '报告', icon: BarChart3 },
    { id: 'settings', label: '设置', icon: Settings },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-[#52c488]/40 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg transition-colors">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`bottom-nav-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-[#52c488] font-black scale-105'
                : 'text-[#615448] dark:text-slate-400 hover:text-[#52c488] dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#52c488] stroke-[2.5]' : ''}`} />
            <span className="text-[11px] font-bold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
