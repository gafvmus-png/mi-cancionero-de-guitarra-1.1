import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_STRINGS } from '../constants/es';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  confirmButtonClass?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmButtonText = UI_STRINGS.DELETE_BUTTON,
    confirmButtonClass = 'bg-red-600 hover:bg-red-500' 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <motion.div
            className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 id="confirm-modal-title" className="text-lg font-semibold text-sky-300 mb-2">{title}</h2>
              <p className="text-slate-300 mb-6">{message}</p>
            </div>
            <div className="flex justify-end gap-3 bg-slate-700/50 p-4 rounded-b-xl">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
              >
                {UI_STRINGS.CANCEL_BUTTON}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${confirmButtonClass}`}
              >
                {confirmButtonText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};