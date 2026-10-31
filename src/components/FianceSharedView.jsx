import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Star,
  CheckCircle2,
  MessageCircle,
  ThumbsUp,
  Plus,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Tag,
  Wallet
} from 'lucide-react';
import { translations } from '../i18n';
import { formatCurrency, encodeSharePayload } from '../db';

export default function FianceSharedView({
  shareData,
  lang = 'en',
  onExitPreview,
  onSaveLocalSuggestions
}) {
  const t = translations[lang] || translations.en;
  const isRtl = lang === 'ar';

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'favorites' | 'purchased' | 'suggestions'
  const [itemComments, setItemComments] = useState(() => {
    const map = {};
    (shareData?.items || []).forEach((i) => {
      if (i.fNote) map[i.id] = i.fNote;
    });
    return map;
  });
  const [approvedIds, setApprovedIds] = useState({});
  const [newSuggestions, setNewSuggestions] = useState([]);
  const [sugName, setSugName] = useState('');
  const [sugNote, setSugNote] = useState('');
  const [copiedReply, setCopiedReply] = useState(false);

  const sharedItems = shareData?.items || [];

  const filteredItems = useMemo(() => {
    return sharedItems.filter((item) => {
      if (activeFilter === 'favorites') return Boolean(item.fav);
      if (activeFilter === 'purchased') return Boolean(item.done);
      if (activeFilter === 'suggestions') {
        return Boolean(itemComments[item.id] || approvedIds[item.id]);
      }
      return true;
    });
  }, [sharedItems, activeFilter, itemComments, approvedIds]);

  const handleToggleApprove = (id) => {
    setApprovedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddNewSuggestion = (e) => {
    e.preventDefault();
    if (!sugName.trim()) return;
    setNewSuggestions((prev) => [
      ...prev,
      {
        id: `sug-${Date.now()}`,
        name: sugName.trim(),
        note: sugNote.trim()
      }
    ]);
    setSugName('');
    setSugNote('');
  };

  const buildReplyPayload = () => {
    const notesMap = {};
    Object.keys(itemComments).forEach((id) => {
      const text = itemComments[id]?.trim() || '';
      const isApp = approvedIds[id];
      if (text || isApp) {
        notesMap[id] = `${isApp ? '👍 ' : ''}${text}`.trim();
      }
    });
    Object.keys(approvedIds).forEach((id) => {
      if (approvedIds[id] && !notesMap[id]) {
        notesMap[id] = lang === 'ar' ? '👍 موافق وأعجبني' : '👍 Approved & Liked';
      }
    });

    return {
      type: 'fiance_reply',
      groom: shareData?.groom || '',
      at: new Date().toISOString(),
      notesMap,
      newSuggestions
    };
  };

  const getReplyUrl = () => {
    const payload = buildReplyPayload();
    const encoded = encodeSharePayload(payload);
    return `${window.location.origin}${window.location.pathname}#fiance_reply=${encoded}`;
  };

  const handleCopyReply = async () => {
    const url = getReplyUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedReply(true);
      setTimeout(() => setCopiedReply(false), 3500);
    } catch {
      // fallback
    }
    if (onSaveLocalSuggestions) {
      onSaveLocalSuggestions(buildReplyPayload());
    }
  };

  const handleSendWhatsAppToBride = () => {
    const payload = buildReplyPayload();
    if (onSaveLocalSuggestions) {
      onSaveLocalSuggestions(payload);
    }
    const url = getReplyUrl();
    const notesCount = Object.keys(payload.notesMap).length + newSuggestions.length;
    const text =
      lang === 'en'
        ? `💕 I reviewed your bridal trousseau list and added ${notesCount} suggestions/approvals! Tap this link to import them directly into your app:\n\n${url}`
        : `💕 راجعت قائمة الجهاز والمفضلة وأضفت ${notesCount} مقترحات وتعليقات! اضغطي على هذا الرابط لتنزيل مقترحاتي في تطبيقك مباشرة:\n\n${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-bridal-bg pb-16">
      {/* Top Guest Bar */}
      <div className="sticky top-0 z-30 bg-bridal-surface/95 backdrop-blur-md border-b border-bridal-border px-4 py-3 shadow-bridal">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-bridal-rose to-bridal-roseDark text-white flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-bridal-roseDark bg-bridal-roseLight px-2 py-0.5 rounded-full">
                {t.fianceViewBannerBadge}
              </span>
              <h1 className="text-base sm:text-lg font-extrabold text-bridal-charcoal mt-0.5">
                {t.fianceViewTitle(
                  shareData?.bride || t.defaultBrideName,
                  shareData?.groom
                )}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onExitPreview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-cream hover:bg-bridal-roseLight text-bridal-charcoal text-xs font-bold border border-bridal-border transition"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{t.exitFianceViewBtn}</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Welcome & Personal Message Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-l from-bridal-roseLight/70 via-bridal-surface to-bridal-goldLight/60 border border-bridal-border p-5 sm:p-6 shadow-bridal space-y-3"
        >
          <p className="text-xs sm:text-sm text-bridal-mauve">{t.fianceViewSubtitle}</p>

          {shareData?.msg && (
            <div className="p-3.5 rounded-2xl bg-bridal-surface border border-bridal-rose/40 text-xs sm:text-sm font-bold text-bridal-charcoal flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-bridal-rose flex-shrink-0 mt-0.5" />
              <span>"{shareData.msg}"</span>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 no-scrollbar">
            {[
              { id: 'all', label: `${t.fianceFilterAll} (${sharedItems.length})` },
              {
                id: 'favorites',
                label: `${t.fianceFilterFavorites} (${
                  sharedItems.filter((i) => i.fav).length
                })`
              },
              {
                id: 'purchased',
                label: `${t.fianceFilterPurchased} (${
                  sharedItems.filter((i) => i.done).length
                })`
              },
              {
                id: 'suggestions',
                label: t.fianceFilterSuggestions
              }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                  activeFilter === tab.id
                    ? 'bg-bridal-rose text-white border-bridal-rose shadow-xs'
                    : 'bg-bridal-surface text-bridal-charcoal border-bridal-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Suggest a New Item / Price Quote Box */}
        <form
          onSubmit={handleAddNewSuggestion}
          className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 shadow-bridal space-y-3"
        >
          <h3 className="text-sm sm:text-base font-extrabold text-bridal-charcoal flex items-center gap-2">
            <Plus className="w-4 h-4 text-bridal-rose" />
            <span>{t.fianceSuggestNewItemTitle}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={sugName}
              onChange={(e) => setSugName(e.target.value)}
              placeholder={t.fianceSuggestItemNamePlaceholder}
              className="px-3.5 py-2 rounded-xl bg-bridal-cream border border-bridal-border text-xs sm:text-sm text-bridal-charcoal outline-none focus:border-bridal-rose"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={sugNote}
                onChange={(e) => setSugNote(e.target.value)}
                placeholder={t.fianceSuggestItemNotePlaceholder}
                className="flex-1 px-3.5 py-2 rounded-xl bg-bridal-cream border border-bridal-border text-xs sm:text-sm text-bridal-charcoal outline-none focus:border-bridal-rose"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-bridal-rose text-white text-xs font-bold flex-shrink-0 hover:opacity-95"
              >
                + {t.addSuggestionBtn}
              </button>
            </div>
          </div>

          {newSuggestions.length > 0 && (
            <div className="pt-2 space-y-1.5">
              {newSuggestions.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-xl bg-bridal-goldLight border border-bridal-gold/40 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-bridal-charcoal">{s.name}</span>
                    {s.note && (
                      <span className="text-bridal-mauve mx-2">— {s.note}</span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-bridal-gold">
                    {lang === 'ar' ? 'مقترح جديد ✨' : 'New Suggestion ✨'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Shared Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isApproved = Boolean(approvedIds[item.id]);
            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 space-y-3 transition ${
                  item.done
                    ? 'bg-bridal-sageLight/55 border-bridal-sage/40'
                    : item.fav
                    ? 'bg-bridal-surface border-bridal-gold/50 shadow-bridal'
                    : 'bg-bridal-surface border-bridal-border shadow-bridal'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {item.cName && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-bridal-roseLight text-bridal-roseDark">
                          {item.cName}
                        </span>
                      )}
                      {item.sub && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-bridal-cream text-bridal-mauve border border-bridal-border">
                          <Tag className="w-2.5 h-2.5" />
                          {item.sub}
                        </span>
                      )}
                      {Boolean(item.done) && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-bridal-sage/20 text-bridal-sageDark">
                          {t.purchasedBadge}
                        </span>
                      )}
                      {Boolean(item.fav) && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-bridal-goldLight text-bridal-gold">
                          <Star className="w-3 h-3 fill-bridal-gold" />
                          <span>{lang === 'ar' ? 'مفضلة' : 'Favorite'}</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-bridal-charcoal">
                      {item.n}
                    </h4>
                  </div>

                  {/* Fiancé Approve / Like Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleApprove(item.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex-shrink-0 ${
                      isApproved
                        ? 'bg-bridal-sage text-white border-bridal-sage'
                        : 'bg-bridal-cream text-bridal-mauve border-bridal-border hover:border-bridal-rose'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{isApproved ? t.fianceApprovedBadge : t.toggleApproveBtn}</span>
                  </button>
                </div>

                {item.note && (
                  <p className="text-xs text-bridal-mauve bg-bridal-cream/70 px-3 py-2 rounded-xl border border-bridal-border/60">
                    {item.note}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-bridal-mauve pt-1">
                  <span>
                    {t.qtyLabel} <strong className="text-bridal-charcoal">{item.pQ}/{item.rQ}</strong>
                  </span>
                  {Boolean(shareData?.showPrices) && item.p > 0 && (
                    <span className="inline-flex items-center gap-1 font-bold text-bridal-sageDark">
                      <Wallet className="w-3.5 h-3.5" />
                      {item.isEst ? t.estPriceLabel : t.priceLabel}{' '}
                      {formatCurrency(item.p, lang)} {t.currency}
                    </span>
                  )}
                </div>

                {/* Fiancé Comment / Suggestion Input on this Item */}
                <div className="pt-2 border-t border-bridal-border/60">
                  <input
                    type="text"
                    value={itemComments[item.id] || ''}
                    onChange={(e) =>
                      setItemComments((prev) => ({
                        ...prev,
                        [item.id]: e.target.value
                      }))
                    }
                    placeholder={t.addFianceCommentPlaceholder}
                    className="w-full px-3 py-2 rounded-xl bg-bridal-cream/70 border border-bridal-border text-xs text-bridal-charcoal outline-none focus:border-bridal-rose"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Bottom Bar to Send Suggestions Back to Bride */}
        <div className="sticky bottom-4 z-30 bg-bridal-surface/95 backdrop-blur-md rounded-3xl border-2 border-bridal-rose p-4 shadow-bridal-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm font-bold text-bridal-charcoal">
            {copiedReply ? (
              <span className="text-bridal-sageDark">{t.replyCopiedForBrideMsg}</span>
            ) : (
              <span>
                {lang === 'ar'
                  ? 'بعد إضافة آرائك ومقترحاتك، أرسلها للعروسة بضغطة واحدة:'
                  : 'Finished adding your notes & suggestions? Send them back to the bride:'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyReply}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-bridal-cream text-bridal-charcoal border border-bridal-border text-xs font-bold hover:border-bridal-rose transition"
            >
              {copiedReply ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{t.copyReplyCodeBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsAppToBride}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-xs sm:text-sm font-bold shadow-bridal hover:opacity-95 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.sendSuggestionsBackToBrideBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
