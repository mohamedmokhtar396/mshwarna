import React, { useState, useRef } from 'react';
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
  Printer
} from 'lucide-react';
import {
  formatCurrency,
  parseArabicNumber,
  DEFAULT_FINISHING_LEDGER,
  createEngineerLedgerShareLink
} from '../db';
import { compressMultipleImages } from '../utils/imageUtils';

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
  const expenses = Array.isArray(ledger.expenses) ? ledger.expenses : [];

  // Active sub-tab: 'expenses' | 'advances'
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
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expSupplier, setExpSupplier] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [expImages, setExpImages] = useState([]);
  const expFileRef = useRef(null);

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

  // Save Expense
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const amountNum = parseArabicNumber(expAmount);
    if (!expTitle.trim() && !expType) return;

    const record = {
      id: editingExpenseId || `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemType: expType,
      title: expTitle.trim() || expType,
      quantityText: expQty.trim(),
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

  const resetExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpenseId(null);
    setExpType('رمل');
    setExpTitle('');
    setExpQty('');
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

  const handleSendWhatsAppToEngineer = async () => {
    let urlToUse = shareUrl;
    if (!urlToUse) {
      setSharingLoading(true);
      try {
        const result = await createEngineerLedgerShareLink({
          ledger,
          ownerName: settings?.brideName || 'صاحب الشقة'
        });
        urlToUse = result.shareUrl;
        setShareUrl(urlToUse);
      } catch (err) {
        console.warn(err);
      } finally {
        setSharingLoading(false);
      }
    }

    const balanceStatus =
      netBalance >= 0
        ? `المتبقي في العهدة: ${formatCurrency(netBalance, 'ar')} ج.م`
        : `مستحق للمهندس: ${formatCurrency(Math.abs(netBalance), 'ar')} ج.م`;

    const msg = `👷‍♂️ أهلاً يا باشمهندس ${
      ledger.engineerName || ''
    }، ده رابط كشف حساب عهدة ومصروفات وفواتير (${
      ledger.apartmentTitle || 'تشطيب الشقة'
    }) محدث بالدفعات والفواتير:\n• إجمالي الدفعات المسلمة: ${formatCurrency(
      totalAdvances,
      'ar'
    )} ج.م\n• إجمالي المصروفات بالفواتير: ${formatCurrency(
      totalSpentWithFee,
      'ar'
    )} ج.م\n• ${balanceStatus}\n\nالرابط المباشر للمراجعة:\n${urlToUse}`;

    const cleanPhone = String(ledger.engineerPhone || '').replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('01') ? `2${cleanPhone}` : cleanPhone;
    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Filtered Expenses
  const filteredExpenses = expenses.filter((ex) => {
    if (selectedTypeFilter !== 'all' && ex.itemType !== selectedTypeFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        (ex.title || '').toLowerCase().includes(q) ||
        (ex.itemType || '').toLowerCase().includes(q) ||
        (ex.supplierName || '').toLowerCase().includes(q) ||
        (ex.notes || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Group totals by itemType for quick breakdown
  const breakdownByType = FINISHING_ITEM_TYPES.map((tObj) => {
    const typeItems = expenses.filter((e) => e.itemType === tObj.id);
    const sum = typeItems.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    return {
      ...tObj,
      count: typeItems.length,
      total: sum
    };
  }).filter((b) => b.count > 0);

  return (
    <div dir="rtl" className="space-y-6 pb-12">
      {/* 1. Top Hero Header: Engineer Profile & Share Toolbar */}
      <div className="bg-gradient-to-l from-bridal-roseLight/70 via-bridal-surface to-bridal-cream rounded-3xl border border-bridal-border p-5 sm:p-7 shadow-bridal">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bridal-roseLight text-bridal-roseDark text-xs font-extrabold border border-bridal-rose/30">
              <Wrench className="w-3.5 h-3.5" />
              <span>دفتر عهدة المهندس ومصروفات التشطيب والفواتير 👷‍♂️🧱</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-bridal-charcoal">
              {ledger.apartmentTitle || 'تشطيب شقة الزوجية'}
              {ledger.engineerName ? ` — م. ${ledger.engineerName}` : ''}
            </h2>
            <p className="text-xs sm:text-sm text-bridal-mauve max-w-2xl leading-relaxed">
              سجّل كل دفعة تسلمها للمهندس كعُهدة، وصوّر فواتير الرمل والطوب والأسمنت والونش والتشوين والمصنعيات ليحسب التطبيق تلقائياً الرصيد المتبقي في العهدة لحظة بلحظة.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setEngName(ledger.engineerName || '');
                    setEngPhone(ledger.engineerPhone || '');
                    setAptTitle(ledger.apartmentTitle || 'تشطيب شقة الزوجية');
                    setSupFee(String(ledger.supervisionFeePercent || 0));
                    setIsEditingEngineer(!isEditingEngineer);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-surface hover:bg-bridal-cream text-bridal-charcoal border border-bridal-border text-xs font-extrabold transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-bridal-rose" />
                  <span>
                    {ledger.engineerName
                      ? 'تعديل بيانات المهندس ونسبة الإشراف'
                      : 'إضافة اسم ورقم المهندس المشرف 👷‍♂️'}
                  </span>
                </button>
              )}

              {ledger.engineerPhone && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bridal-cream text-bridal-charcoal border border-bridal-border text-xs font-bold">
                  <Phone className="w-3.5 h-3.5 text-bridal-rose" />
                  <span dir="ltr">{ledger.engineerPhone}</span>
                </span>
              )}

              {supervisionFeePercent > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-bridal-goldLight text-bridal-gold border border-bridal-gold/40 text-xs font-extrabold">
                  <Percent className="w-3.5 h-3.5" />
                  <span>نسبة الإشراف: {supervisionFeePercent}%</span>
                </span>
              )}
            </div>
          </div>

          {/* Share with Engineer Action Box */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 flex-shrink-0">
            <button
              type="button"
              disabled={sharingLoading}
              onClick={handleGenerateEngineerLink}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white text-xs sm:text-sm font-extrabold shadow-bridal hover:opacity-95 transition"
            >
              {copiedShare ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>
                {sharingLoading
                  ? 'جاري تجهيز رابط المهندس...'
                  : copiedShare
                  ? 'تم نسخ رابط كشف الحساب للمهندس! ✓'
                  : 'نسخ رابط كشف الحساب لمشاركته مع المهندس 🔗'}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendWhatsAppToEngineer}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-sage text-white text-xs font-extrabold hover:opacity-95 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال واتساب للمهندس 💬</span>
              </button>

              {onPreviewEngineerView && (
                <button
                  type="button"
                  onClick={() =>
                    onPreviewEngineerView({
                      ...ledger,
                      ownerName: settings?.brideName || 'صاحب الشقة'
                    })
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-surface hover:bg-bridal-cream text-bridal-charcoal border border-bridal-border text-xs font-extrabold transition"
                >
                  <Eye className="w-4 h-4 text-bridal-rose" />
                  <span>معاينة كشف المهندس</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Engineer Profile Form */}
        <AnimatePresence>
          {isEditingEngineer && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveEngineerInfo}
              className="mt-4 pt-4 border-t border-bridal-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <div>
                <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                  اسم المهندس / المقاول
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-bridal-rose absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={engName}
                    onChange={(e) => setEngName(e.target.value)}
                    placeholder="مثال: م. أحمد محمود"
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-xs font-bold text-bridal-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                  رقم موبايل المهندس (للواتساب)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-bridal-rose absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    dir="ltr"
                    value={engPhone}
                    onChange={(e) => setEngPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-xs font-bold text-bridal-charcoal text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                  عنوان / اسم مشروع التشطيب
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-bridal-rose absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={aptTitle}
                    onChange={(e) => setAptTitle(e.target.value)}
                    placeholder="تشطيب شقة الزوجية"
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-xs font-bold text-bridal-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                  نسبة الإشراف الهندسي % (اختياري)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={supFee}
                    onChange={(e) => setSupFee(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-xs font-bold text-bridal-charcoal"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-bridal-rose text-white text-xs font-extrabold flex-shrink-0"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Custody Summary KPI Cards (العهدة، المنصرف، المتبقي) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Advances Given */}
        <div className="bg-bridal-surface rounded-2xl border border-bridal-border p-5 shadow-bridal flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-bridal-mauve">
                إجمالي الدفعات المسلمة للمهندس (العُهدة)
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-extrabold text-bridal-charcoal">
                  {formatCurrency(totalAdvances, 'ar')}
                </span>
                <span className="text-xs font-bold text-bridal-mauve">ج.م</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-bridal-roseLight flex items-center justify-center text-bridal-roseDark">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-bridal-border/70 flex items-center justify-between text-xs">
            <span className="text-bridal-mauve">عدد الدفعات المسلمة:</span>
            <span className="font-extrabold text-bridal-charcoal">{advances.length} دفعة</span>
          </div>
        </div>

        {/* Total Spent by Engineer */}
        <div className="bg-bridal-surface rounded-2xl border border-bridal-border p-5 shadow-bridal flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-bridal-mauve">
                إجمالي المنصرف الفعلي بالفواتير
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-extrabold text-bridal-roseDark">
                  {formatCurrency(totalSpentWithFee, 'ar')}
                </span>
                <span className="text-xs font-bold text-bridal-mauve">ج.م</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-bridal-goldLight flex items-center justify-center text-bridal-gold">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-bridal-border/70 flex items-center justify-between text-xs">
            <span className="text-bridal-mauve">
              {supervisionFeeAmount > 0
                ? `بنود: ${formatCurrency(totalExpenses, 'ar')} + إشراف: ${formatCurrency(
                    supervisionFeeAmount,
                    'ar'
                  )}`
                : 'إجمالي بنود وفواتير التشطيب:'}
            </span>
            <span className="font-extrabold text-bridal-charcoal">{expenses.length} فاتورة/بند</span>
          </div>
        </div>

        {/* Net Custody Balance */}
        <div
          className={`rounded-2xl border p-5 shadow-bridal flex flex-col justify-between ${
            netBalance >= 0
              ? 'bg-bridal-sageLight/40 border-bridal-sage/50'
              : 'bg-red-500/10 border-red-400/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-extrabold text-bridal-charcoal">
                {netBalance >= 0
                  ? 'الرصيد المتبقي في عهدة المهندس'
                  : 'مبلغ مستحق للمهندس (صرف زيادة عن العهدة)'}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span
                  className={`text-2xl font-extrabold ${
                    netBalance >= 0 ? 'text-bridal-sageDark' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(Math.abs(netBalance), 'ar')}
                </span>
                <span className="text-xs font-bold text-bridal-mauve">ج.م</span>
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                netBalance >= 0
                  ? 'bg-bridal-sage text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {netBalance >= 0 ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-bridal-border/60 text-xs font-bold">
            {netBalance > 0 ? (
              <span className="text-bridal-sageDark">
                ✅ المهندس معه رصيد متبقٍ من العهدة يغطي المصروفات القادمة
              </span>
            ) : netBalance < 0 ? (
              <span className="text-red-600">
                ⚠️ المهندس صرف فواتير أكثر من العهدة المسلمة له بهذا المبلغ
              </span>
            ) : (
              <span className="text-bridal-charcoal">
                تمت تصفية العهدة بالكامل (الرصيد 0 ج.م)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Category Summary Pills (رمل، طوب، أسمنت، ونش...) */}
      {breakdownByType.length > 0 && (
        <div className="bg-bridal-surface rounded-2xl border border-bridal-border p-4 shadow-xs">
          <div className="text-xs font-extrabold text-bridal-charcoal mb-2.5">
            📊 ملخص ما تم صرفه حسب نوع البند (اضغط للفلترة):
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                selectedTypeFilter === 'all'
                  ? 'bg-bridal-rose text-white border-bridal-rose'
                  : 'bg-bridal-cream text-bridal-charcoal border-bridal-border'
              }`}
            >
              الكل ({expenses.length})
            </button>
            {breakdownByType.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() =>
                  setSelectedTypeFilter(selectedTypeFilter === b.id ? 'all' : b.id)
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 ${
                  selectedTypeFilter === b.id
                    ? 'bg-bridal-rose text-white border-bridal-rose'
                    : 'bg-bridal-cream/70 text-bridal-charcoal border-bridal-border hover:border-bridal-rose'
                }`}
              >
                <span>{b.label}</span>
                <span className="opacity-80">({formatCurrency(b.total, 'ar')} ج.م)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Sub-Navigation Tabs: Expenses & Invoices vs Custody Advances */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bridal-border pb-3">
        <div className="inline-flex p-1 rounded-2xl bg-bridal-surface border border-bridal-border">
          <button
            type="button"
            onClick={() => setSubTab('expenses')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
              subTab === 'expenses'
                ? 'bg-bridal-rose text-white shadow-bridal'
                : 'text-bridal-mauve hover:text-bridal-charcoal'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>مصروفات وبنود التشطيب والفواتير ({expenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('advances')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
              subTab === 'advances'
                ? 'bg-bridal-rose text-white shadow-bridal'
                : 'text-bridal-mauve hover:text-bridal-charcoal'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>دفعات العُهدة المسلمة للمهندس ({advances.length})</span>
          </button>
        </div>

        {/* Action Buttons to Open Add Forms */}
        {!isReadOnly && (
          <div className="flex items-center gap-2">
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
              <span>تسجيل دفعة عهدة للمهندس 💰</span>
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
              <span>إضافة بند تشطيب / فاتورة (رمل، طوب، أسمنت، ونش...) 🧱</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: EXPENSES & INVOICES */}
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
                      : '🧱 تسجيل بند مصروفات تشطيب جديد (خصماً من عهدة المهندس)'}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      بيان البند بالتفصيل *
                    </label>
                    <input
                      type="text"
                      required
                      value={expTitle}
                      onChange={(e) => setExpTitle(e.target.value)}
                      placeholder="مثال: 2 نقلة رمل + 15 شكارة أسمنت + ونش رفع وتشوين للدور الرابع"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-sm font-bold text-bridal-charcoal outline-none focus:border-bridal-rose"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      المبلغ المصروف (ج.م) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      placeholder="مثال: 6500"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-sm font-extrabold text-bridal-charcoal outline-none focus:border-bridal-rose"
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      الكمية / العدد (اختياري)
                    </label>
                    <input
                      type="text"
                      value={expQty}
                      onChange={(e) => setExpQty(e.target.value)}
                      placeholder="مثال: 20 شكارة / 3000 طوبة / نقلة ونش"
                      className="w-full px-3.5 py-2 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      اسم المورد / الصنايعي (اختياري)
                    </label>
                    <input
                      type="text"
                      value={expSupplier}
                      onChange={(e) => setExpSupplier(e.target.value)}
                      placeholder="مثال: مغلق الحاج سعيد / المعلم حسن"
                      className="w-full px-3.5 py-2 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      ملاحظات إضافية
                    </label>
                    <input
                      type="text"
                      value={expNotes}
                      onChange={(e) => setExpNotes(e.target.value)}
                      placeholder="أي تفاصيل عن الفاتورة أو التسليم..."
                      className="w-full px-3.5 py-2 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>
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
                      <span>إرفاق صور الفاتورة / المون 📸</span>
                    </button>
                  </div>

                  {expImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {expImages.map((img, i) => (
                        <div
                          key={img.id || i}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-bridal-border group"
                        >
                          <img
                            src={img.dataUrl}
                            alt="فاتورة"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setExpImages((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
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

          {/* Search Bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-bridal-surface border border-bridal-border">
            <Search className="w-4 h-4 text-bridal-mauve" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث في بنود التشطيب (رمل، طوب، أسمنت، ونش، اسم المورد...)"
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-bridal-charcoal outline-none"
            />
          </div>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-10 text-center space-y-3">
              <Wrench className="w-10 h-10 text-bridal-rose mx-auto opacity-80" />
              <h4 className="text-base font-extrabold text-bridal-charcoal">
                لا توجد بنود تشطيب أو فواتير مسجلة حتى الآن
              </h4>
              <p className="text-xs text-bridal-mauve max-w-md mx-auto">
                اضغط على «إضافة بند تشطيب / فاتورة» لتسجيل بنود الرمل والطوب والأسمنت والونش والتشوين والسباكة والكهرباء وإرفاق صور الفواتير.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((ex, index) => {
                const imgs = Array.isArray(ex.invoiceImages) ? ex.invoiceImages : [];
                return (
                  <div
                    key={ex.id}
                    className="bg-bridal-surface rounded-2xl border border-bridal-border p-4 shadow-bridal flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-bridal-roseLight text-bridal-roseDark text-[11px] font-extrabold">
                          {ex.itemType || 'تشطيب'}
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-bridal-charcoal">
                          {ex.title}
                        </h4>
                        {ex.quantityText && (
                          <span className="px-2 py-0.5 rounded-lg bg-bridal-cream text-bridal-charcoal text-[11px] font-bold border border-bridal-border">
                            الكمية: {ex.quantityText}
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
                        {ex.supplierName && (
                          <span>• المورد/الصنايعي: {ex.supplierName}</span>
                        )}
                        {ex.notes && <span>• {ex.notes}</span>}
                      </div>

                      {/* Invoice Thumbnails */}
                      {imgs.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1.5">
                          {imgs.map((img, idx) => (
                            <button
                              key={img.id || idx}
                              type="button"
                              onClick={() =>
                                onOpenLightbox &&
                                onOpenLightbox(imgs, idx, `فاتورة: ${ex.title}`)
                              }
                              className="w-14 h-14 rounded-xl overflow-hidden border-2 border-bridal-gold shadow-xs hover:scale-105 transition"
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
                      <div className="text-left sm:text-right">
                        <span className="text-lg font-extrabold text-bridal-roseDark">
                          {formatCurrency(ex.amount, 'ar')}
                        </span>
                        <span className="text-xs font-bold text-bridal-mauve mr-1">
                          ج.م
                        </span>
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
                            className="p-1.5 rounded-xl bg-bridal-cream hover:bg-bridal-roseLight text-bridal-charcoal border border-bridal-border"
                            title="تعديل"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(ex.id)}
                            className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-400/30"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB 2: CUSTODY ADVANCES GIVEN TO ENGINEER */}
      {subTab === 'advances' && (
        <div className="space-y-4">
          <AnimatePresence>
            {showAdvanceForm && !isReadOnly && (
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSaveAdvance}
                className="bg-bridal-surface rounded-3xl border-2 border-bridal-sage/60 p-5 shadow-bridal-lg space-y-4"
              >
                <div className="flex items-center justify-between border-b border-bridal-border pb-3">
                  <h3 className="text-base font-extrabold text-bridal-charcoal">
                    {editingAdvanceId
                      ? '✏️ تعديل دفعة عهدة'
                      : '💰 تسجيل دفعة مالية جديدة مسلمة للمهندس كعُهدة'}
                  </h3>
                  <button
                    type="button"
                    onClick={resetAdvanceForm}
                    className="text-xs font-bold text-bridal-mauve hover:text-bridal-charcoal"
                  >
                    إلغاء ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      المبلغ المسلم للمهندس (ج.م) *
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
                      طريقة الدفع / التحويل
                    </label>
                    <select
                      value={advMethod}
                      onChange={(e) => setAdvMethod(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                      تاريخ الدفعة
                    </label>
                    <input
                      type="date"
                      value={advDate}
                      onChange={(e) => setAdvDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
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
                      placeholder="مثال: الدفعة الأولى لتشوين الرمل والطوب"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>
                </div>

                {/* Receipt Image Upload */}
                <div className="p-3.5 rounded-2xl bg-bridal-cream/60 border border-bridal-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-bridal-sageDark" />
                    <span className="text-xs font-bold text-bridal-charcoal">
                      إرفاق صورة إيصال التحويل (إنستاباي / بنك / إيصال استلام) ({advImages.length})
                    </span>
                  </div>
                  <input
                    ref={advFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePhotoSelect(e, 'advance')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => advFileRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-bridal-surface border border-bridal-border text-xs font-extrabold text-bridal-charcoal"
                  >
                    إرفاق صورة الإيصال 📸
                  </button>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetAdvanceForm}
                    className="px-4 py-2 rounded-xl bg-bridal-cream text-bridal-mauve text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-bridal-sage text-white text-xs sm:text-sm font-extrabold shadow-xs"
                  >
                    {editingAdvanceId ? 'حفظ تعديل الدفعة ✓' : 'إضافة الدفعة لرصيد العهدة ✓'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {advances.length === 0 ? (
            <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-10 text-center space-y-3">
              <Wallet className="w-10 h-10 text-bridal-sage mx-auto opacity-80" />
              <h4 className="text-base font-extrabold text-bridal-charcoal">
                لم يتم تسجيل دفعات عُهدة مسلمة للمهندس بعد
              </h4>
              <p className="text-xs text-bridal-mauve max-w-md mx-auto">
                اضغط على «تسجيل دفعة عهدة للمهندس 💰» لإضافة المبالغ التي سلمتها للمهندس نقداً أو عبر إنستاباي ليتم خصم فواتير التشطيب منها تلقائياً.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {advances.map((adv, idx) => {
                const imgs = Array.isArray(adv.receiptImages) ? adv.receiptImages : [];
                return (
                  <div
                    key={adv.id}
                    className="bg-bridal-surface rounded-2xl border border-bridal-border p-4 shadow-bridal flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-bridal-sageLight text-bridal-sageDark text-[11px] font-extrabold">
                          دفعة عهدة #{advances.length - idx}
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-bridal-charcoal">
                          {adv.title || 'دفعة تحت حساب التشطيب'}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-lg bg-bridal-cream text-bridal-charcoal text-[11px] font-bold border border-bridal-border">
                          {adv.paymentMethod}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-bridal-mauve">
                        <span>📅 {adv.date}</span>
                        {adv.notes && <span>• {adv.notes}</span>}
                      </div>

                      {imgs.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {imgs.map((img, i) => (
                            <button
                              key={img.id || i}
                              type="button"
                              onClick={() =>
                                onOpenLightbox &&
                                onOpenLightbox(imgs, i, `إيصال دفعة: ${adv.title}`)
                              }
                              className="w-14 h-14 rounded-xl overflow-hidden border-2 border-bridal-sage shadow-xs"
                            >
                              <img
                                src={img.dataUrl}
                                alt="إيصال"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <div>
                        <span className="text-lg font-extrabold text-bridal-sageDark">
                          +{formatCurrency(adv.amount, 'ar')}
                        </span>
                        <span className="text-xs font-bold text-bridal-mauve mr-1">
                          ج.م
                        </span>
                      </div>

                      {!isReadOnly && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditAdvance(adv)}
                            className="p-1.5 rounded-xl bg-bridal-cream hover:bg-bridal-roseLight text-bridal-charcoal border border-bridal-border"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAdvance(adv.id)}
                            className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-400/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
