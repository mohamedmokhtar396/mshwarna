import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Share2,
  Copy,
  Check,
  Eye,
  MessageCircle,
  Sparkles,
  Download
} from 'lucide-react';
import { translations, getLocalizedItem, getLocalizedCategory } from '../i18n';
import { encodeSharePayload, decodeSharePayload } from '../db';

export default function ShareFianceModal({
  isOpen,
  onClose,
  lang = 'en',
  categories,
  items,
  settings,
  onPreviewFianceView,
  onPreviewFianceMode,
  onImportFianceReply
}) {
  const t = translations[lang] || translations.en;
  const isMale = settings?.gender === 'male';
  const previewHandler = onPreviewFianceView || onPreviewFianceMode;

  const [fianceName, setFianceName] = useState(settings?.fianceName || '');
  const [personalMessage, setPersonalMessage] = useState('');
  const [includePurchased, setIncludePurchased] = useState(true);
  const [includeFavorites, setIncludeFavorites] = useState(true);
  const [includeRemaining, setIncludeRemaining] = useState(false);
  const [includePrices, setIncludePrices] = useState(true);

  const [copied, setCopied] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [importStatus, setImportStatus] = useState(null);

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = getLocalizedCategory(c, lang).displayName;
    });
    return map;
  }, [categories, lang]);

  // Build compact share payload so URL stays clean and works anywhere without registration
  const buildShareData = () => {
    const selectedItems = items.filter((item) => {
      if (item.isPurchased && includePurchased) return true;
      if (item.isPriority && !item.isPurchased && includeFavorites) return true;
      if (!item.isPurchased && !item.isPriority && includeRemaining) return true;
      return false;
    });

    const compactItems = selectedItems.map((i) => {
      const loc = getLocalizedItem(i, lang);
      return {
        id: i.id,
        cId: i.categoryId,
        cName: categoryMap[i.categoryId] || '',
        n: loc.displayName,
        sub: loc.displaySubcategory || '',
        rQ: i.requiredQty || 1,
        pQ: i.purchasedQty || 0,
        done: i.isPurchased ? 1 : 0,
        fav: i.isPriority ? 1 : 0,
        p: includePrices
          ? Number(i.actualPrice) > 0
            ? Number(i.actualPrice)
            : Number(i.estimatedPrice) || 0
          : 0,
        isEst: includePrices && !(Number(i.actualPrice) > 0) ? 1 : 0,
        note: loc.displayNotes || '',
        fNote: i.fianceNote || ''
      };
    });

    return {
      v: 1,
      lang,
      bride: settings?.brideName || t.defaultBrideName,
      groom: fianceName.trim(),
      msg: personalMessage.trim(),
      showPrices: includePrices ? 1 : 0,
      at: new Date().toISOString(),
      items: compactItems
    };
  };

  const getShareUrl = () => {
    const payload = buildShareData();
    const encoded = encodeSharePayload(payload);
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}#share=${encoded}`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    }
  };

  const handleSendWhatsApp = () => {
    const url = getShareUrl();
    const bride = settings?.brideName || (isMale ? 'أحلى عريس' : t.defaultBrideName);
    const text =
      lang === 'en'
        ? `💍 Hi ${
            fianceName || 'my love'
          }! Here is my wedding checklist & purchases from (${bride}). You can open it directly without signing up and add your suggestions:\n\n${url}`
        : isMale
        ? `💍 أهلاً يا ${
            fianceName || 'عروستي الجميلة'
          }! دي قائمة جهازي والحاجات اللي اشتريتها لتأسيس شقتنا (${bride})، تقدري تفتحيها مباشرة بدون أي تسجيل وتكتبي لي رأيك ومقترحاتك:\n\n${url}`
        : `💍 أهلاً يا ${
            fianceName || 'حبيبي'
          }! دي قائمة جهازي والمفضلة الخاصة بي (${bride})، تقدر تفتحها مباشرة بدون أي تسجيل وتكتب لي رأيك ومقترحاتك:\n\n${url}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePreview = () => {
    const data = buildShareData();
    if (previewHandler) previewHandler(data);
    onClose();
  };

  const handleImportReply = async () => {
    if (!replyInput.trim()) return;
    let encoded = replyInput.trim();
    if (encoded.includes('#fiance_reply=')) {
      encoded = encoded.split('#fiance_reply=')[1].split('&')[0];
    } else if (encoded.includes('#share=')) {
      encoded = encoded.split('#share=')[1].split('&')[0];
    }

    const decoded = decodeSharePayload(encoded);
    if (!decoded) {
      setImportStatus({
        type: 'error',
        text:
          lang === 'en'
            ? 'Invalid reply link or code. Please paste the full link sent by your fiancé.'
            : 'الرابط أو الكود غير صالح، يرجى لصق الرابط الكامل المرسل من خطيبك.'
      });
      return;
    }

    const count = await onImportFianceReply(decoded);
    setImportStatus({
      type: 'success',
      text: t.fianceReplyImportedSuccess(count)
    });
    setReplyInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.96 }}
            className="w-full max-w-xl bg-bridal-bg rounded-t-3xl sm:rounded-3xl border border-bridal-border shadow-bridal-lg overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-l from-bridal-roseLight to-bridal-cream border-b border-bridal-border">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-bridal-rose text-white flex items-center justify-center shadow-xs">
                  <Heart className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
                    {lang === 'ar' && isMale
                      ? 'مشاركة جهازي ومشترياتي مع عروستي 👰‍♀️💍'
                      : t.shareModalTitle}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-bridal-mauve">
                    {lang === 'ar' && isMale
                      ? 'أرسل رابطاً لعروستك لتشاهد ما اشتريته وتكتب لك رأيها ومقترحاتها بدون أي تسجيل'
                      : t.shareModalSubtitle}
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

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Partner Name & Message */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                    {lang === 'ar' && isMale ? 'اسم العروسة (اختياري)' : t.fianceNameLabel}
                  </label>
                  <input
                    type="text"
                    value={fianceName}
                    onChange={(e) => setFianceName(e.target.value)}
                    placeholder={
                      lang === 'ar' && isMale ? 'مثال: سارة / حبيبتي' : t.fianceNamePlaceholder
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-sm text-bridal-charcoal outline-none focus:border-bridal-rose"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                    {lang === 'ar' && isMale
                      ? 'رسالة حلوة لعروستك (اختياري)'
                      : t.personalMessageToFianceLabel}
                  </label>
                  <input
                    type="text"
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder={
                      lang === 'ar' && isMale
                        ? 'مثال: شوفي الحاجات اللي جبتها لشقتنا واكتبي لي رأيك ❤️'
                        : t.personalMessageToFiancePlaceholder
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-sm text-bridal-charcoal outline-none focus:border-bridal-rose"
                  />
                </div>
              </div>

              {/* Checkboxes: What to include */}
              <div className="bg-bridal-surface p-4 rounded-2xl border border-bridal-border space-y-2.5">
                <label className="block text-xs font-bold text-bridal-charcoal">
                  {t.whatToShareLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border cursor-pointer text-xs font-bold text-bridal-charcoal">
                    <input
                      type="checkbox"
                      checked={includePurchased}
                      onChange={(e) => setIncludePurchased(e.target.checked)}
                      className="accent-bridal-rose w-4 h-4"
                    />
                    <span>{t.shareOptPurchased}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border cursor-pointer text-xs font-bold text-bridal-charcoal">
                    <input
                      type="checkbox"
                      checked={includeFavorites}
                      onChange={(e) => setIncludeFavorites(e.target.checked)}
                      className="accent-bridal-rose w-4 h-4"
                    />
                    <span>{t.shareOptFavorites}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border cursor-pointer text-xs font-bold text-bridal-charcoal">
                    <input
                      type="checkbox"
                      checked={includeRemaining}
                      onChange={(e) => setIncludeRemaining(e.target.checked)}
                      className="accent-bridal-rose w-4 h-4"
                    />
                    <span>{t.shareOptRemaining}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border cursor-pointer text-xs font-bold text-bridal-charcoal">
                    <input
                      type="checkbox"
                      checked={includePrices}
                      onChange={(e) => setIncludePrices(e.target.checked)}
                      className="accent-bridal-rose w-4 h-4"
                    />
                    <span>{t.shareOptPrices}</span>
                  </label>
                </div>
              </div>

              {/* Share Action Buttons */}
              {copied && (
                <div className="p-3 rounded-xl bg-bridal-sageLight border border-bridal-sage text-bridal-sageDark text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{t.linkCopiedMsg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-xs sm:text-sm font-bold shadow-bridal hover:opacity-95 transition"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{t.copyShareLinkBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-bridal-sage text-white text-xs sm:text-sm font-bold shadow-xs hover:opacity-95 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {lang === 'ar' && isMale
                      ? 'إرسال عبر واتساب لعروستي 💬'
                      : t.sendViaWhatsappToFianceBtn}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePreview}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-bridal-surface hover:bg-bridal-roseLight/60 text-bridal-charcoal border border-bridal-border text-xs font-bold transition"
              >
                <Eye className="w-4 h-4 text-bridal-rose" />
                <span>{t.previewFianceModeBtn}</span>
              </button>

              {/* Import Fiancé Reply Section */}
              <div className="pt-3 border-t border-bridal-border space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-bridal-charcoal">
                  <Sparkles className="w-3.5 h-3.5 text-bridal-gold" />
                  <span>{t.importFianceReplyTitle}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder={t.importFianceReplyPlaceholder}
                    className="flex-1 px-3 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-xs text-bridal-charcoal outline-none focus:border-bridal-rose"
                  />
                  <button
                    type="button"
                    onClick={handleImportReply}
                    className="px-4 py-2 rounded-xl bg-bridal-goldLight text-bridal-gold border border-bridal-gold/40 text-xs font-bold hover:opacity-90 flex-shrink-0"
                  >
                    {t.importFianceReplyBtn}
                  </button>
                </div>
                {importStatus && (
                  <p
                    className={`text-xs font-bold ${
                      importStatus.type === 'success'
                        ? 'text-bridal-sageDark'
                        : 'text-red-500'
                    }`}
                  >
                    {importStatus.text}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
