import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastData } from '../types';
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon, CloseIcon } from './icons';

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

const icons = {
  success: <CheckCircleIcon />,
  error: <AlertTriangleIcon />,
  info: <InfoIcon />,
};

const colors = {
  success: 'bg-green-600/90 border-green-500',
  error: 'bg-red-600/90 border-red-500',
  info: 'bg-sky-600/90 border-sky-500',
};

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`flex items-center gap-4 p-4 rounded-lg shadow-2xl border text-white ${colors[toast.type]}`}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          >
            <div className="flex-shrink-0 text-xl">
              {icons[toast.type]}
            </div>
            <p className="font-semibold">{toast.message}</p>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
              <CloseIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export type { ToastData };
