import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share2,
  Link2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { createSharedShowcaseProfile } from '../db';

export default function ShareShowcaseModal({
  isOpen,
  onClose,
  targetUid = null,
  defaultBrideName = 'أحلى عروسة',
  currentUser = null
}) {
  const [title, setTitle] = useState('');
  const [showPrices, setShowPrices] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(
        defaultBrideName && defaultBrideName !== 'أحلى عروسة'
          ? `نموذج جهاز العروسة (${defaultBrideName})`
          : 'نموذج جهاز عروسة متكامل'
      );
      setShowPrices(true);
      setGeneratedLink('');
      setCopied(false);
      setError('');
    }
  }, [isOpen, defaultBrideName]);

  const handleGenerateLink = async (e) => {
    e.preventDefault();
    setError('');
    setIsGenerating(true);
    try {
      const { shareUrl } = await createSharedShowcaseProfile({
        targetUid,
        title: title.trim() || 'نموذج جهاز عروسة متكامل',
        showPrices,
        createdByUid: currentUser?.uid || '',
        createdByEmail: currentUser?.email || ''
      });
      setGeneratedLink(shareUrl);
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
      } catch {
        // Fallback if clipboard permission denied
      }
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء إنشاء رابط المشاركة.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAgain = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="w-full max-w-lg bg-bridal-bg rounded-t-3xl sm:rounded-3xl border border-bridal-border shadow-bridal-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-l from-bridal-roseLight to-bridal-cream border-b border-bridal-border">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-bridal-rose text-white flex items-center justify-center shadow-xs">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
                    نسخ البروفايل ومشاركته برابط عرض 🔗
                  </h3>
                  <p className="text-xs text-bridal-mauve">
                    إنشاء رابط قراءة فقط لاستعراض أقسام وبنود الجهاز بدون إمكانية التعديل
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-bridal-surface text-bridal-mauve hover:text-bridal-charcoal border border-bridal-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/40 text-red-600 text-xs font-bold">
                  {error}
                </div>
              )}

              {!generatedLink ? (
                <form onSubmit={handleGenerateLink} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1.5">
                      عنوان صفحة العرض المشتركة *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: نموذج جهاز عروسة متكامل"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border focus:border-bridal-rose outline-none text-sm font-bold text-bridal-charcoal"
                    />
                  </div>

                  {/* Toggle Show Prices */}
                  <div className="p-3.5 rounded-2xl bg-bridal-surface border border-bridal-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {showPrices ? (
                        <Eye className="w-5 h-5 text-bridal-sageDark" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-bridal-mauve" />
                      )}
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-bridal-charcoal">
                          إظهار الأسعار والميزانية في النسخة المشتركة
                        </div>
                        <div className="text-[11px] text-bridal-mauve">
                          {showPrices
                            ? 'سيتمكن المشاهد من رؤية الأسعار والميزانية والأقساط'
                            : 'سيتم إخفاء كافة الأسعار والمبالغ المالية واقتصار العرض على الأصناف والكميات'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPrices(!showPrices)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition flex-shrink-0 ${
                        showPrices
                          ? 'bg-bridal-sage text-white border-bridal-sage'
                          : 'bg-bridal-cream text-bridal-mauve border-bridal-border'
                      }`}
                    >
                      {showPrices ? 'الأسعار ظاهرة ✓' : 'الأسعار مخفية'}
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-bridal-border bg-bridal-surface text-bridal-mauve text-xs sm:text-sm font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white text-xs sm:text-sm font-extrabold shadow-bridal hover:opacity-95 transition disabled:opacity-60"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>
                        {isGenerating
                          ? 'جاري إنشاء الرابط...'
                          : 'إنشاء ونسخ رابط العرض المشترك'}
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-bridal-sageLight border border-bridal-sage/40 flex items-start gap-3 text-bridal-sageDark">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm font-bold leading-relaxed">
                      تم إنشاء نسخة العرض المشتركة بنجاح! {copied && 'وتم نسخ الرابط تلقائياً إلى الحافظة ✓'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-bridal-mauve mb-1">
                      رابط العرض المباشر (يعمل بدون تسجيل دخول):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        dir="ltr"
                        value={generatedLink}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border text-xs font-mono text-bridal-charcoal select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyAgain}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-bridal-rose text-white text-xs font-extrabold shadow-xs hover:opacity-95 transition flex-shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copied ? 'تم النسخ ✓' : 'نسخ الرابط'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <a
                      href={generatedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-bridal-goldLight text-bridal-charcoal border border-bridal-gold/40 text-xs font-extrabold hover:bg-bridal-gold/25 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-bridal-gold" />
                      <span>فتح ومعاينة الرابط الآن</span>
                    </a>

                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-bridal-cream text-bridal-charcoal border border-bridal-border text-xs font-extrabold"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
