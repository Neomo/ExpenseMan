/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { CalendarView } from './components/Calendar/CalendarView';
import { ItemListView } from './components/ListView/ItemListView';
import { MapView } from './components/Map/MapView';
import { ReportView } from './components/Reports/ReportView';
import { DataSettingsView } from './components/DataManagement/DataSettingsView';
import { TripFormModal } from './components/Forms/TripFormModal';
import { ExpenseFormModal } from './components/Forms/ExpenseFormModal';
import { TicketOcrModal } from './components/OCR/TicketOcrModal';
import { Toast } from './components/Common/Toast';
import { Plane, RefreshCw, Sparkles } from 'lucide-react';

export default function App() {
  const {
    init,
    isLoading,
    activeTab,
    isOcrProcessing,
    ocrProgressText,
    ocrTotalFiles,
    ocrCompletedFiles,
  } = useAppStore();

  useEffect(() => {
    init();
  }, [init]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-island-pattern flex flex-col items-center justify-center p-4">
        <div className="p-5 rounded-3xl bg-[#52c488] text-white shadow-lg border-b-4 border-[#379462] animate-bounce mb-4 flex items-center justify-center">
          <Plane className="w-10 h-10 transform -rotate-45" />
        </div>
        <div className="px-5 py-2.5 rounded-full bg-white/90 dark:bg-slate-900/90 border-2 border-[#52c488] shadow-sm text-center">
          <p className="text-sm font-bold text-[#379462] dark:text-[#6ee7a4] flex items-center gap-2">
            <span>🍃 正在为您开启动森差旅护照数据...</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-island-pattern text-[#433932] dark:text-slate-100 transition-colors flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar />

      {/* Widescreen Main Container */}
      <div className="max-w-[1920px] w-full mx-auto flex-1 flex flex-col md:flex-row pb-16 md:pb-8 px-2 sm:px-4 lg:px-6">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 min-w-0">
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'list' && <ItemListView />}
          {activeTab === 'map' && <MapView />}
          {activeTab === 'report' && <ReportView />}
          {activeTab === 'settings' && <DataSettingsView />}
        </main>
      </div>

      {/* Floating Background OCR Progress Badge */}
      {isOcrProcessing && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-3 border-[#52c488] shadow-2xl flex items-center gap-4 max-w-sm border-b-4 border-b-[#379462]">
          <div className="w-10 h-10 rounded-2xl bg-[#e3f6ec] text-[#2f8859] flex items-center justify-center shrink-0 font-bold">
            <RefreshCw className="w-5 h-5 animate-spin text-[#52c488]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-black text-[#21633f] dark:text-emerald-300 mb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                后台自动识别中...
              </span>
              <span>{ocrCompletedFiles}/{ocrTotalFiles}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1">
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
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
              {ocrProgressText}
            </p>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Form Modals */}
      <TripFormModal />
      <ExpenseFormModal />
      <TicketOcrModal />

      {/* Global Toast Feedback */}
      <Toast />
    </div>
  );
}
