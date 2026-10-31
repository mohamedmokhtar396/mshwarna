import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Star,
  Check,
  Wallet,
  Calculator,
  StickyNote,
  Layers,
  Tag,
  Camera,
  Receipt,
  Trash2
} from 'lucide-react';
import { parseArabicNumber, formatCurrency } from '../db';
import { translations, getLocalizedItem, getLocalizedCategory } from '../i18n';
import { compressMultipleImages } from '../utils/imageUtils';

export default function ItemModal({
  isOpen,
  onClose,
  onSave,
  initialItem,
  categories,
  defaultCategoryId,
  lang = 'en',
  onFormDirtyChange
}) {
  const t = translations[lang] || translations.en;

  const productPhotoRef = useRef(null);
  const invoicePhotoRef = useRef(null);

  const [formData, setFormData] = useState({
    id: '',
    categoryId: defaultCategoryId || (categories[0]?.id ?? 'cat-appliances'),
    name: '',
    subcategory: lang === 'en' ? 'General' : 'عام',
    requiredQty: 1,
    purchasedQty: 0,
    estimatedPrice: '',
    actualPrice: '',
    paidAmount: '',
    remainingAmount: '',
    isPurchased: false,
    isPriority: false,
    brand: '',
    storeName: '',
    nextInstallmentDate: '',
    deliveryDate: '',
    notes: '',
    images: [],
    invoiceImages: []
  });

  const [paymentMode, setPaymentMode] = useState('full'); // 'full' | 'installment'
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialItem) {
      const loc = getLocalizedItem(initialItem, lang);
      const hasInstallment = Number(initialItem.remainingAmount) > 0;
      setPaymentMode(hasInstallment ? 'installment' : 'full');
      setFormData({
        id: initialItem.id,
        categoryId: initialItem.categoryId || defaultCategoryId || categories[0]?.id,
        name: loc.displayName || '',
        subcategory: loc.displaySubcategory || (lang === 'en' ? 'General' : 'عام'),
        requiredQty: initialItem.requiredQty ?? 1,
        purchasedQty: initialItem.purchasedQty ?? 0,
        estimatedPrice: initialItem.estimatedPrice ? String(initialItem.estimatedPrice) : '',
        actualPrice: initialItem.actualPrice ? String(initialItem.actualPrice) : '',
        paidAmount: initialItem.paidAmount ? String(initialItem.paidAmount) : '',
        remainingAmount: initialItem.remainingAmount ? String(initialItem.remainingAmount) : '',
        isPurchased: Boolean(initialItem.isPurchased),
        isPriority: Boolean(initialItem.isPriority),
        brand: initialItem.brand || '',
        storeName: initialItem.storeName || '',
        nextInstallmentDate: initialItem.nextInstallmentDate || '',
        deliveryDate: initialItem.deliveryDate || '',
        notes: loc.displayNotes || '',
        images: initialItem.images || [],
        invoiceImages: initialItem.invoiceImages || []
      });
    } else {
      setPaymentMode('full');
      setFormData({
        id: '',
        categoryId: defaultCategoryId || (categories[0]?.id ?? 'cat-appliances'),
        name: '',
        subcategory: lang === 'en' ? 'General' : 'عام',
        requiredQty: 1,
        purchasedQty: 0,
        estimatedPrice: '',
        actualPrice: '',
        paidAmount: '',
        remainingAmount: '',
        isPurchased: false,
        isPriority: false,
        brand: '',
        storeName: '',
        nextInstallmentDate: '',
        deliveryDate: '',
        notes: '',
        images: [],
        invoiceImages: []
      });
    }
    setError('');
    if (onFormDirtyChange) onFormDirtyChange(false);
  }, [initialItem, defaultCategoryId, categories, isOpen, lang]);

  const updateField = (patch) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    if (onFormDirtyChange) onFormDirtyChange(true);
  };

  const handleActualPriceChange = (val) => {
    const actual = parseArabicNumber(val);
    if (paymentMode === 'full') {
      updateField({
        actualPrice: val,
        paidAmount: val,
        remainingAmount: '0'
      });
    } else {
      const paid = parseArabicNumber(formData.paidAmount);
      const rem = Math.max(0, actual - paid);
      updateField({
        actualPrice: val,
        remainingAmount: String(rem)
      });
    }
  };

  const handlePaidAmountChange = (val) => {
    const paid = parseArabicNumber(val);
    const actual = parseArabicNumber(formData.actualPrice);
    const rem = Math.max(0, actual - paid);
    updateField({
      paidAmount: val,
      remainingAmount: String(rem)
    });
  };

  const handleUploadPhotos = async (e, isInvoice = false) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const compressed = await compressMultipleImages(files);
    if (compressed.length > 0) {
      if (isInvoice) {
        updateField({
          invoiceImages: [...(formData.invoiceImages || []), ...compressed]
        });
      } else {
        updateField({
          images: [...(formData.images || []), ...compressed]
        });
      }
    }
    e.target.value = '';
  };

  const handleRemoveImage = (imgId, isInvoice = false) => {
    if (isInvoice) {
      updateField({
        invoiceImages: (formData.invoiceImages || []).filter((i) => i.id !== imgId)
      });
    } else {
      updateField({
        images: (formData.images || []).filter((i) => i.id !== imgId)
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(t.itemNameRequiredError);
      return;
    }

    const actual = parseArabicNumber(formData.actualPrice);
    const paid =
      paymentMode === 'full'
        ? actual
        : parseArabicNumber(formData.paidAmount);
    const rem =
      paymentMode === 'full'
        ? 0
        : Math.max(
            0,
            formData.remainingAmount !== ''
              ? parseArabicNumber(formData.remainingAmount)
              : actual - paid
          );

    if (onFormDirtyChange) onFormDirtyChange(false);
    onSave({
      ...formData,
      actualPrice: actual,
      estimatedPrice: parseArabicNumber(formData.estimatedPrice),
      paidAmount: paid,
      remainingAmount: rem
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-2xl bg-bridal-bg rounded-t-3xl sm:rounded-3xl border border-bridal-border shadow-bridal-lg overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-l from-bridal-roseLight to-bridal-cream border-b border-bridal-border">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-bridal-charcoal">
                  {initialItem ? t.editItemModalTitle : t.addItemModalTitle}
                </h2>
                <p className="text-xs text-bridal-mauve mt-0.5">
                  {t.itemModalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onFormDirtyChange) onFormDirtyChange(false);
                  onClose();
                }}
                className="p-2 rounded-full bg-bridal-surface text-bridal-mauve hover:text-bridal-charcoal border border-bridal-border transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/40 text-red-500 text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-bridal-charcoal mb-1.5">
                  {t.itemNameLabel}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField({ name: e.target.value })}
                  placeholder={t.itemNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border focus:border-bridal-rose focus:ring-2 focus:ring-bridal-rose/20 outline-none text-sm font-medium text-bridal-charcoal"
                />
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-bridal-charcoal mb-1.5">
                    <Layers className="w-3.5 h-3.5 text-bridal-rose" />
                    {t.mainCategoryLabel}
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => updateField({ categoryId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border focus:border-bridal-rose outline-none text-sm text-bridal-charcoal"
                  >
                    {categories.map((cat) => {
                      const locCat = getLocalizedCategory(cat, lang);
                      return (
                        <option key={cat.id} value={cat.id}>
                          {locCat.displayName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-bridal-charcoal mb-1.5">
                    <Tag className="w-3.5 h-3.5 text-bridal-rose" />
                    {t.subcategoryInputLabel}
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => updateField({ subcategory: e.target.value })}
                    placeholder={t.subcategoryPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border focus:border-bridal-rose outline-none text-sm text-bridal-charcoal"
                  />
                </div>
              </div>

              {/* Status Toggles: Purchased & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const nextPurchased = !formData.isPurchased;
                    updateField({
                      isPurchased: nextPurchased,
                      purchasedQty: nextPurchased
                        ? Math.max(Number(formData.purchasedQty) || 0, Number(formData.requiredQty) || 1)
                        : formData.purchasedQty
                    });
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition ${
                    formData.isPurchased
                      ? 'bg-bridal-sage text-white border-bridal-sage shadow-xs'
                      : 'bg-bridal-surface text-bridal-charcoal border-bridal-border hover:border-bridal-sage'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{formData.isPurchased ? t.markedPurchasedBtn : t.markAsPurchasedBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateField({ isPriority: !formData.isPriority })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition ${
                    formData.isPriority
                      ? 'bg-bridal-goldLight text-bridal-gold border-bridal-gold shadow-xs'
                      : 'bg-bridal-surface text-bridal-charcoal border-bridal-border hover:border-bridal-gold'
                  }`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      formData.isPriority ? 'fill-bridal-gold text-bridal-gold' : ''
                    }`}
                  />
                  <span>{formData.isPriority ? t.inPrioritiesBtn : t.addToPrioritiesBtn}</span>
                </button>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-2 gap-3 bg-bridal-cream/80 p-3.5 rounded-2xl border border-bridal-border">
                <div>
                  <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                    {t.requiredQtyLabel}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.requiredQty}
                    onChange={(e) => updateField({ requiredQty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-center font-bold text-sm text-bridal-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                    {t.purchasedQtyLabel}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.purchasedQty}
                    onChange={(e) => updateField({ purchasedQty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-center font-bold text-sm text-bridal-charcoal"
                  />
                </div>
              </div>

              {/* Financial Tracking Section */}
              <div className="bg-bridal-surface p-4 rounded-2xl border border-bridal-border space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-bridal-charcoal">
                    <Wallet className="w-4 h-4 text-bridal-rose" />
                    <span>{t.financialSectionTitle}</span>
                  </div>

                  {/* Payment Mode Switcher */}
                  <div className="inline-flex rounded-xl bg-bridal-cream p-0.5 border border-bridal-border text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMode('full');
                        updateField({
                          paidAmount: formData.actualPrice,
                          remainingAmount: '0'
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        paymentMode === 'full'
                          ? 'bg-bridal-surface text-bridal-rose shadow-2xs'
                          : 'text-bridal-mauve'
                      }`}
                    >
                      {t.cashFullMode}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('installment')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        paymentMode === 'installment'
                          ? 'bg-bridal-goldLight text-bridal-gold shadow-2xs'
                          : 'text-bridal-mauve'
                      }`}
                    >
                      {t.installmentMode}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-bridal-mauve mb-1">
                      {t.actualTotalPriceLabel}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.actualPrice}
                      onChange={(e) => handleActualPriceChange(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2 rounded-xl bg-bridal-cream/50 border border-bridal-border focus:border-bridal-rose outline-none text-sm font-bold text-bridal-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-bridal-mauve mb-1">
                      {t.estimatedBudgetPriceLabel}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.estimatedPrice}
                      onChange={(e) => updateField({ estimatedPrice: e.target.value })}
                      placeholder="0"
                      className="w-full px-3.5 py-2 rounded-xl bg-bridal-cream/50 border border-bridal-border focus:border-bridal-rose outline-none text-sm text-bridal-mauve"
                    />
                  </div>
                </div>

                {/* Installment / Deposit Fields */}
                {paymentMode === 'installment' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-bridal-border/70">
                    <div>
                      <label className="block text-xs font-bold text-bridal-sageDark mb-1">
                        {t.paidDepositAmountLabel}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.paidAmount}
                        onChange={(e) => handlePaidAmountChange(e.target.value)}
                        placeholder="0"
                        className="w-full px-3.5 py-2 rounded-xl bg-bridal-sageLight/50 border border-bridal-sage/40 outline-none text-sm font-bold text-bridal-sageDark"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-xs font-bold text-bridal-gold mb-1">
                        <Calculator className="w-3.5 h-3.5" />
                        {t.remainingMerchantAmountLabel}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.remainingAmount}
                        onChange={(e) => updateField({ remainingAmount: e.target.value })}
                        placeholder="0"
                        className="w-full px-3.5 py-2 rounded-xl bg-bridal-goldLight border border-bridal-gold/40 outline-none text-sm font-bold text-bridal-gold"
                      />
                    </div>
                  </div>
                )}

                {/* Installment Due Date, Delivery Date, Store & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-bridal-border/70">
                  {paymentMode === 'installment' && (
                    <div>
                      <label className="block text-[11px] font-bold text-bridal-gold mb-1">
                        📅 تاريخ القسط القادم (للتنبيه)
                      </label>
                      <input
                        type="date"
                        value={formData.nextInstallmentDate || ''}
                        onChange={(e) => updateField({ nextInstallmentDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                      🚚 تاريخ الاستلام المتفق عليه
                    </label>
                    <input
                      type="date"
                      value={formData.deliveryDate || ''}
                      onChange={(e) => updateField({ deliveryDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                      🏪 اسم المعرض / الماركة
                    </label>
                    <input
                      type="text"
                      value={formData.storeName || ''}
                      onChange={(e) => updateField({ storeName: e.target.value })}
                      placeholder="مثال: بي تك / معرض الأثاث"
                      className="w-full px-3 py-1.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>
                </div>

                {parseArabicNumber(formData.actualPrice) > 0 && (
                  <div className="text-[11px] text-bridal-mauve flex items-center justify-between pt-1">
                    <span>
                      {t.actualTotalSummary}{' '}
                      {formatCurrency(parseArabicNumber(formData.actualPrice), lang)}{' '}
                      {t.currency}
                    </span>
                    {paymentMode === 'installment' && (
                      <span className="text-bridal-gold font-bold">
                        {t.remainingToPaySummary}{' '}
                        {formatCurrency(parseArabicNumber(formData.remainingAmount), lang)}{' '}
                        {t.currency}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Photo & Invoice Upload Sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Product / Price Quote Photos */}
                <div className="bg-bridal-surface p-3.5 rounded-2xl border border-bridal-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bridal-charcoal">
                      {t.itemPhotosTitle}
                    </span>
                    <input
                      ref={productPhotoRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleUploadPhotos(e, false)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => productPhotoRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-bridal-roseLight text-bridal-roseDark text-[11px] font-bold hover:opacity-90"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>+</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-bridal-mauve leading-snug">
                    {t.itemPhotosSubtitle}
                  </p>
                  {formData.images?.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                      {formData.images.map((img) => (
                        <div
                          key={img.id}
                          className="relative w-14 h-14 rounded-xl overflow-hidden border border-bridal-border flex-shrink-0 group"
                        >
                          <img
                            src={img.dataUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img.id, false)}
                            className="absolute top-0.5 right-0.5 p-1 rounded-full bg-black/65 text-white hover:bg-red-600 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Purchase Invoices & Warranty Receipts */}
                <div className="bg-bridal-surface p-3.5 rounded-2xl border border-bridal-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bridal-charcoal">
                      {t.invoicePhotosTitle}
                    </span>
                    <input
                      ref={invoicePhotoRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleUploadPhotos(e, true)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => invoicePhotoRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-bridal-goldLight text-bridal-gold text-[11px] font-bold hover:opacity-90"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>+</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-bridal-mauve leading-snug">
                    {t.invoicePhotosSubtitle}
                  </p>
                  {formData.invoiceImages?.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                      {formData.invoiceImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-bridal-gold/60 flex-shrink-0 group"
                        >
                          <img
                            src={img.dataUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img.id, true)}
                            className="absolute top-0.5 right-0.5 p-1 rounded-full bg-black/65 text-white hover:bg-red-600 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rich Metadata / Notes */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-bridal-charcoal mb-1.5">
                  <StickyNote className="w-3.5 h-3.5 text-bridal-rose" />
                  {t.notesLabel}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => updateField({ notes: e.target.value })}
                  placeholder={t.notesPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border focus:border-bridal-rose outline-none text-sm text-bridal-charcoal resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onFormDirtyChange) onFormDirtyChange(false);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-bridal-border bg-bridal-surface text-bridal-mauve hover:text-bridal-charcoal text-sm font-bold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-sm font-bold shadow-bridal hover:opacity-95 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.saveItemBtn}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
