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
import { ReportView } from './components/Reports/ReportView';
import { DataSettingsView } from './components/DataManagement/DataSettingsView';
import { TripFormModal } from './components/Forms/TripFormModal';
import { ExpenseFormModal } from './components/Forms/ExpenseFormModal';
import { TicketOcrModal } from './components/OCR/TicketOcrModal';
import { Toast } from './components/Common/Toast';
import { Plane } from 'lucide-react';

export default function App() {
  const { init, isLoading, activeTab } = useAppStore();

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

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col md:flex-row pb-16 md:pb-8">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'list' && <ItemListView />}
          {activeTab === 'report' && <ReportView />}
          {activeTab === 'settings' && <DataSettingsView />}
        </main>
      </div>

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
