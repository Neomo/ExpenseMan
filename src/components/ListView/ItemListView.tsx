import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plane, Receipt, Search, Filter, Trash2, Edit2, Plus, Calendar, ArrowUpDown, Tag } from 'lucide-react';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { formatChineseDate } from '../../utils/dateUtils';
import { TripItem, ExpenseItem } from '../../types';

export const ItemListView: React.FC = () => {
  const {
    trips,
    expenses,
    openTripModal,
    openExpenseModal,
    deleteTrip,
    deleteExpense,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'trip' | 'expense'>('all');
  const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc'); // 'desc': 最近到最远, 'asc': 由远到近

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'trip' | 'expense'; name: string } | null>(null);

  // Group items by date and then split into trips and expenses
  const groupedData = useMemo(() => {
    // 1. Filter trips
    let filteredTrips = trips;
    let filteredExpenses = expenses;

    if (filterType === 'trip') {
      filteredExpenses = [];
    } else if (filterType === 'expense') {
      filteredTrips = [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filteredTrips = filteredTrips.filter(
        (t) =>
          (t.trainNumber && t.trainNumber.toLowerCase().includes(q)) ||
          t.transport.toLowerCase().includes(q) ||
          (t.origin && t.origin.toLowerCase().includes(q)) ||
          (t.destination && t.destination.toLowerCase().includes(q)) ||
          t.date.includes(q) ||
          (t.remarks && t.remarks.toLowerCase().includes(q))
      );

      filteredExpenses = filteredExpenses.filter(
        (e) =>
          e.category.toLowerCase().includes(q) ||
          e.date.includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // Map by date
    const dateMap: Record<string, { trips: TripItem[]; expenses: ExpenseItem[]; dayTotal: number }> = {};

    filteredTrips.forEach((t) => {
      if (!dateMap[t.date]) {
        dateMap[t.date] = { trips: [], expenses: [], dayTotal: 0 };
      }
      dateMap[t.date].trips.push(t);
      dateMap[t.date].dayTotal += t.amount;
    });

    filteredExpenses.forEach((e) => {
      if (!dateMap[e.date]) {
        dateMap[e.date] = { trips: [], expenses: [], dayTotal: 0 };
      }
      dateMap[e.date].expenses.push(e);
      dateMap[e.date].dayTotal += e.amount;
    });

    // Sort dates
    const sortedDates = Object.keys(dateMap).sort((a, b) => {
      return dateSortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
    });

    return sortedDates.map((dateStr) => ({
      dateStr,
      trips: dateMap[dateStr].trips,
      expenses: dateMap[dateStr].expenses,
      dayTotal: dateMap[dateStr].dayTotal,
    }));
  }, [trips, expenses, filterType, searchQuery, dateSortOrder]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'trip') {
      await deleteTrip(deleteTarget.id);
    } else {
      await deleteExpense(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const totalCount = trips.length + expenses.length;

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>差旅账单明细清单</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#e3f6ec] text-[#2f8859] dark:bg-emerald-950 dark:text-emerald-300 font-extrabold border border-[#a2e0bd]">
                共 {totalCount} 笔记录
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              按日期及账单类型（行程/费用）分组呈现，支持车次航班信息即时检索与编辑
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="list-add-trip-btn"
              onClick={() => openTripModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>加行程</span>
            </button>
            <button
              id="list-add-expense-btn"
              onClick={() => openExpenseModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>加费用</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              id="list-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索车次航班号、路线、地点、分类或备注..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3">
            <select
              id="list-filter-type-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">全部类型 (行程+费用)</option>
              <option value="trip">仅看交通行程 ({trips.length})</option>
              <option value="expense">仅看日常费用 ({expenses.length})</option>
            </select>
          </div>

          {/* Date Sort Toggle */}
          <div className="sm:col-span-3">
            <button
              type="button"
              id="list-date-sort-btn"
              onClick={() => setDateSortOrder(dateSortOrder === 'desc' ? 'asc' : 'desc')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                <span>日期排序: {dateSortOrder === 'desc' ? '最近到最远 ⬇️' : '由远到近 ⬆️'}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Grouped List Content */}
      {groupedData.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 text-sm">
          没有找到匹配的差旅明细记录
        </div>
      ) : (
        <div className="space-y-6">
          {groupedData.map((group) => (
            <div
              key={`group-${group.dateStr}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Date Group Header */}
              <div className="px-6 py-3.5 bg-[#f5fbf7] dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#52c488] text-white">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {formatChineseDate(group.dateStr)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">({group.dateStr})</span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2">当日计:</span>
                  <span className="text-base font-black text-[#d65129] dark:text-amber-400 font-mono">
                    ¥ {group.dayTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* 1. Trips Group */}
                {group.trips.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                      <Plane className="w-4 h-4" />
                      <span>交通行程明细 ({group.trips.length})</span>
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-blue-200 dark:border-blue-900">
                      {group.trips.map((t) => (
                        <div
                          key={`item-trip-${t.id}`}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200">
                                {t.transport}
                              </span>

                              {/* Train Number / Flight Badge */}
                              {t.trainNumber && (
                                <span className="px-2 py-0.5 rounded-md text-xs font-black bg-[#e3f6ec] text-[#2f8859] dark:bg-emerald-950/80 dark:text-emerald-300 border border-[#a2e0bd] dark:border-emerald-800 flex items-center gap-1 font-mono">
                                  <Tag className="w-3 h-3 text-[#52c488]" />
                                  <span>{t.trainNumber}</span>
                                </span>
                              )}

                              {(t.origin || t.destination) && (
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {t.origin || '起点'} → {t.destination || '终点'}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              {(t.startTime || t.endTime) && (
                                <span className="font-mono">
                                  🕒 {t.startTime || '--:--'} ~ {t.endTime || '--:--'}
                                </span>
                              )}
                              {t.remarks && <span className="truncate">备注: {t.remarks}</span>}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                            <span className="text-base font-black text-[#d65129] dark:text-amber-400 font-mono">
                              ¥ {t.amount.toFixed(2)}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openTripModal(t, t.date)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                title="编辑行程"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    id: t.id,
                                    type: 'trip',
                                    name: `${t.transport} ${t.trainNumber || ''} (¥${t.amount})`,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                title="删除行程"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Expenses Group */}
                {group.expenses.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <Receipt className="w-4 h-4" />
                      <span>日常费用明细 ({group.expenses.length})</span>
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-emerald-200 dark:border-emerald-900">
                      {group.expenses.map((e) => (
                        <div
                          key={`item-exp-${e.id}`}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200">
                                {e.category}
                              </span>
                              {e.description && (
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                  {e.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                            <span className="text-base font-black text-[#d65129] dark:text-amber-400 font-mono">
                              ¥ {e.amount.toFixed(2)}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openExpenseModal(e, e.date)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                title="编辑费用"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    id: e.id,
                                    type: 'expense',
                                    name: `${e.category} 费用 (¥${e.amount})`,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                title="删除费用"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="确定删除记录？"
        description={`您正在删除: ${deleteTarget?.name}，此操作不可撤销。`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
