import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Star,
  Plus,
  Minus,
  Edit3,
  Trash2,
  StickyNote,
  Wallet,
  AlertCircle,
  Tag,
  Camera,
  Receipt,
  Heart
} from 'lucide-react';
import { formatCurrency } from '../db';
import { translations, getLocalizedItem } from '../i18n';
import { compressMultipleImages } from '../utils/imageUtils';

export default function ItemCard({
  item,
  lang = 'en',
  categoryName,
  onTogglePurchased,
  onTogglePriority,
  onUpdateQty,
  onEdit,
  onDelete,
  onQuickUploadPhotos,
  onOpenLightbox
}) {
  const t = translations[lang] || translations.en;
  const localized = getLocalizedItem(item, lang);
  const photoInputRef = useRef(null);
  const invoiceInputRef = useRef(null);

  const reqQty = Math.max(1, Number(item.requiredQty) || 1);
  const purQty = Math.max(0, Number(item.purchasedQty) || 0);
  const qtyPercent = Math.min(100, Math.round((purQty / reqQty) * 100));

  const actualPrice = Number(item.actualPrice) || 0;
  const estimatedPrice = Number(item.estimatedPrice) || 0;
  const paidAmount = Number(item.paidAmount) || 0;
  const remainingAmount = Number(item.remainingAmount) || 0;

  const productImages = item.images || [];
  const invoiceImages = item.invoiceImages || [];
  const allItemImages = [...productImages, ...invoiceImages];

  const handleQuickFiles = async (e, isInvoice = false) => {
    const files = e.target.files;
    if (!files || !files.length || !onQuickUploadPhotos) return;
    const compressed = await compressMultipleImages(files);
    if (compressed.length > 0) {
      onQuickUploadPhotos(item.id, compressed, isInvoice);
    }
    e.target.value = '';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl border transition-all duration-200 p-4 sm:p-5 ${
        item.isPurchased
          ? 'bg-bridal-sageLight/60 border-bridal-sage/40 shadow-sm'
          : item.isPriority
          ? 'bg-bridal-surface border-bridal-gold/50 shadow-bridal'
          : 'bg-bridal-surface border-bridal-border hover:border-bridal-rose/50 shadow-bridal'
      }`}
    >
      {/* Top Row: Checkbox + Title + Priority Star */}
      <div className="flex items-start gap-3">
        {/* Purchased Toggle Button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          type="button"
          onClick={() => onTogglePurchased(item)}
          className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-colors ${
            item.isPurchased
              ? 'bg-bridal-sage border-bridal-sage text-white shadow-sm'
              : 'bg-bridal-cream border-bridal-rose/40 text-transparent hover:border-bridal-rose'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
        </motion.button>

        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {categoryName && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-bridal-roseLight text-bridal-roseDark">
                {categoryName}
              </span>
            )}
            {localized.displaySubcategory && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-bridal-cream text-bridal-mauve border border-bridal-border">
                <Tag className="w-2.5 h-2.5" />
                {localized.displaySubcategory}
              </span>
            )}
            {item.isPurchased && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-bridal-sage/20 text-bridal-sageDark">
                {t.purchasedBadge}
              </span>
            )}
            {invoiceImages.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onOpenLightbox &&
                  onOpenLightbox(invoiceImages, 0, `${localized.displayName} - Invoices`, item.id)
                }
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-bridal-goldLight text-bridal-gold border border-bridal-gold/30 hover:opacity-90"
              >
                <Receipt className="w-3 h-3" />
                <span>{t.invoicesCountBadge(invoiceImages.length)}</span>
              </button>
            )}
          </div>

          <h3
            onClick={() => onEdit(item)}
            className={`text-base sm:text-lg font-bold cursor-pointer transition-colors leading-snug ${
              item.isPurchased
                ? 'line-through text-bridal-mauve'
                : 'text-bridal-charcoal hover:text-bridal-rose'
            }`}
          >
            {localized.displayName}
          </h3>
        </div>

        {/* Priority / Favorite Star Toggle */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          type="button"
          onClick={() => onTogglePriority(item)}
          title={item.isPriority ? t.priorityTooltipRemove : t.priorityTooltipAdd}
          className={`flex-shrink-0 p-2 rounded-xl border transition-all ${
            item.isPriority
              ? 'bg-bridal-goldLight border-bridal-gold/40 text-bridal-gold shadow-sm'
              : 'bg-bridal-cream/70 border-transparent text-bridal-mauve/50 hover:text-bridal-gold hover:bg-bridal-goldLight/50'
          }`}
        >
          <Star className={`w-5 h-5 ${item.isPriority ? 'fill-bridal-gold' : ''}`} />
        </motion.button>
      </div>

      {/* Notes / Brand / Price Quote Preview */}
      {localized.displayNotes && (
        <div
          className={`mt-2.5 ${
            lang === 'ar' ? 'mr-10' : 'ml-10'
          } flex items-start gap-1.5 text-xs sm:text-sm text-bridal-mauve bg-bridal-cream/70 rounded-xl px-3 py-2 border border-bridal-border/60`}
        >
          <StickyNote className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-bridal-rose" />
          <p className="leading-relaxed break-words">{localized.displayNotes}</p>
        </div>
      )}

      {/* Fiancé Note / Suggestion Badge if present */}
      {item.fianceNote && (
        <div
          className={`mt-2 ${
            lang === 'ar' ? 'mr-10' : 'ml-10'
          } flex items-start gap-1.5 text-xs font-bold text-bridal-roseDark bg-bridal-roseLight/80 rounded-xl px-3 py-2 border border-bridal-rose/35`}
        >
          <Heart className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 fill-bridal-rose text-bridal-rose" />
          <div>
            <span className="opacity-80">{t.fianceNoteLabel} </span>
            <span>{item.fianceNote}</span>
          </div>
        </div>
      )}

      {/* Attached Photos & Invoices Thumbnails Strip */}
      {allItemImages.length > 0 && (
        <div
          className={`mt-2.5 ${
            lang === 'ar' ? 'mr-10' : 'ml-10'
          } flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar`}
        >
          {productImages.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() =>
                onOpenLightbox &&
                onOpenLightbox(allItemImages, idx, localized.displayName, item.id)
              }
              className="relative w-13 h-13 rounded-xl overflow-hidden border border-bridal-border flex-shrink-0 group/img hover:border-bridal-rose transition"
              title="Product / Price Quote Photo"
            >
              <img
                src={img.dataUrl}
                alt={localized.displayName}
                className="w-12 h-12 object-cover"
              />
            </button>
          ))}
          {invoiceImages.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() =>
                onOpenLightbox &&
                onOpenLightbox(
                  allItemImages,
                  productImages.length + idx,
                  `${localized.displayName} - Invoice`,
                  item.id
                )
              }
              className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-bridal-gold/60 flex-shrink-0 hover:border-bridal-gold transition"
              title="Invoice / Warranty Photo"
            >
              <img
                src={img.dataUrl}
                alt="Invoice"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 bg-black/65 text-white text-[9px] font-bold text-center py-0.2">
                🧾
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom Row: Quantity Stepper + Financial Badges + Quick Photo/Invoice Upload */}
      <div className="mt-3.5 pt-3 border-t border-bridal-border/70 flex flex-wrap items-center justify-between gap-2.5">
        {/* Quantity Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-bridal-mauve font-medium">{t.qtyLabel}</span>
          <div className="inline-flex items-center bg-bridal-cream rounded-xl border border-bridal-border p-0.5">
            <button
              type="button"
              onClick={() => onUpdateQty(item, -1)}
              disabled={purQty <= 0}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-bridal-charcoal hover:bg-bridal-surface disabled:opacity-35 transition"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 text-xs sm:text-sm font-bold text-bridal-charcoal min-w-[54px] text-center">
              {purQty} <span className="text-bridal-mauve font-normal">{t.ofWord}</span>{' '}
              {reqQty}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQty(item, 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-bridal-charcoal hover:bg-bridal-surface transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Financial Summary & Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Actual Price or Estimated Price */}
          {actualPrice > 0 ? (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-bridal-sageLight text-bridal-sageDark border border-bridal-sage/30 hover:bg-bridal-sage/20 transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>
                {t.priceLabel} {formatCurrency(actualPrice, lang)} {t.currency}
              </span>
            </button>
          ) : estimatedPrice > 0 ? (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-bridal-cream text-bridal-mauve border border-bridal-border hover:border-bridal-rose/50 transition"
            >
              <Wallet className="w-3.5 h-3.5 text-bridal-rose" />
              <span>
                {t.estPriceLabel} {formatCurrency(estimatedPrice, lang)} {t.currency}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-bridal-roseLight/60 text-bridal-roseDark hover:bg-bridal-roseLight transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{t.recordPriceBtn}</span>
            </button>
          )}

          {/* Remaining Installment / Balance Badge */}
          {remainingAmount > 0 && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-bridal-goldLight text-bridal-gold border border-bridal-gold/40 animate-pulse"
              title={`${formatCurrency(paidAmount, lang)} / ${formatCurrency(
                remainingAmount,
                lang
              )}`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-bridal-amber" />
              <span>
                {t.remainingBadge} {formatCurrency(remainingAmount, lang)} {t.currency}
              </span>
            </button>
          )}

          {/* Quick Photo & Invoice Upload Buttons */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleQuickFiles(e, false)}
            className="hidden"
          />
          <input
            ref={invoiceInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleQuickFiles(e, true)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            title={t.uploadItemPhotoBtn}
            className="p-1.5 rounded-lg text-bridal-mauve hover:text-bridal-rose hover:bg-bridal-roseLight/60 transition"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => invoiceInputRef.current?.click()}
            title={t.uploadInvoicePhotoBtn}
            className="p-1.5 rounded-lg text-bridal-mauve hover:text-bridal-gold hover:bg-bridal-goldLight transition"
          >
            <Receipt className="w-4 h-4" />
          </button>

          {/* Edit & Delete Buttons */}
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={t.editItemTooltip}
            className="p-1.5 rounded-lg text-bridal-mauve hover:text-bridal-rose hover:bg-bridal-roseLight/60 transition"
            title={t.editItemTooltip}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label={t.deleteItemTooltip}
            className="p-1.5 rounded-lg text-bridal-mauve hover:text-red-500 hover:bg-red-500/10 transition"
            title={t.deleteItemTooltip}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
