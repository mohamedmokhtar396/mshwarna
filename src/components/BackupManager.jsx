import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Upload,
  Share2,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  FileJson,
  Link2
} from 'lucide-react';
import {
  exportDatabasePayload,
  restoreDatabaseFromPayload,
  resetDatabaseToDefault,
  formatCurrency
} from '../db';
import { translations } from '../i18n';

export default function BackupManager({
  lang = 'ar',
  categories,
  items,
  settings,
  isStoragePersisted,
  onOpenPrintReport,
  onOpenShareShowcase,
  isReadOnly = false
}) {
  const t = translations[lang] || translations.ar;
  const [statusMsg, setStatusMsg] = useState(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const fileInputRef = useRef(null);

  const getDateStamp = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}_${mm}_${dd}`;
  };

  // 1. Download JSON Backup File
  const handleDownloadBackup = async () => {
    try {
      const payload = await exportDatabasePayload();
      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const fileName = `bridal_jihaz_backup_${getDateStamp()}.json`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({
        type: 'success',
        text: t.backupDownloadedMsg(fileName)
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.message
      });
    }
  };

  // 2. Share Backup via Web Share API / WhatsApp
  const handleShareBackup = async () => {
    try {
      const payload = await exportDatabasePayload();
      const jsonString = JSON.stringify(payload, null, 2);
      const fileName = `bridal_jihaz_backup_${getDateStamp()}.json`;
      const file = new File([jsonString], fileName, { type: 'application/json' });

      const purchasedCount = items.filter((i) => i.isPurchased).length;
      const totalSpent = items.reduce(
        (s, i) => s + (Number(i.actualPrice) || 0),
        0
      );

      const summaryText =
        lang === 'en'
          ? `🌸 Bride's Companion Backup\nBride: ${
              settings?.brideName || t.defaultBrideName
            }\nPurchased: ${purchasedCount} of ${items.length} items\nTotal Spent: ${formatCurrency(
              totalSpent,
              'en'
            )} EGP\nDate: ${new Date().toLocaleDateString('en-US')}`
          : `🌸 نسخة احتياطية من تطبيق (رفيقة العروسة)\nالعروسة: ${
              settings?.brideName || t.defaultBrideName
            }\nتم شراء: ${purchasedCount} من ${items.length} بند\nإجمالي المصروفات: ${formatCurrency(
              totalSpent,
              'ar'
            )} ج.م\nتاريخ النسخة: ${new Date().toLocaleDateString('ar-EG')}`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: t.appName,
          text: summaryText,
          files: [file]
        });
        setStatusMsg({
          type: 'success',
          text: t.backupSharedMsg
        });
      } else if (navigator.share) {
        await handleDownloadBackup();
        await navigator.share({
          title: t.appName,
          text: summaryText
        });
      } else {
        await handleDownloadBackup();
        const waUrl = `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setStatusMsg({
          type: 'error',
          text: err.message
        });
      }
    }
  };

  // 3. Restore from JSON Backup File
  const handleFileRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await restoreDatabaseFromPayload(parsed);
      setStatusMsg({
        type: 'success',
        text: t.backupRestoredMsg(parsed.items.length, parsed.categories.length)
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.message
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 4. Factory Reset
  const handleFactoryReset = async () => {
    try {
      await resetDatabaseToDefault();
      setIsConfirmingReset(false);
      setStatusMsg({
        type: 'success',
        text: t.factoryResetSuccessMsg
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.message
      });
    }
  };

  const formattedLastUpdated = settings?.lastUpdated
    ? new Date(settings.lastUpdated).toLocaleString(
        lang === 'ar' ? 'ar-EG' : 'en-US',
        {
          dateStyle: 'medium',
          timeStyle: 'short'
        }
      )
    : '';

  return (
    <div className="space-y-6 pb-10">
      {/* Top Reassurance Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-bridal-sageLight/70 via-bridal-surface to-bridal-cream rounded-3xl border border-bridal-sage/40 p-5 sm:p-6 shadow-bridal"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-bridal-sage text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-bridal-sage/20 text-bridal-sageDark text-xs font-bold mb-1">
                <span>{t.offlineProtectionBadge}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-bridal-charcoal">
                {t.backupCenterTitle}
              </h2>
              <p className="text-xs sm:text-sm text-bridal-mauve mt-0.5">
                {t.backupCenterSubtitle}
              </p>
            </div>
          </div>

          <div className="bg-bridal-surface px-4 py-3 rounded-2xl border border-bridal-border text-xs space-y-1 flex-shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-bridal-sageDark">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isStoragePersisted ? t.persistentStorageActive : t.autoSaveActive}
              </span>
            </div>
            <div className="text-bridal-mauve">
              {t.lastUpdatedLabel} {formattedLastUpdated}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Status Alert Message */}
      {statusMsg && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm font-bold ${
            statusMsg.type === 'success'
              ? 'bg-bridal-sageLight border-bridal-sage text-bridal-sageDark'
              : 'bg-red-500/10 border-red-400/40 text-red-500'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </motion.div>
      )}

      {/* Share Live Read-Only Showcase Link Card */}
      {!isReadOnly && onOpenShareShowcase && (
        <div className="bg-gradient-to-l from-bridal-roseLight/70 via-bridal-surface to-bridal-cream rounded-3xl border border-bridal-rose/40 p-5 sm:p-6 shadow-bridal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-bridal-rose text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
                نسخ البروفايل ومشاركته برابط عرض مباشر 🔗
              </h3>
              <p className="text-xs sm:text-sm text-bridal-mauve mt-0.5 leading-relaxed">
                شاركي تقدم جهازك مع والدتك أو خطيبك عبر رابط للقراءة فقط (مع خيار إظهار أو إخفاء الأسعار) بدون أن يتمكن أحد من تعديل بياناتك.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenShareShowcase}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-bridal-rose text-white text-xs sm:text-sm font-extrabold shadow-bridal hover:opacity-95 transition flex-shrink-0"
          >
            <Share2 className="w-4 h-4" />
            <span>إنشاء رابط عرض مشترك</span>
          </button>
        </div>
      )}

      {/* Main Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Export & Share Backup Card */}
        <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 sm:p-6 shadow-bridal flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-bridal-roseLight text-bridal-roseDark flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
              {t.exportShareCardTitle}
            </h3>
            <p className="text-xs sm:text-sm text-bridal-mauve leading-relaxed">
              {t.exportShareCardDesc}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-xs sm:text-sm font-bold shadow-bridal hover:opacity-95 transition"
            >
              <FileJson className="w-4 h-4" />
              <span>{t.downloadJsonBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleShareBackup}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-bridal-sage text-white text-xs sm:text-sm font-bold shadow-xs hover:opacity-95 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.shareWhatsappBtn}</span>
            </button>
          </div>
        </div>

        {/* 2. Restore from Backup Card */}
        {!isReadOnly && (
          <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 sm:p-6 shadow-bridal flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-bridal-goldLight text-bridal-gold flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
                {t.restoreCardTitle}
              </h3>
              <p className="text-xs sm:text-sm text-bridal-mauve leading-relaxed">
                {t.restoreCardDesc}
              </p>
            </div>

            <div className="pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileRestore}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-bridal-cream hover:bg-bridal-goldLight text-bridal-charcoal border border-bridal-border text-xs sm:text-sm font-bold transition"
              >
                <Upload className="w-4 h-4 text-bridal-rose" />
                <span>{t.selectBackupFileBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Printable Inventory / Qaima View */}
        <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 sm:p-6 shadow-bridal flex flex-col justify-between space-y-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-bridal-roseLight text-bridal-roseDark flex items-center justify-center flex-shrink-0">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
                  {t.printQaimaCardTitle}
                </h3>
                <p className="text-xs sm:text-sm text-bridal-mauve mt-0.5 leading-relaxed">
                  {t.printQaimaCardDesc}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPrintReport}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-xs sm:text-sm font-bold hover:opacity-90 transition flex-shrink-0 shadow-bridal"
            >
              <Printer className="w-4 h-4" />
              <span>{t.openPrintViewBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Database Option (Safe & Guarded) */}
      {!isReadOnly && (
        <div className="bg-bridal-surface/70 rounded-2xl border border-bridal-border p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-bridal-mauve">
            <span className="font-bold text-bridal-charcoal">{t.factoryResetTitle} </span>
            {t.factoryResetDesc}
          </div>

          {!isConfirmingReset ? (
            <button
              type="button"
              onClick={() => setIsConfirmingReset(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-400/40 text-red-500 hover:bg-red-500/10 text-xs font-bold flex-shrink-0 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.factoryResetBtn}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-500">{t.areYouSure}</span>
              <button
                type="button"
                onClick={handleFactoryReset}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                {t.confirmResetBtn}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingReset(false)}
                className="px-3 py-1.5 rounded-xl bg-bridal-cream text-bridal-charcoal text-xs font-bold border border-bridal-border"
              >
                {t.cancel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
