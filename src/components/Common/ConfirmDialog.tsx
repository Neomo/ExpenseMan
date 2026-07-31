import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          id="confirm-dialog-card"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 border-3 border-[#c2e8d0] dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-6"
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                variant === 'danger'
                  ? 'bg-[#fcebe6] text-[#e25f38] dark:bg-rose-950/60 dark:text-rose-400'
                  : 'bg-[#fdf3d6] text-[#b38212] dark:bg-amber-950/60 dark:text-amber-400'
              }`}
            >
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-[#3b322a] dark:text-slate-100 flex items-center gap-1.5">
                  <span>🍃</span> {title}
                </h3>
                <button
                  id="confirm-modal-close-icon"
                  onClick={onCancel}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-[#f0f8f3]"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
              <p className="mt-2 text-sm font-bold text-[#635548] dark:text-slate-300">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              id="confirm-dialog-cancel-btn"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-bold text-[#54411f] dark:text-slate-300 bg-[#faf5e8] dark:bg-slate-800 border-2 border-[#eadaa8] dark:border-slate-700 hover:bg-[#eadaa8]/50 rounded-2xl transition-colors"
            >
              {cancelText}
            </button>
            <button
              id="confirm-dialog-action-btn"
              onClick={() => {
                onConfirm();
              }}
              className={`px-4 py-2 text-sm font-black text-white rounded-2xl shadow-xs transition-all border-b-3 active:translate-y-0.5 ${
                variant === 'danger'
                  ? 'bg-[#e85a4f] hover:bg-[#d6473c] border-[#b03a31]'
                  : 'bg-[#f8c844] hover:bg-[#e0b233] text-[#54411f] border-[#c49821]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
