import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Plane,
  Receipt,
  MapPin,
  Clock,
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  DollarSign,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatChineseDate } from '../../utils/dateUtils';
import { TripItem, ExpenseItem } from '../../types';
import { ConfirmDialog } from '../Common/ConfirmDialog';

export const DateDetailModal: React.FC = () => {
  const {
    dateDetailOpen,
    closeDateDetail,
    selectedDate,
    trips,
    expenses,
    openTripModal,
    openExpenseModal,
    deleteTrip,
    deleteExpense,
  } = useAppStore();

  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'trip' | 'expense';
    id: string;
    title: string;
  } | null>(null);

  if (!dateDetailOpen) return null;

  // Filter items for selectedDate
  const dayTrips = trips.filter((t) => t.date === selectedDate);
  const dayExpenses = expenses.filter((e) => e.date === selectedDate);

  // Subtotals
  const tripsTotal = dayTrips.reduce((sum, t) => sum + t.amount, 0);
  const expensesTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const grandTotal = tripsTotal + expensesTotal;

  const handleConfirmDeleteAction = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'trip') {
      await deleteTrip(confirmDelete.id);
    } else {
      await deleteExpense(confirmDelete.id);
    }
    setConfirmDelete(null);
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            id="date-detail-panel"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {formatChineseDate(selectedDate)}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    当日共有 {dayTrips.length} 条行程, {dayExpenses.length} 条日常费用
                  </p>
                </div>
              </div>

              <button
                id="date-detail-close-btn"
                onClick={closeDateDetail}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Section 1: Travel Trips */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      交通行程记录 ({dayTrips.length})
                    </h3>
                  </div>
                  <button
                    id="date-detail-add-trip-btn"
                    onClick={() => openTripModal(undefined, selectedDate)}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加行程
                  </button>
                </div>

                {dayTrips.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                    本日暂无交通行程记录
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dayTrips.map((t, idx) => (
                      <div
                        key={`mdtrip-${t.id}-${idx}`}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                              {t.transport}
                            </span>
                            {t.trainNumber && (
                              <span className="px-2 py-0.5 rounded-md text-xs font-black bg-[#e3f6ec] text-[#2f8859] dark:bg-emerald-950 dark:text-emerald-300 border border-[#a2e0bd] dark:border-emerald-800 font-mono">
                                {t.trainNumber}
                              </span>
                            )}
                            {(t.origin || t.destination) && (
                              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                {t.origin || '未知起点'} → {t.destination || '未知终点'}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            {(t.startTime || t.endTime) && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {t.startTime || '--:--'} ~ {t.endTime || '--:--'}
                              </span>
                            )}
                            {t.remarks && <span className="truncate max-w-[200px]">备注: {t.remarks}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              ¥ {t.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openTripModal(t, selectedDate)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="编辑"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmDelete({
                                  type: 'trip',
                                  id: t.id,
                                  title: `确定删除 ${t.transport} 行程 (¥${t.amount}) 吗？`,
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Other Expenses */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      其他日常费用 ({dayExpenses.length})
                    </h3>
                  </div>
                  <button
                    id="date-detail-add-expense-btn"
                    onClick={() => openExpenseModal(undefined, selectedDate)}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加费用
                  </button>
                </div>

                {dayExpenses.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                    本日暂无其他日常费用记录
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dayExpenses.map((e, idx) => (
                      <div
                        key={`mdexp-${e.id}-${idx}`}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                              {e.category}
                            </span>
                            {e.description && (
                              <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                                {e.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              ¥ {e.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openExpenseModal(e, selectedDate)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="编辑"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmDelete({
                                  type: 'expense',
                                  id: e.id,
                                  title: `确定删除 ${e.category} 费用 (¥${e.amount}) 吗？`,
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Summary Card - Animal Island Theme */}
            <div className="p-6 bg-[#faf5e8] dark:bg-slate-900 border-t-2 border-[#eadaa8] dark:border-slate-800 rounded-b-3xl">
              <div className="flex justify-between mb-2 text-xs font-black tracking-wider text-[#8e8071] dark:text-slate-400">
                <span>✈️ 交通: ¥{tripsTotal.toFixed(2)} | 🪙 费用: ¥{expensesTotal.toFixed(2)}</span>
                <span>🍃 当日总花费</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => openTripModal(undefined, selectedDate)}
                    className="btn-island-dodo px-3.5 py-2 text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    加行程
                  </button>
                  <button
                    onClick={() => openExpenseModal(undefined, selectedDate)}
                    className="btn-island-primary px-3.5 py-2 text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    加费用
                  </button>
                </div>
                <p className="text-3xl font-black text-[#d65129] dark:text-amber-400 font-mono">
                  ¥ {grandTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="确认删除"
        description={confirmDelete?.title || '删除后无法恢复，确定删除此记录吗？'}
        onConfirm={handleConfirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
};
