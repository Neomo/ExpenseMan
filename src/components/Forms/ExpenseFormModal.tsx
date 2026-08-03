import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Receipt, DollarSign, FileText } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ExpenseItem } from '../../types';
import { AddCustomCategoryModal } from './AddCustomCategoryModal';

const expenseSchema = z.object({
  category: z.string().min(1, '请选择费用类别'),
  date: z.string().min(1, '请选择日期'),
  amount: z.number({ message: '请输入有效的数字金额' }).min(0.01, '金额必须大于0'),
  description: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export const ExpenseFormModal: React.FC = () => {
  const {
    expenseModalOpen,
    closeExpenseModal,
    editingExpense,
    selectedDate,
    addOrUpdateExpense,
    customCategories,
  } = useAppStore();

  const [customCatModalOpen, setCustomCatModalOpen] = useState(false);

  // Filter expense categories
  const expenseCategoryOptions = customCategories.filter((c) => c.type === 'expense');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: '餐饮',
      date: selectedDate,
      amount: 0,
      description: '',
    },
  });

  useEffect(() => {
    if (editingExpense) {
      reset({
        category: editingExpense.category,
        date: editingExpense.date,
        amount: editingExpense.amount,
        description: editingExpense.description || '',
      });
    } else {
      reset({
        category: expenseCategoryOptions[0]?.name || '餐饮',
        date: selectedDate,
        amount: '' as any,
        description: '',
      });
    }
  }, [editingExpense, expenseModalOpen, selectedDate]);

  if (!expenseModalOpen) return null;

  const onSubmit = async (data: ExpenseFormData) => {
    const item: ExpenseItem = {
      id: editingExpense ? editingExpense.id : `expense-${Date.now()}`,
      date: data.date,
      category: data.category,
      amount: Number(data.amount),
      description: data.description?.trim() || undefined,
      createdAt: editingExpense ? editingExpense.createdAt : Date.now(),
    };

    await addOrUpdateExpense(item);
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            id="expense-form-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                  {editingExpense ? '编辑日常费用' : '添加其他费用'}
                </h3>
              </div>
              <button
                id="expense-modal-close-btn"
                onClick={closeExpenseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Category Select */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    费用类别 <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomCatModalOpen(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    新增类别
                  </button>
                </div>
                <select
                  id="expense-category-select"
                  {...register('category')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-sm"
                >
                  {expenseCategoryOptions.map((opt, idx) => (
                    <option key={`eopt-${opt.id}-${idx}`} value={opt.name}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-rose-500">{errors.category.message}</p>
                )}
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  费用日期 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  id="expense-date-input"
                  {...register('date')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
                {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date.message}</p>}
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  费用金额 (人民币元) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    id="expense-amount-input"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-semibold"
                  />
                </div>
                {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  费用说明 / 备注 (选填)
                </label>
                <input
                  type="text"
                  placeholder="例：商务宴请午餐 / 购买会议文具"
                  id="expense-description-input"
                  {...register('description')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t-2 border-[#d0eedb] dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  id="expense-form-cancel-btn"
                  onClick={closeExpenseModal}
                  className="px-4 py-2.5 rounded-2xl border-2 border-[#eadaa8] dark:border-slate-700 bg-[#faf5e8] dark:bg-slate-800 text-[#54411f] dark:text-slate-300 hover:bg-[#eadaa8]/50 text-sm font-bold transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  id="expense-form-submit-btn"
                  className="btn-island-primary px-5 py-2.5 text-sm shadow-sm"
                >
                  {editingExpense ? '保存修改' : '确认添加费用'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Extension modal */}
      <AddCustomCategoryModal
        isOpen={customCatModalOpen}
        type="expense"
        onClose={() => setCustomCatModalOpen(false)}
      />
    </>
  );
};
