import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Plane, MapPin, Clock, DollarSign, FileText } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TripItem } from '../../types';
import { AddCustomCategoryModal } from './AddCustomCategoryModal';

const tripSchema = z.object({
  transport: z.string().min(1, '请选择或输入交通工具'),
  trainNumber: z.string().optional(),
  date: z.string().min(1, '请选择日期'),
  origin: z.string().optional(),
  destination: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  amount: z.number({ message: '请输入有效的数字金额' }).min(0.01, '金额必须大于0'),
  remarks: z.string().optional(),
});

type TripFormData = z.infer<typeof tripSchema>;

export const TripFormModal: React.FC = () => {
  const {
    tripModalOpen,
    closeTripModal,
    editingTrip,
    selectedDate,
    addOrUpdateTrip,
    customCategories,
    openOcrModal,
  } = useAppStore();

  const [customCatModalOpen, setCustomCatModalOpen] = useState(false);

  // Filter transport categories
  const transportOptions = customCategories.filter((c) => c.type === 'transport');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      transport: '的士',
      trainNumber: '',
      date: selectedDate,
      origin: '',
      destination: '',
      startTime: '',
      endTime: '',
      amount: 0,
      remarks: '',
    },
  });

  useEffect(() => {
    if (editingTrip) {
      reset({
        transport: editingTrip.transport,
        trainNumber: editingTrip.trainNumber || '',
        date: editingTrip.date,
        origin: editingTrip.origin || '',
        destination: editingTrip.destination || '',
        startTime: editingTrip.startTime || '',
        endTime: editingTrip.endTime || '',
        amount: editingTrip.amount,
        remarks: editingTrip.remarks || '',
      });
    } else {
      reset({
        transport: transportOptions[0]?.name || '的士',
        trainNumber: '',
        date: selectedDate,
        origin: '',
        destination: '',
        startTime: '',
        endTime: '',
        amount: '' as any,
        remarks: '',
      });
    }
  }, [editingTrip, tripModalOpen, selectedDate]);

  if (!tripModalOpen) return null;

  const onSubmit = async (data: TripFormData) => {
    const item: TripItem = {
      id: editingTrip ? editingTrip.id : `trip-${Date.now()}`,
      date: data.date,
      transport: data.transport,
      trainNumber: data.trainNumber?.trim() || undefined,
      origin: data.origin?.trim() || undefined,
      destination: data.destination?.trim() || undefined,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      amount: Number(data.amount),
      remarks: data.remarks?.trim() || undefined,
      createdAt: editingTrip ? editingTrip.createdAt : Date.now(),
    };

    await addOrUpdateTrip(item);
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            id="trip-form-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
                  <Plane className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                  {editingTrip ? '编辑交通行程' : '添加交通行程'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    closeTripModal();
                    openOcrModal();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#e3f6ec] hover:bg-[#d0eedb] text-[#2f8859] font-black text-xs flex items-center gap-1 border border-[#a2e0bd] transition-colors shadow-xs"
                  title="上传车票/行程单 PDF 或照片自动识别"
                >
                  <span>✨ 智能票据识别</span>
                </button>
                <button
                  id="trip-modal-close-btn"
                  onClick={closeTripModal}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Transport Selection & Train Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      交通工具 <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomCatModalOpen(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      扩展类别
                    </button>
                  </div>
                  <select
                    id="trip-transport-select"
                    {...register('transport')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm"
                  >
                    {transportOptions.map((opt, idx) => (
                      <option key={`topt-${opt.id}-${idx}`} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  {errors.transport && (
                    <p className="mt-1 text-xs text-rose-500">{errors.transport.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    车次/航班号 (选填)
                  </label>
                  <input
                    type="text"
                    placeholder="例：G1234 / MU5108"
                    id="trip-trainnumber-input"
                    {...register('trainNumber')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-semibold text-emerald-700 dark:text-emerald-300 font-mono"
                  />
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  行程日期 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  id="trip-date-input"
                  {...register('date')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
                {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date.message}</p>}
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  花费金额 (人民币元) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    id="trip-amount-input"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-semibold"
                  />
                </div>
                {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount.message}</p>}
              </div>

              {/* Origin & Destination */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    出发地点 (选填)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="起点，例：北京首都机场"
                      id="trip-origin-input"
                      {...register('origin')}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    到达地点 (选填)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-emerald-500" />
                    <input
                      type="text"
                      placeholder="终点，例：上海虹桥"
                      id="trip-destination-input"
                      {...register('destination')}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    出发时间 (选填)
                  </label>
                  <input
                    type="time"
                    id="trip-starttime-input"
                    {...register('startTime')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    到达时间 (选填)
                  </label>
                  <input
                    type="time"
                    id="trip-endtime-input"
                    {...register('endTime')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  备注/航班车次 (选填)
                </label>
                <input
                  type="text"
                  placeholder="例：MU5108 航班 / 差旅客户拜访"
                  id="trip-remarks-input"
                  {...register('remarks')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t-2 border-[#d0eedb] dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  id="trip-form-cancel-btn"
                  onClick={closeTripModal}
                  className="px-4 py-2.5 rounded-2xl border-2 border-[#eadaa8] dark:border-slate-700 bg-[#faf5e8] dark:bg-slate-800 text-[#54411f] dark:text-slate-300 hover:bg-[#eadaa8]/50 text-sm font-bold transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  id="trip-form-submit-btn"
                  className="btn-island-dodo px-5 py-2.5 text-sm shadow-sm"
                >
                  {editingTrip ? '保存修改' : '确认添加行程'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Extension modal */}
      <AddCustomCategoryModal
        isOpen={customCatModalOpen}
        type="transport"
        onClose={() => setCustomCatModalOpen(false)}
      />
    </>
  );
};
