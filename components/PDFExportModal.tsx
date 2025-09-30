import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from './icons';
import { UI_STRINGS } from '../constants/es';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: { columns: 1 | 2, includeDiagrams: boolean }) => void;
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const [columns, setColumns] = useState<1 | 2>(1);
  const [includeDiagrams, setIncludeDiagrams] = useState(true);

  const handleExportClick = () => {
    onExport({ columns, includeDiagrams });
  };

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
          aria-labelledby="pdf-export-title"
        >
          <motion.div
            className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-xs"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 id="pdf-export-title" className="text-lg font-semibold text-sky-400">{UI_STRINGS.PDF_EXPORT_OPTIONS_TITLE}</h2>
              <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700" aria-label={UI_STRINGS.CLOSE_MODAL_ARIA_LABEL}>
                <CloseIcon />
              </button>
            </header>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{UI_STRINGS.PDF_LAYOUT_LABEL}</label>
                <div className="flex rounded-lg bg-slate-700 p-1">
                  <button
                    onClick={() => setColumns(1)}
                    className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${columns === 1 ? 'bg-sky-600 text-white' : 'hover:bg-slate-600'}`}
                  >
                    {UI_STRINGS.PDF_COLUMNS_ONE}
                  </button>
                  <button
                    onClick={() => setColumns(2)}
                    className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${columns === 2 ? 'bg-sky-600 text-white' : 'hover:bg-slate-600'}`}
                  >
                    {UI_STRINGS.PDF_COLUMNS_TWO}
                  </button>
                </div>
              </div>
               <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDiagrams}
                    onChange={(e) => setIncludeDiagrams(e.target.checked)}
                    className="h-5 w-5 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-sm font-medium text-slate-300">{UI_STRINGS.PDF_INCLUDE_CHORDS_LABEL}</span>
                </label>
              </div>
            </div>
            <footer className="flex justify-end p-4 bg-slate-700/50 rounded-b-xl">
              <button
                onClick={handleExportClick}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                {UI_STRINGS.EXPORT_BUTTON}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};