import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Wallet,
  Receipt,
  Plus,
  Trash2,
  Edit3,
  Camera,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Eye,
  Calendar,
  User,
  Phone,
  Building2,
  Percent,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Printer,
  Sparkles,
  TrendingUp,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Tag
} from 'lucide-react';
import {
  formatCurrency,
  parseArabicNumber,
  DEFAULT_FINISHING_LEDGER,
  createEngineerLedgerShareLink
} from '../db';
import { compressMultipleImages } from '../utils/imageUtils';
import {
  extractQuantityNumber,
  normalizeMaterialKeyword,
  evaluateMarketPrice
} from '../utils/finishingBenchmarks';
import FinishingPriceAnalytics from './FinishingPriceAnalytics';
import FinishingGuideView from './FinishingGuideView';
import BatchInvoiceModal from './BatchInvoiceModal';

export const FINISHING_ITEM_TYPES = [
  { id: 'رمل', label: 'رمل 🏜️', color: '#D97706' },
  { id: 'طوب', label: 'طوب أحمر / أسمنتي 🧱', color: '#DC2626' },
  { id: 'أسمنت', label: 'أسمنت ومونة 🪨', color: '#4B5563' },
  { id: 'ونش وتشوين', label: 'ونش رفع وتشوين 🏗️', color: '#2563EB' },
  { id: 'سباكة وعزل', label: 'سباكة وعزل 🔧', color: '#0284C7' },
  { id: 'كهرباء وأسلاك', label: 'كهرباء وأسلاك ⚡', color: '#CA8A04' },
  { id: 'محارة وبنا', label: 'محارة ومصنعية بنا 👷', color: '#7C3AED' },
  { id: 'جبس ودهانات', label: 'جبس ومعجون ودهانات 🪣', color: '#0D9488' },
  { id: 'سيراميك وبورسلين', label: 'سيراميك وبورسلين 🔲', color: '#4F46E5' },
  { id: 'نجارة وأبواب', label: 'نجارة وأبواب 🚪', color: '#92400E' },
  { id: 'ألوميتال وزجاج', label: 'ألوميتال وشبابيك 🪟', color: '#0369A1' },
  { id: 'نقل ومشال وتكسير', label: 'نقل ومشال وتكسير 🚛', color: '#BE123C' },
  { id: 'أخرى', label: 'بند تشطيب آخر ➕', color: '#6B7280' }
];

export const PAYMENT_METHODS = [
  'نقدي (كاش) 💵',
  'إنستاباي (InstaPay) 📱',
  'فودافون كاش / محفظة 📲',
  'تحويل بنكي 🏦',
  'شيك بنكي 📄'
];

