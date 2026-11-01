import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Sparkles,
  Plus,
  Trash2,
  Receipt,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCw
} from 'lucide-react';
import { FINISHING_ITEM_TYPES } from './FinishingLedger';
import { parseArabicNumber, formatCurrency } from '../db';
import { compressMultipleImages } from '../utils/imageUtils';
import {
  extractInvoiceDataWithAI,
  normalizeMaterialKeyword
} from '../utils/finishingBenchmarks';

export default function BatchInvoiceModal({
  isOpen,
  onClose,
  onSaveBatchExpenses
}) {
  const [supplierName, setSupplierName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [invoiceImages, setInvoiceImages] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState('');

  const [itemsList, setItemsList] = useState([
    {
      id: `batch-${Date.now()}-1`,
      title: 'شكارة أسمنت لافارج 42.5',
      itemType: 'أسمنت',
      quantity: 10,
      quantityText: '10 شكاير',
      unitPrice: 250,
      amount: 2500,
      notes: ''
    },
    {
      id: `batch-${Date.now()}-2`,
      title: 'نقلة رمل حرش للمحارة',
      itemType: 'رمل',
      quantity: 2,
      quantityText: '2 متر',
      unitPrice: 220,
      amount: 440,
      notes: ''
    }
  ]);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handlePhotoSelect = async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const compressed = await compressMultipleImages(files);
    setInvoiceImages((prev) => [...prev, ...compressed]);
    e.target.value = '';

    // Auto trigger AI OCR scan on image upload
    if (compressed.length > 0) {
      handleTriggerAIScan(compressed[0]);
    }
  };

  const handleTriggerAIScan = async (imgFile) => {
    setIsScanning(true);
    setScanSuccessMessage('');
    try {
      const result = await extractInvoiceDataWithAI(imgFile);
      if (result.success && Array.isArray(result.items) && result.items.length > 0) {
        setItemsList(result.items);
        if (result.supplierName && !supplierName) {
          setSupplierName(result.supplierName);
        }
        if (result.date) {
          setInvoiceDate(result.date);
        }
        setScanSuccessMessage(
          `تم استخراج ${result.items.length} بنود من الفاتورة بالذكاء الاصطناعي بنجاح! راجع الأسعار والكميات بالأسفل قبل الحفظ ✓`
        );
      }
    } catch (err) {
      console.warn('AI Invoice extraction error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddItemRow = () => {
    setItemsList((prev) => [
      ...prev,
      {
        id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: '',
        itemType: 'أسمنت',
        quantity: 1,
        quantityText: '1',
        unitPrice: 0,
        amount: 0,
        notes: ''
      }
    ]);
  };

  const handleRemoveItemRow = (id) => {
    if (itemsList.length <= 1) return;
    setItemsList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItemsList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Two-way auto calculations:
        if (field === 'quantity') {
          const qty = parseArabicNumber(value) || 0;
          updated.quantity = qty;
          updated.quantityText = `${qty}`;
          if (qty > 0 && item.unitPrice > 0) {
            updated.amount = Math.round(qty * item.unitPrice);
          }
        } else if (field === 'unitPrice') {
          const price = parseArabicNumber(value) || 0;
          updated.unitPrice = price;
          const qty = Number(item.quantity) || 1;
          if (qty > 0 && price > 0) {
            updated.amount = Math.round(qty * price);
          }
        } else if (field === 'amount') {
          const amt = parseArabicNumber(value) || 0;
          updated.amount = amt;
          const qty = Number(item.quantity) || 1;
          if (qty > 0 && amt > 0) {
            updated.unitPrice = Math.round((amt / qty) * 100) / 100;
          }
        } else if (field === 'title') {
          // Auto detect item type
          updated.itemType = normalizeMaterialKeyword(value, item.itemType);
        }

        return updated;
      })
    );
  };

  const totalInvoiceAmount = itemsList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleSubmitAll = (e) => {
    e.preventDefault();
    const validItems = itemsList.filter((i) => i.title.trim() && Number(i.amount) > 0);
    if (validItems.length === 0) {
      alert('يرجى التأكد من كتابة اسم صنف ومبلغ واحد على الأقل في الفاتورة.');
      return;
    }

    onSaveBatchExpenses({
      items: validItems,
      invoiceImages,
      supplierName: supplierName.trim() || 'مورد تشطيب',
      date: invoiceDate || new Date().toISOString().slice(0, 10)
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto no-print">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl bg-bridal-surface rounded-3xl border border-bridal-border shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-bridal-roseLight/70 via-bridal-surface to-bridal-cream border-b border-bridal-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-bridal-rose to-bridal-roseDark text-white flex items-center justify-center shadow-bridal flex-shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
                  إدخال فاتورة مجمعة ومسح بالذكاء الاصطناعي 🧾🤖
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-bridal-roseLight text-bridal-roseDark text-[10px] font-extrabold border border-bridal-rose/30">
                  ذكاء اصطناعي ✨
                </span>
              </div>
              <p className="text-xs text-bridal-mauve mt-0.5">
                ارفع صورة الفاتورة الورقية ليملأ الذكاء الاصطناعي البنود تلقائياً وراجع وراءه، أو اكتب البنود معاً بضغطة واحدة.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bridal-cream text-bridal-mauve hover:text-bridal-charcoal flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitAll} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. Supplier & Invoice Top Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-bridal-cream/60 border border-bridal-border">
            <div>
              <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                اسم المعرض / المغلق / المورد *
              </label>
              <input
                type="text"
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="مثال: مغلق الأمانة لمواد البناء / معرض السلاب"
                className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border text-sm font-bold text-bridal-charcoal outline-none focus:border-bridal-rose"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                تاريخ الفاتورة
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border text-sm font-bold text-bridal-charcoal outline-none focus:border-bridal-rose"
              />
            </div>
          </div>

          {/* 2. Photo Upload & AI Scan Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-l from-bridal-roseLight/50 to-bridal-cream border border-bridal-rose/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-bridal-charcoal flex items-center gap-2">
                  <Camera className="w-4 h-4 text-bridal-rose" />
                  <span>صورة الفاتورة الورقية / إيصال المورد ({invoiceImages.length})</span>
                </h4>
                <p className="text-[11px] text-bridal-mauve mt-0.5">
                  ارفع صورة الفاتورة وسيقوم الذكاء الاصطناعي بقراءة الأصناف والكميات والأسعار ليوفر عليك كتابتها.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-rose text-white text-xs font-extrabold shadow-bridal hover:opacity-95 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>رفع صورة الفاتورة 📸</span>
                </button>

                {invoiceImages.length > 0 && (
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => handleTriggerAIScan(invoiceImages[0])}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-goldLight text-bridal-charcoal border border-bridal-gold text-xs font-extrabold hover:bg-bridal-gold/20 transition disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 text-bridal-gold ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'جاري القراءة...' : 'إعادة المسح بالـ AI ✨'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Uploaded Thumbnails */}
            {invoiceImages.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {invoiceImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-bridal-border group"
                  >
                    <img src={img.dataUrl} alt="فاتورة" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setInvoiceImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* AI Scan Status Feedback */}
            {isScanning && (
              <div className="p-3 rounded-xl bg-bridal-surface border border-bridal-gold/50 flex items-center gap-2.5 text-xs text-bridal-charcoal font-bold animate-pulse">
                <RotateCw className="w-4 h-4 text-bridal-gold animate-spin" />
                <span>الذكاء الاصطناعي يقوم بتحليل خط اليد وقراءة بنود الفاتورة والأسعار... ⏳</span>
              </div>
            )}

            {scanSuccessMessage && !isScanning && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{scanSuccessMessage}</span>
              </div>
            )}
          </div>

          {/* 3. Editable Multi-Item Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-extrabold text-bridal-charcoal flex items-center gap-2">
                <span>بنود ومشتريات الفاتورة ({itemsList.length} أصناف)</span>
              </h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-bridal-cream hover:bg-bridal-roseLight text-bridal-roseDark border border-bridal-border text-xs font-extrabold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة صنف آخر للفاتورة +</span>
              </button>
            </div>

            <div className="border border-bridal-border rounded-2xl overflow-hidden bg-bridal-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-bridal-cream text-bridal-charcoal border-b border-bridal-border font-extrabold">
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 min-w-[200px]">اسم الصنف / البيان *</th>
                      <th className="p-3 min-w-[130px]">نوع الخامة</th>
                      <th className="p-3 w-28">العدد / الكمية</th>
                      <th className="p-3 w-28">سعر المفرد (ج.م)</th>
                      <th className="p-3 w-32">الإجمالي (ج.م) *</th>
                      <th className="p-3 w-10 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bridal-border">
                    {itemsList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-bridal-cream/40 transition">
                        <td className="p-3 text-center font-extrabold text-bridal-mauve">
                          {idx + 1}
                        </td>

                        {/* Title */}
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={item.title}
                            onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
                            placeholder="مثال: 15 شكارة أسمنت لافارج"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal outline-none focus:border-bridal-rose"
                          />
                        </td>

                        {/* Type */}
                        <td className="p-2">
                          <select
                            value={item.itemType}
                            onChange={(e) => handleItemChange(item.id, 'itemType', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal outline-none"
                          >
                            {FINISHING_ITEM_TYPES.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Quantity */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                            placeholder="1"
                            className="w-full px-2 py-1.5 rounded-lg bg-bridal-cream/60 border border-bridal-border text-xs font-extrabold text-center text-bridal-charcoal outline-none"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.unitPrice || ''}
                            onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                            placeholder="سعر القطعة"
                            className="w-full px-2 py-1.5 rounded-lg bg-bridal-cream/60 border border-bridal-border text-xs font-extrabold text-center text-bridal-charcoal outline-none"
                          />
                        </td>

                        {/* Amount Total */}
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={item.amount || ''}
                            onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                            placeholder="الإجمالي"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-bridal-surface border border-bridal-rose/50 text-xs font-black text-center text-bridal-roseDark outline-none focus:ring-1 focus:ring-bridal-rose"
                          />
                        </td>

                        {/* Delete row */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            disabled={itemsList.length <= 1}
                            onClick={() => handleRemoveItemRow(item.id)}
                            className="p-1 rounded-lg text-bridal-mauve hover:text-red-500 hover:bg-red-50 disabled:opacity-20 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Total */}
              <div className="p-3 bg-bridal-cream border-t border-bridal-border flex items-center justify-between text-xs sm:text-sm font-extrabold text-bridal-charcoal">
                <span>إجمالي الفاتورة المجمعة ({itemsList.length} أصناف):</span>
                <span className="text-base sm:text-lg text-bridal-roseDark font-black">
                  {formatCurrency(totalInvoiceAmount, 'ar')} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-bridal-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-bridal-mauve font-medium">
              سيتم حفظ كل صنف كبند مستقل بالعهدة مع إرفاق صورة الفاتورة له وتحديث سعر الوحدة تلقائياً.
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-bridal-cream text-bridal-mauve text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white text-xs sm:text-sm font-extrabold shadow-bridal hover:opacity-95 transition"
              >
                حفظ جميع بنود الفاتورة بالعهدة ({itemsList.length} بنود) ✓
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
