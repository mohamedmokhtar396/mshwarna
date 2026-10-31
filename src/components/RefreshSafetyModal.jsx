import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Download, RotateCw, X } from 'lucide-react';
import { translations } from '../i18n';

export default function RefreshSafetyModal({
  isOpen,
  onClose,
  lang = 'en',
  hasUnsavedFormChanges = false,
  onDownloadBackupAndRefresh,
  onForceRefresh
}) {
  const t = translations[lang] || translations.en;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md bg-bridal-bg rounded-3xl border border-bridal-border shadow-bridal-lg overflow-hidden p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-bridal-goldLight text-bridal-gold border border-bridal-gold/40 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
                  {t.refreshWarningTitle}
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-bridal-surface text-bridal-mauve hover:text-bridal-charcoal border border-bridal-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {hasUnsavedFormChanges && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-400/40 text-red-500 text-xs font-bold">
                {t.refreshUnsavedFormWarn}
              </div>
            )}

            <p className="text-xs sm:text-sm text-bridal-mauve leading-relaxed">
              {t.refreshWarningDesc}
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onDownloadBackupAndRefresh}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-xs sm:text-sm font-bold shadow-bridal hover:opacity-95 transition"
              >
                <Download className="w-4 h-4" />
                <span>{t.downloadBackupFirstBtn}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl bg-bridal-surface text-bridal-charcoal border border-bridal-border text-xs font-bold hover:border-bridal-rose transition"
                >
                  {t.stayOnPageBtn}
                </button>
                <button
                  type="button"
                  onClick={onForceRefresh}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-bridal-cream text-bridal-mauve hover:text-red-500 border border-bridal-border text-xs font-bold transition"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{t.refreshAnywayBtn}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
