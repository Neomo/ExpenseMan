import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plane, Receipt, Search, Filter, Trash2, Edit2, Plus, ArrowUpDown } from 'lucide-react';
import { ConfirmDialog } from '../Common/ConfirmDialog';

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
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'trip' | 'expense'; name: string } | null>(null);

  // Combine trips and expenses into a unified list
  const combinedList = useMemo(() => {
    const tripList = trips.map((t) => ({
      id: t.id,
      itemType: 'trip' as const,
      date: t.date,
      title: `${t.transport} 行程`,
      categoryOrType: t.transport,
      subTitle: t.origin || t.destination ? `${t.origin || ''} → ${t.destination || ''}` : '',
      amount: t.amount,
      remarks: t.remarks,
      original: t,
    }));

    const expenseList = expenses.map((e) => ({
      id: e.id,
      itemType: 'expense' as const,
      date: e.date,
      title: `${e.category} 费用`,
      categoryOrType: e.category,
      subTitle: e.description || '',
      amount: e.amount,
      remarks: e.description,
      original: e,
    }));

    let list = [];
    if (filterType === 'all') list = [...tripList, ...expenseList];
    else if (filterType === 'trip') list = tripList;
    else list = expenseList;

    // Filter by query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.categoryOrType.toLowerCase().includes(q) ||
          item.subTitle.toLowerCase().includes(q) ||
          item.date.includes(q) ||
          (item.remarks && item.remarks.toLowerCase().includes(q))
      );
    }

    // Sort
    return list.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      return a.amount - b.amount;
    });
  }, [trips, expenses, filterType, searchQuery, sortBy]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'trip') {
      await deleteTrip(deleteTarget.id);
    } else {
      await deleteExpense(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Search & Control Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              差旅账单明细清单
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              快速检索、筛选与批量管理所有交通行程和日常费用记录
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
              placeholder="搜索路线、分类、地点或备注..."
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
              <option value="all">全部类型 ({trips.length + expenses.length})</option>
              <option value="trip">仅看行程 ({trips.length})</option>
              <option value="expense">仅看日常费用 ({expenses.length})</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-3">
            <select
              id="list-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="date-desc">按日期降序 (最新在前)</option>
              <option value="date-asc">按日期升序 (最早在前)</option>
              <option value="amount-desc">按金额降序 (高价在前)</option>
              <option value="amount-asc">按金额升序 (低价在前)</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Table / Cards */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {combinedList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            没有找到匹配的差旅记录
          </div>
        ) : (
          <div className="space-y-3">
            {combinedList.map((item) => (
              <div
                key={`${item.itemType}-${item.id}`}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      item.itemType === 'trip'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300'
                    }`}
                  >
                    {item.itemType === 'trip' ? (
                      <Plane className="w-5 h-5" />
                    ) : (
                      <Receipt className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                        {item.title}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">{item.date}</span>
                    </div>

                    {item.subTitle && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {item.subTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xl font-black text-[#d65129] dark:text-amber-400 font-mono">
                    ¥ {item.amount.toFixed(2)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        item.itemType === 'trip'
                          ? openTripModal(item.original as any, item.date)
                          : openExpenseModal(item.original as any, item.date)
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({
                          id: item.id,
                          type: item.itemType,
                          name: `${item.title} (¥${item.amount})`,
                        })
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