export default function FinishingLedger({
  lang = 'ar',
  settings,
  onUpdateSettings,
  onOpenLightbox,
  onPreviewEngineerView,
  isReadOnly = false
}) {
  const ledger = {
    ...DEFAULT_FINISHING_LEDGER,
    ...(settings?.finishingLedger || {})
  };

  const advances = Array.isArray(ledger.advances) ? ledger.advances : [];
  const rawExpenses = Array.isArray(ledger.expenses) ? ledger.expenses : [];

  // Normalized expenses with unitPrice auto-calculated if missing
  const expenses = useMemo(() => {
    return rawExpenses.map((ex) => {
      const parsedQty = extractQuantityNumber(ex.quantityText) || 1;
      let unitPrice = Number(ex.unitPrice) || 0;
      if (!unitPrice && parsedQty > 0 && Number(ex.amount) > 0) {
        unitPrice = Math.round((Number(ex.amount) / parsedQty) * 100) / 100;
      }
      return {
        ...ex,
        effectiveUnitPrice: unitPrice > 0 ? unitPrice : Number(ex.amount) || 0
      };
    });
  }, [rawExpenses]);

  // Active sub-tab: 'expenses' | 'advances' | 'analytics' | 'guide'
  const [subTab, setSubTab] = useState('expenses');

  // Engineer Info Editor
  const [isEditingEngineer, setIsEditingEngineer] = useState(false);
  const [engName, setEngName] = useState(ledger.engineerName || '');
  const [engPhone, setEngPhone] = useState(ledger.engineerPhone || '');
  const [aptTitle, setAptTitle] = useState(ledger.apartmentTitle || 'تشطيب شقة الزوجية');
  const [supFee, setSupFee] = useState(String(ledger.supervisionFeePercent || 0));

  // New / Edit Expense Form State
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expType, setExpType] = useState('رمل');
  const [expTitle, setExpTitle] = useState('');
  const [expQty, setExpQty] = useState('');
  const [expUnitPrice, setExpUnitPrice] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expSupplier, setExpSupplier] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [expImages, setExpImages] = useState([]);
  const expFileRef = useRef(null);

  // Batch Invoice Modal State
  const [isBatchInvoiceOpen, setIsBatchInvoiceOpen] = useState(false);

  // New / Edit Advance (Custody Payment) Form State
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [editingAdvanceId, setEditingAdvanceId] = useState(null);
  const [advAmount, setAdvAmount] = useState('');
  const [advTitle, setAdvTitle] = useState('');
  const [advMethod, setAdvMethod] = useState(PAYMENT_METHODS[0]);
  const [advDate, setAdvDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [advNotes, setAdvNotes] = useState('');
  const [advImages, setAdvImages] = useState([]);
  const advFileRef = useRef(null);

  // Filter & Search for Expenses
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Share with Engineer State
  const [sharingLoading, setSharingLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  const saveLedger = async (nextLedgerPatch) => {
    if (isReadOnly) return;
    const updatedLedger = {
      ...ledger,
      ...nextLedgerPatch
    };
    await onUpdateSettings({ finishingLedger: updatedLedger });
  };

  // Financial Calculations
  const totalAdvances = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const supervisionFeePercent = Number(ledger.supervisionFeePercent) || 0;
  const supervisionFeeAmount =
    supervisionFeePercent > 0 ? Math.round((totalExpenses * supervisionFeePercent) / 100) : 0;
  const totalSpentWithFee = totalExpenses + supervisionFeeAmount;
  const netBalance = totalAdvances - totalSpentWithFee;

  // Save Engineer Info
  const handleSaveEngineerInfo = async (e) => {
    e.preventDefault();
    await saveLedger({
      engineerName: engName.trim(),
      engineerPhone: engPhone.trim(),
      apartmentTitle: aptTitle.trim() || 'تشطيب شقة الزوجية',
      supervisionFeePercent: parseArabicNumber(supFee)
    });
    setIsEditingEngineer(false);
  };

  // Upload images helper
  const handlePhotoSelect = async (e, target = 'expense') => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const compressed = await compressMultipleImages(files);
    if (target === 'expense') {
      setExpImages((prev) => [...prev, ...compressed]);
    } else {
      setAdvImages((prev) => [...prev, ...compressed]);
    }
    e.target.value = '';
  };

  // Quick attach invoice photo directly to an existing expense card
  const handleQuickAttachExpensePhotos = async (expenseId, files) => {
    if (!files || !files.length || isReadOnly) return;
    const compressed = await compressMultipleImages(files);
    const nextExpenses = expenses.map((ex) =>
      ex.id === expenseId
        ? { ...ex, invoiceImages: [...(ex.invoiceImages || []), ...compressed] }
        : ex
    );
    await saveLedger({ expenses: nextExpenses });
  };

  // Save Single Expense
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const amountNum = parseArabicNumber(expAmount);
    const unitPriceNum = parseArabicNumber(expUnitPrice);
    const parsedQty = extractQuantityNumber(expQty) || 1;

    if (!expTitle.trim() && !expType) return;

    const finalUnitPrice =
      unitPriceNum > 0
        ? unitPriceNum
        : parsedQty > 0 && amountNum > 0
        ? Math.round((amountNum / parsedQty) * 100) / 100
        : amountNum;

    const record = {
      id: editingExpenseId || `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemType: expType,
      title: expTitle.trim() || expType,
      quantityText: expQty.trim() || `${parsedQty}`,
      unitPrice: finalUnitPrice,
      amount: amountNum,
      date: expDate || new Date().toISOString().slice(0, 10),
      supplierName: expSupplier.trim(),
      notes: expNotes.trim(),
      invoiceImages: expImages,
      createdAt: new Date().toISOString()
    };

    const nextExpenses = editingExpenseId
      ? expenses.map((item) => (item.id === editingExpenseId ? record : item))
      : [record, ...expenses];

    await saveLedger({ expenses: nextExpenses });
    resetExpenseForm();
  };

  // Save Batch Invoices from AI Scanner Modal
  const handleSaveBatchExpenses = async ({ items, invoiceImages: batchImages, supplierName, date }) => {
    const newRecords = items.map((item, idx) => ({
      id: `exp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      itemType: item.itemType || 'أخرى',
      title: item.title,
      quantityText: item.quantityText || `${item.quantity || 1}`,
      unitPrice: Number(item.unitPrice) || 0,
      amount: Number(item.amount) || 0,
      date: date || new Date().toISOString().slice(0, 10),
      supplierName: supplierName || '',
      notes: item.notes || `ضمن فاتورة مجمعة من: ${supplierName || 'المورد'}`,
      invoiceImages: batchImages || [],
      createdAt: new Date().toISOString()
    }));

    await saveLedger({ expenses: [...newRecords, ...expenses] });
    setSubTab('expenses');
  };

  const resetExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpenseId(null);
    setExpType('رمل');
    setExpTitle('');
    setExpQty('');
    setExpUnitPrice('');
    setExpAmount('');
    setExpSupplier('');
    setExpNotes('');
    setExpImages([]);
  };

  const handleEditExpense = (item) => {
    setEditingExpenseId(item.id);
    setExpType(item.itemType || 'رمل');
    setExpTitle(item.title || '');
    setExpQty(item.quantityText || '');
    const parsedQty = extractQuantityNumber(item.quantityText) || 1;
    const computedUnitPrice =
      Number(item.unitPrice) > 0
        ? Number(item.unitPrice)
        : parsedQty > 0 && Number(item.amount) > 0
        ? Math.round((Number(item.amount) / parsedQty) * 100) / 100
        : '';
    setExpUnitPrice(computedUnitPrice ? String(computedUnitPrice) : '');
    setExpAmount(String(item.amount || ''));
    setExpDate(item.date || new Date().toISOString().slice(0, 10));
    setExpSupplier(item.supplierName || '');
    setExpNotes(item.notes || '');
    setExpImages(item.invoiceImages || []);
    setShowExpenseForm(true);
    setSubTab('expenses');
  };

  const handleDeleteExpense = async (id) => {
    if (isReadOnly) return;
    if (window.confirm('هل أنت متأكد من حذف بند المصروفات هذا؟')) {
      await saveLedger({ expenses: expenses.filter((e) => e.id !== id) });
    }
  };

  // Two-way calculation handlers in the expense form
  const handleQtyInputChange = (val) => {
    setExpQty(val);
    const qty = extractQuantityNumber(val);
    const unitPrice = parseArabicNumber(expUnitPrice);
    const amount = parseArabicNumber(expAmount);

    if (qty > 0 && unitPrice > 0) {
      setExpAmount(String(Math.round(qty * unitPrice)));
    } else if (qty > 0 && amount > 0 && !unitPrice) {
      setExpUnitPrice(String(Math.round((amount / qty) * 100) / 100));
    }
  };

  const handleUnitPriceInputChange = (val) => {
    setExpUnitPrice(val);
    const unitPrice = parseArabicNumber(val);
    const qty = extractQuantityNumber(expQty) || 1;

    if (unitPrice > 0 && qty > 0) {
      setExpAmount(String(Math.round(qty * unitPrice)));
    }
  };

  const handleAmountInputChange = (val) => {
    setExpAmount(val);
    const amount = parseArabicNumber(val);
    const qty = extractQuantityNumber(expQty) || 1;

    if (amount > 0 && qty > 0 && !expUnitPrice) {
      setExpUnitPrice(String(Math.round((amount / qty) * 100) / 100));
    }
  };

  // Live Historical Price Comparison for the currently typed item
  const historicalMatch = useMemo(() => {
    if (!expTitle.trim() && !expType) return null;
    const kw = normalizeMaterialKeyword(expTitle, expType);
    const matches = expenses.filter(
      (e) => e.id !== editingExpenseId && normalizeMaterialKeyword(e.title, e.itemType) === kw
    );
    if (matches.length === 0) return null;

    const sorted = [...matches].sort(
      (a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
    );
    const latest = sorted[0];
    const prevUnitPrice = latest.effectiveUnitPrice || 0;

    return {
      ...latest,
      effectiveUnitPrice: prevUnitPrice,
      keyword: kw,
      count: matches.length
    };
  }, [expTitle, expType, expenses, editingExpenseId]);

  // Live AI Market Price evaluation
  const liveAiEval = useMemo(() => {
    const price = parseArabicNumber(expUnitPrice);
    return evaluateMarketPrice(expTitle, expType, price);
  }, [expTitle, expType, expUnitPrice]);

  // Save Advance (Custody Payment)
  const handleSaveAdvance = async (e) => {
    e.preventDefault();
    const amountNum = parseArabicNumber(advAmount);
    if (amountNum <= 0) return;

    const record = {
      id: editingAdvanceId || `adv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount: amountNum,
      title: advTitle.trim() || `دفعة عهدة تشطيب`,
      paymentMethod: advMethod,
      date: advDate || new Date().toISOString().slice(0, 10),
      notes: advNotes.trim(),
      receiptImages: advImages,
      createdAt: new Date().toISOString()
    };

    const nextAdvances = editingAdvanceId
      ? advances.map((item) => (item.id === editingAdvanceId ? record : item))
      : [record, ...advances];

    await saveLedger({ advances: nextAdvances });
    resetAdvanceForm();
  };

  const resetAdvanceForm = () => {
    setShowAdvanceForm(false);
    setEditingAdvanceId(null);
    setAdvAmount('');
    setAdvTitle('');
    setAdvMethod(PAYMENT_METHODS[0]);
    setAdvNotes('');
    setAdvImages([]);
  };

  const handleEditAdvance = (adv) => {
    setEditingAdvanceId(adv.id);
    setAdvAmount(String(adv.amount || ''));
    setAdvTitle(adv.title || '');
    setAdvMethod(adv.paymentMethod || PAYMENT_METHODS[0]);
    setAdvDate(adv.date || new Date().toISOString().slice(0, 10));
    setAdvNotes(adv.notes || '');
    setAdvImages(adv.receiptImages || []);
    setShowAdvanceForm(true);
    setSubTab('advances');
  };

  const handleDeleteAdvance = async (id) => {
    if (isReadOnly) return;
    if (window.confirm('هل أنت متأكد من حذف هذه الدفعة من العهدة؟')) {
      await saveLedger({ advances: advances.filter((a) => a.id !== id) });
    }
  };

  // Generate & Copy Engineer Share Link
  const handleGenerateEngineerLink = async () => {
    setSharingLoading(true);
    try {
      const result = await createEngineerLedgerShareLink({
        ledger,
        ownerName: settings?.brideName || 'صاحب الشقة'
      });
      setShareUrl(result.shareUrl);
      await navigator.clipboard.writeText(result.shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3500);
    } catch (err) {
      console.warn(err);
    } finally {
      setSharingLoading(false);
    }
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      if (selectedTypeFilter !== 'all' && item.itemType !== selectedTypeFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mTitle = item.title?.toLowerCase().includes(q);
        const mSupplier = item.supplierName?.toLowerCase().includes(q);
        const mType = item.itemType?.toLowerCase().includes(q);
        const mNotes = item.notes?.toLowerCase().includes(q);
        return mTitle || mSupplier || mType || mNotes;
      }
      return true;
    });
  }, [expenses, selectedTypeFilter, searchTerm]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Header & Engineer Info Card */}
      <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 sm:p-7 shadow-bridal space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-bridal-roseLight text-bridal-roseDark flex items-center justify-center p-3 shadow-bridal flex-shrink-0">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full bg-bridal-roseLight text-bridal-roseDark text-xs font-extrabold border border-bridal-rose/30">
                  كشف عُهدة المهندس والتشطيبات 👷‍♂️🧱
                </span>
                <span className="text-sm sm:text-base font-extrabold text-bridal-charcoal">
                  {ledger.apartmentTitle || 'تشطيب شقة الزوجية'}
                </span>
              </div>
              <p className="text-xs text-bridal-mauve mt-1">
                تتبع دفعات العهدة، فواتير الرمل والطوب والأسمنت والونش والسباكة، ومقارنة تغير الأسعار بين الموردين
              </p>
            </div>
          </div>

          {/* Engineer Details & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsEditingEngineer(!isEditingEngineer)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bridal-cream hover:bg-bridal-roseLight text-bridal-charcoal text-xs font-bold border border-bridal-border transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-bridal-rose" />
                <span>
                  {ledger.engineerName ? `المهندس: ${ledger.engineerName}` : 'تخصيص بيانات المهندس'}
                </span>
              </button>
            )}

            {/* Share with Engineer Button */}
            <button
              type="button"
              onClick={handleGenerateEngineerLink}
              disabled={sharingLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-rose text-white text-xs font-extrabold shadow-bridal hover:opacity-95 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? 'تم نسخ الرابط المباشر ✓' : 'مشاركة الكشف مع المهندس'}</span>
            </button>
          </div>
        </div>

        {/* Engineer Edit Form Inline */}
        <AnimatePresence>
          {isEditingEngineer && !isReadOnly && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveEngineerInfo}
              className="pt-4 border-t border-bridal-border grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
            >
              <div>
                <label className="block text-bridal-charcoal font-bold mb-1">اسم المهندس المشرف</label>
                <input
                  type="text"
                  value={engName}
                  onChange={(e) => setEngName(e.target.value)}
                  placeholder="م. أحمد محمد"
                  className="w-full px-3 py-2 rounded-xl bg-bridal-cream border border-bridal-border font-bold text-bridal-charcoal"
                />
              </div>
              <div>
                <label className="block text-bridal-charcoal font-bold mb-1">رقم موبايل المهندس</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={engPhone}
                  onChange={(e) => setEngPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl bg-bridal-cream border border-bridal-border font-bold text-bridal-charcoal text-right"
                />
              </div>
              <div>
                <label className="block text-bridal-charcoal font-bold mb-1">عنوان / كود الشقة</label>
                <input
                  type="text"
                  value={aptTitle}
                  onChange={(e) => setAptTitle(e.target.value)}
                  placeholder="شقة التجمع / عمارة 5"
                  className="w-full px-3 py-2 rounded-xl bg-bridal-cream border border-bridal-border font-bold text-bridal-charcoal"
                />
              </div>
              <div>
                <label className="block text-bridal-charcoal font-bold mb-1">نسبة إشراف المهندس (%)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={supFee}
                    onChange={(e) => setSupFee(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-xl bg-bridal-cream border border-bridal-border font-bold text-bridal-charcoal text-center"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-bridal-rose text-white font-extrabold whitespace-nowrap"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Custody Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-bridal-surface border border-bridal-border shadow-2xs">
          <span className="text-[11px] font-bold text-bridal-mauve block mb-1">
            إجمالي الدفعات المسلمة (العُهدة) 💵
          </span>
          <div className="text-xl sm:text-2xl font-black text-bridal-charcoal">
            {formatCurrency(totalAdvances, 'ar')} ج.م
          </div>
          <span className="text-[11px] text-bridal-mauve mt-1 block">
            عدد الدفعات: {advances.length} دفعة
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-bridal-surface border border-bridal-border shadow-2xs">
          <span className="text-[11px] font-bold text-bridal-mauve block mb-1">
            إجمالي الفواتير والمصروفات 🧾
          </span>
          <div className="text-xl sm:text-2xl font-black text-bridal-roseDark">
            {formatCurrency(totalExpenses, 'ar')} ج.م
          </div>
          <span className="text-[11px] text-bridal-mauve mt-1 block">
            عدد البنود: {expenses.length} بند تشطيب
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-bridal-surface border border-bridal-border shadow-2xs">
          <span className="text-[11px] font-bold text-bridal-mauve block mb-1">
            نسبة إشراف المهندس ({supervisionFeePercent}%)
          </span>
          <div className="text-xl sm:text-2xl font-black text-bridal-charcoal">
            {formatCurrency(supervisionFeeAmount, 'ar')} ج.م
          </div>
          <span className="text-[11px] text-bridal-mauve mt-1 block">
            إجمالي المصروفات مع الإشراف: {formatCurrency(totalSpentWithFee, 'ar')} ج.م
          </span>
        </div>

        {/* Net Custody Balance */}
        <div
          className={`p-4 rounded-2xl border shadow-2xs ${
            netBalance >= 0
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-red-50/80 border-red-200 text-red-950'
          }`}
        >
          <span className="text-[11px] font-bold block mb-1">
            {netBalance >= 0 ? 'المتبقي من العُهدة مع المهندس' : 'المبلغ المستحق للمهندس (مطلوب دفعه)'}
          </span>
          <div
            className={`text-xl sm:text-2xl font-black ${
              netBalance >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {formatCurrency(Math.abs(netBalance), 'ar')} ج.م
          </div>
          <span className="text-[10px] font-bold mt-1 block opacity-85">
            {netBalance >= 0 ? '✓ الفواتير ضمن حدود العهدة المسلمة' : '⚠️ المصروفات تجاوزت العهدة المسلمة'}
          </span>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs: Expenses, Advances, Price Analytics, Beginner Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bridal-border pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-bridal-surface border border-bridal-border overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSubTab('expenses')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
              subTab === 'expenses'
                ? 'bg-bridal-rose text-white shadow-bridal'
                : 'text-bridal-mauve hover:text-bridal-charcoal'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>فواتير ومصروفات التشطيب ({expenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('advances')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
              subTab === 'advances'
                ? 'bg-bridal-rose text-white shadow-bridal'
                : 'text-bridal-mauve hover:text-bridal-charcoal'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>دفعات العُهدة للمهندس ({advances.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('analytics')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
              subTab === 'analytics'
                ? 'bg-bridal-rose text-white shadow-bridal'
                : 'text-bridal-mauve hover:text-bridal-charcoal'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>تحليل الأسعار وزيادة الخامات 📈</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('guide')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
              subTab === 'guide'
                ? 'bg-bridal-rose text-white shadow-bridal'
                : 'text-bridal-mauve hover:text-bridal-charcoal'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>دليل التشطيب للمبتدئين 📐</span>
          </button>
        </div>

        {/* Action Buttons to Open Add Forms */}
        {!isReadOnly && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Multi-Item AI Invoice Button */}
            <button
              type="button"
              onClick={() => setIsBatchInvoiceOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-bridal-goldLight hover:bg-bridal-gold/25 text-bridal-charcoal border border-bridal-gold/60 text-xs font-black shadow-2xs transition"
              title="ارفع فاتورة ورقية ليملأ الذكاء الاصطناعي بنودها تلقائياً"
            >
              <Sparkles className="w-4 h-4 text-bridal-gold" />
              <span>فاتورة مجمعة بالـ AI 🧾🤖</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetAdvanceForm();
                setSubTab('advances');
                setShowAdvanceForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-bridal-surface hover:bg-bridal-cream text-bridal-charcoal border border-bridal-border text-xs font-extrabold transition"
            >
              <Plus className="w-4 h-4 text-bridal-sage" />
              <span>تسجيل دفعة عهدة 💰</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetExpenseForm();
                setSubTab('expenses');
                setShowExpenseForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white text-xs font-extrabold shadow-bridal hover:opacity-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة بند فردي +</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          TAB 1: EXPENSES & INVOICES
          ========================================================================= */}
      {subTab === 'expenses' && (
        <div className="space-y-4">
          {/* Add / Edit Expense Form */}
          <AnimatePresence>
            {showExpenseForm && !isReadOnly && (
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSaveExpense}
                className="bg-bridal-surface rounded-3xl border-2 border-bridal-rose/50 p-5 shadow-bridal-lg space-y-4"
              >
                <div className="flex items-center justify-between border-b border-bridal-border pb-3">
                  <h3 className="text-base font-extrabold text-bridal-charcoal">
                    {editingExpenseId
                      ? '✏️ تعديل بند تشطيب وفاتورة'
                      : '🧱 تسجيل بند مصروفات تشطيب جديد مع حساب سعر الوحدة'}
                  </h3>
                  <button
                    type="button"
                    onClick={resetExpenseForm}
                    className="text-xs font-bold text-bridal-mauve hover:text-bridal-charcoal"
                  >
                    إلغاء ✕
                  </button>
                </div>

                {/* Quick Chips for Item Type */}
                <div>
                  <label className="block text-xs font-extrabold text-bridal-charcoal mb-2">
                    اختر نوع البند السريع *
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {FINISHING_ITEM_TYPES.map((tObj) => (
                      <button
                        key={tObj.id}
                        type="button"
                        onClick={() => setExpType(tObj.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                          expType === tObj.id
                            ? 'bg-bridal-rose text-white border-bridal-rose shadow-xs'
                            : 'bg-bridal-cream text-bridal-charcoal border-bridal-border hover:border-bridal-rose'
                        }`}
                      >
                        {tObj.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Item Details with Live Historical Lookup */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-bridal-charcoal">
                    بيان البند بالتفصيل *
                  </label>
                  <input
                    type="text"
                    required
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder="مثال: شكاير أسمنت لافارج 42.5 / نقلة رمل حرش / لفة سلك 2 مم السويدي"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-sm font-bold text-bridal-charcoal outline-none focus:border-bridal-rose"
                  />

                  {/* Previous Historical Price Comparison Box */}
                  {historicalMatch && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-bridal-goldLight/70 border border-bridal-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-bridal-charcoal flex items-center gap-1">
                          <span>🔍 اشتريت هذا البند سابقاً ({historicalMatch.count} مرات):</span>
                        </span>
                        <p className="text-bridal-mauve">
                          آخر شراء كان بتاريخ <strong>{historicalMatch.date || 'سابق'}</strong> بسعر مفرد:{' '}
                          <strong className="text-bridal-roseDark">
                            {formatCurrency(historicalMatch.effectiveUnitPrice, 'ar')} ج.م
                          </strong>
                          {historicalMatch.supplierName && ` من ${historicalMatch.supplierName}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {expUnitPrice && Number(expUnitPrice) > 0 && (
                          <span
                            className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] ${
                              Number(expUnitPrice) > historicalMatch.effectiveUnitPrice
                                ? 'bg-red-100 text-red-700'
                                : Number(expUnitPrice) < historicalMatch.effectiveUnitPrice
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-bridal-cream text-bridal-charcoal'
                            }`}
                          >
                            {Number(expUnitPrice) > historicalMatch.effectiveUnitPrice
                              ? `أعلى بـ +${Number(expUnitPrice) - historicalMatch.effectiveUnitPrice} ج.م`
                              : Number(expUnitPrice) < historicalMatch.effectiveUnitPrice
                              ? `أرخص بـ -${historicalMatch.effectiveUnitPrice - Number(expUnitPrice)} ج.م`
                              : 'نفس السعر السابق ✓'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setExpUnitPrice(String(historicalMatch.effectiveUnitPrice));
                            const qty = extractQuantityNumber(expQty) || 1;
                            setExpAmount(String(Math.round(qty * historicalMatch.effectiveUnitPrice)));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-bridal-surface hover:bg-bridal-roseLight text-bridal-roseDark border border-bridal-rose/40 font-extrabold text-[11px]"
                        >
                          تعبئة نفس السعر السابق
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* 3 Price & Quantity Inputs with 2-Way Calculation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-bridal-cream/60 border border-bridal-border">
                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      الكمية / العدد *
                    </label>
                    <input
                      type="text"
                      value={expQty}
                      onChange={(e) => handleQtyInputChange(e.target.value)}
                      placeholder="مثال: 20 أو 20 شكارة"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border text-sm font-extrabold text-center text-bridal-charcoal outline-none focus:border-bridal-rose"
                    />
                    <span className="text-[10px] text-bridal-mauve mt-0.5 block">
                      اكتب العدد فقط أو مع الوصف
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      سعر المفرد / الوحدة (ج.م) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={expUnitPrice}
                      onChange={(e) => handleUnitPriceInputChange(e.target.value)}
                      placeholder="مثال: 250"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border text-sm font-extrabold text-center text-bridal-charcoal outline-none focus:border-bridal-rose"
                    />
                    <span className="text-[10px] text-bridal-mauve mt-0.5 block">
                      سعر الشكارة أو المتر أو القطعة
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      الإجمالي المصروف (ج.م) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={expAmount}
                      onChange={(e) => handleAmountInputChange(e.target.value)}
                      placeholder="مثال: 5000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border-2 border-bridal-rose/60 text-sm font-black text-center text-bridal-roseDark outline-none focus:border-bridal-rose"
                    />
                    <span className="text-[10px] text-bridal-roseDark font-bold mt-0.5 block">
                      يحسب تلقائياً = العدد × سعر المفرد
                    </span>
                  </div>
                </div>

                {/* AI Market Advisor Live Feedback Badge */}
                {liveAiEval.isMatched && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      liveAiEval.status === 'good'
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : liveAiEval.status === 'high' || liveAiEval.status === 'alert_high'
                        ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                        : 'bg-bridal-cream border-bridal-border text-bridal-charcoal'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-bridal-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold">{liveAiEval.badgeText}</div>
                      <p className="mt-0.5 leading-relaxed">{liveAiEval.tipText}</p>
                    </div>
                  </div>
                )}

                {/* Supplier & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      اسم المورد / الصنايعي / المغلق
                    </label>
                    <input
                      type="text"
                      value={expSupplier}
                      onChange={(e) => setExpSupplier(e.target.value)}
                      placeholder="مثال: مغلق الحاج سعيد / المعلم حسن"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      التاريخ
                    </label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                    ملاحظات إضافية
                  </label>
                  <input
                    type="text"
                    value={expNotes}
                    onChange={(e) => setExpNotes(e.target.value)}
                    placeholder="أي تفاصيل عن الفاتورة أو التشوين أو التسليم..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                  />
                </div>

                {/* Invoice Photos Upload */}
                <div className="p-3.5 rounded-2xl bg-bridal-cream/60 border border-bridal-border space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-bridal-charcoal flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-bridal-rose" />
                      <span>صور الفواتير أو البضاعة في الموقع ({expImages.length})</span>
                    </span>
                    <input
                      ref={expFileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handlePhotoSelect(e, 'expense')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => expFileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bridal-surface hover:bg-bridal-roseLight text-bridal-roseDark border border-bridal-rose/40 text-xs font-extrabold transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>إرفاق صور الفاتورة 📸</span>
                    </button>
                  </div>

                  {expImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {expImages.map((img, i) => (
                        <div
                          key={img.id || i}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-bridal-border group"
                        >
                          <img src={img.dataUrl} alt="فاتورة" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setExpImages((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-bridal-border">
                  <button
                    type="button"
                    onClick={resetExpenseForm}
                    className="px-4 py-2.5 rounded-xl bg-bridal-cream text-bridal-mauve text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white text-xs sm:text-sm font-extrabold shadow-bridal"
                  >
                    {editingExpenseId ? 'حفظ التعديلات ✓' : 'حفظ البند وخصمه من العهدة ✓'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-bridal-surface border border-bridal-border w-full">
              <Search className="w-4 h-4 text-bridal-mauve" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث في بنود التشطيب (رمل، طوب، أسمنت، سلك، ونش، مورد...)"
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-bridal-charcoal outline-none placeholder:text-bridal-mauve/70"
              />
            </div>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-bridal-surface border border-bridal-border text-xs font-bold text-bridal-charcoal outline-none w-full sm:w-auto"
            >
              <option value="all">كل أنواع الخامات ({expenses.length})</option>
              {FINISHING_ITEM_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-10 text-center space-y-3">
              <Wrench className="w-10 h-10 text-bridal-rose mx-auto opacity-80" />
              <h4 className="text-base font-extrabold text-bridal-charcoal">
                لا توجد بنود تشطيب أو فواتير مسجلة حتى الآن
              </h4>
              <p className="text-xs text-bridal-mauve max-w-md mx-auto">
                اضغط على «إضافة بند فردي» أو «فاتورة مجمعة بالـ AI» لتسجيل مشتريات الرمل والأسمنت والطوب والكهرباء والسباكة.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((ex) => {
                const imgs = Array.isArray(ex.invoiceImages) ? ex.invoiceImages : [];
                const effectiveUnitPrice = ex.effectiveUnitPrice || 0;
                const aiEval = evaluateMarketPrice(ex.title, ex.itemType, effectiveUnitPrice);

                return (
                  <div
                    key={ex.id}
                    className="bg-bridal-surface rounded-2xl border border-bridal-border p-4 shadow-bridal flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-bridal-rose/40 transition"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-bridal-roseLight text-bridal-roseDark text-[11px] font-extrabold">
                          {ex.itemType || 'تشطيب'}
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-bridal-charcoal">
                          {ex.title}
                        </h4>
                        {ex.quantityText && (
                          <span className="px-2 py-0.5 rounded-lg bg-bridal-cream text-bridal-charcoal text-[11px] font-bold border border-bridal-border">
                            العدد: {ex.quantityText}
                          </span>
                        )}
                        {effectiveUnitPrice > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-bridal-goldLight text-bridal-charcoal text-[11px] font-extrabold border border-bridal-gold/40">
                            سعر المفرد: {formatCurrency(effectiveUnitPrice, 'ar')} ج.م
                          </span>
                        )}
                        {aiEval.isMatched && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              aiEval.status === 'good'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : aiEval.status === 'high' || aiEval.status === 'alert_high'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-bridal-cream text-bridal-mauve border-bridal-border'
                            }`}
                          >
                            {aiEval.badgeText}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-bridal-mauve font-medium">
                        {ex.date && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{ex.date}</span>
                          </span>
                        )}
                        {ex.supplierName && <span>• المورد: {ex.supplierName}</span>}
                        {ex.notes && <span>• {ex.notes}</span>}
                      </div>

                      {/* Invoice Thumbnails */}
                      {imgs.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {imgs.map((img, idx) => (
                            <button
                              key={img.id || idx}
                              type="button"
                              onClick={() =>
                                onOpenLightbox &&
                                onOpenLightbox(imgs, idx, `فاتورة: ${ex.title}`)
                              }
                              className="w-13 h-13 rounded-xl overflow-hidden border-2 border-bridal-gold shadow-xs hover:scale-105 transition"
                            >
                              <img
                                src={img.dataUrl}
                                alt={ex.title}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-bridal-border/60">
                      <div className="text-left sm:text-right space-y-0.5">
                        <div className="text-lg font-black text-bridal-roseDark">
                          {formatCurrency(ex.amount, 'ar')}{' '}
                          <span className="text-xs font-bold text-bridal-mauve">ج.م</span>
                        </div>
                      </div>

                      {!isReadOnly && (
                        <div className="flex items-center gap-1.5">
                          <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-bridal-cream hover:bg-bridal-roseLight text-bridal-charcoal text-[11px] font-bold border border-bridal-border transition">
                            <Camera className="w-3.5 h-3.5 text-bridal-rose" />
                            <span>فاتورة</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) =>
                                handleQuickAttachExpensePhotos(ex.id, e.target.files)
                              }
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleEditExpense(ex)}
                            className="p-1.5 rounded-xl text-bridal-mauve hover:text-bridal-rose hover:bg-bridal-cream transition"
                            title="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(ex.id)}
                            className="p-1.5 rounded-xl text-bridal-mauve hover:text-red-500 hover:bg-red-50 transition"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: CUSTODY ADVANCES
          ========================================================================= */}
      {subTab === 'advances' && (
        <div className="space-y-4">
          <AnimatePresence>
            {showAdvanceForm && !isReadOnly && (
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSaveAdvance}
                className="bg-bridal-surface rounded-3xl border-2 border-bridal-rose/50 p-5 shadow-bridal-lg space-y-4"
              >
                <div className="flex items-center justify-between border-b border-bridal-border pb-3">
                  <h3 className="text-base font-extrabold text-bridal-charcoal">
                    {editingAdvanceId ? '✏️ تعديل دفعة العهدة' : '💵 تسجيل دفعة عهدة جديدة مسلمة للمهندس'}
                  </h3>
                  <button
                    type="button"
                    onClick={resetAdvanceForm}
                    className="text-xs font-bold text-bridal-mauve hover:text-bridal-charcoal"
                  >
                    إلغاء ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      مبلغ الدفعة (ج.م) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={advAmount}
                      onChange={(e) => setAdvAmount(e.target.value)}
                      placeholder="مثال: 50000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-sm font-extrabold text-bridal-charcoal outline-none focus:border-bridal-rose"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      بيان الدفعة
                    </label>
                    <input
                      type="text"
                      value={advTitle}
                      onChange={(e) => setAdvTitle(e.target.value)}
                      placeholder="مثال: دفعة تشوين محارة / دفعة سباكة"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      طريقة الدفع / التحويل
                    </label>
                    <select
                      value={advMethod}
                      onChange={(e) => setAdvMethod(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">التاريخ</label>
                    <input
                      type="date"
                      value={advDate}
                      onChange={(e) => setAdvDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">ملاحظات</label>
                    <input
                      type="text"
                      value={advNotes}
                      onChange={(e) => setAdvNotes(e.target.value)}
                      placeholder="رقم العملية أو اسم المستلم..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-bridal-border">
                  <button
                    type="button"
                    onClick={resetAdvanceForm}
                    className="px-4 py-2.5 rounded-xl bg-bridal-cream text-bridal-mauve text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-bridal-sage text-white text-xs sm:text-sm font-extrabold shadow-xs"
                  >
                    حفظ الدفعة في العهدة ✓
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Advances Cards */}
          {advances.length === 0 ? (
            <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-10 text-center space-y-3">
              <Wallet className="w-10 h-10 text-bridal-sage mx-auto opacity-80" />
              <h4 className="text-base font-extrabold text-bridal-charcoal">
                لم تسجل أي دفعات عهدة مسلمة للمهندس بعد
              </h4>
              <p className="text-xs text-bridal-mauve max-w-md mx-auto">
                سجل المبالغ النقدية أو تحويلات إنستاباي والبنك التي تسلمها للمهندس للإنفاق منها على الشقة.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {advances.map((adv) => (
                <div
                  key={adv.id}
                  className="bg-bridal-surface rounded-2xl border border-bridal-border p-4 shadow-bridal flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-bridal-sage" />
                      <h4 className="text-sm sm:text-base font-extrabold text-bridal-charcoal">
                        {adv.title}
                      </h4>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-bridal-cream text-bridal-charcoal border border-bridal-border">
                        {adv.paymentMethod}
                      </span>
                    </div>
                    <div className="text-xs text-bridal-mauve flex items-center gap-2">
                      <span>{adv.date}</span>
                      {adv.notes && <span>• {adv.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-black text-bridal-sageDark">
                        {formatCurrency(adv.amount, 'ar')}
                      </span>
                      <span className="text-xs font-bold text-bridal-mauve mr-1">ج.م</span>
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditAdvance(adv)}
                          className="p-1.5 rounded-xl text-bridal-mauve hover:text-bridal-rose transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdvance(adv.id)}
                          className="p-1.5 rounded-xl text-bridal-mauve hover:text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: PRICE HIKE & MATERIAL TRENDS ANALYTICS
          ========================================================================= */}
      {subTab === 'analytics' && (
        <FinishingPriceAnalytics expenses={expenses} />
      )}

      {/* =========================================================================
          TAB 4: BEGINNER'S APARTMENT FINISHING GUIDE
          ========================================================================= */}
      {subTab === 'guide' && (
        <FinishingGuideView settings={settings} onUpdateSettings={onUpdateSettings} />
      )}

      {/* Batch Invoice AI Scanner Modal */}
      <BatchInvoiceModal
        isOpen={isBatchInvoiceOpen}
        onClose={() => setIsBatchInvoiceOpen(false)}
        onSaveBatchExpenses={handleSaveBatchExpenses}
      />
    </div>
  );
}
