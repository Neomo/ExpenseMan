import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useAppStore();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          id="app-toast-container"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border-3 text-sm font-black backdrop-blur-md"
          style={{
            backgroundColor:
              toast.type === 'success'
                ? '#e8f7ee'
                : toast.type === 'error'
                ? '#fcebe6'
                : '#faf5e8',
            borderColor:
              toast.type === 'success'
                ? '#52c488'
                : toast.type === 'error'
                ? '#e85a4f'
                : '#eadaa8',
            color:
              toast.type === 'success'
                ? '#21633f'
                : toast.type === 'error'
                ? '#912b23'
                : '#54411f',
          }}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#52c488] shrink-0 stroke-[2.5]" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-[#e85a4f] shrink-0 stroke-[2.5]" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-[#297bb1] shrink-0 stroke-[2.5]" />}
          
          <span className="flex items-center gap-1">
            <span>🍃</span>
            <span>{toast.message}</span>
          </span>

          <button
            id="toast-close-btn"
            onClick={clearToast}
            className="ml-2 p-1 rounded-md hover:bg-black/5 transition-colors"
            aria-label="关闭提示"
          >
            <X className="w-4 h-4 opacity-70 hover:opacity-100" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
