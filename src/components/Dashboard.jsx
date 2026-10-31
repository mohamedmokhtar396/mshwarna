import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Check,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Heart,
  Calendar,
  Share2,
  Download,
  Link2,
  Wrench,
  Users,
  FileText,
  Calculator,
  Bell
} from 'lucide-react';
import {
  formatCurrency,
  parseArabicNumber,
  switchAccountGenderAndTemplate
} from '../db';
import { CategoryIcon } from '../utils/categoryIcons';
import { translations, getLocalizedCategory, getLocalizedItem } from '../i18n';

export default function Dashboard({
  lang = 'ar',
  categories,
  items,
  settings,
  onUpdateSettings,
  onSelectCategory,
  onOpenNewCategory,
  onOpenShoppingMode,
  onOpenShareFiance,
  onOpenShareShowcase,
  onOpenFinishingLedger,
  onOpenCoupleRoom,
  onOpenPrintQayma,
  onOpenSmartBudget,
  onEditItem,
  onTriggerInstall,
  isAppInstalled = false,
  isReadOnly = false,
  showPrices = true
}) {
  const t = translations[lang] || translations.en;
  const isRtl = lang === 'ar';
  const isMale = settings?.gender === 'male';

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(settings?.totalBudget || 300000));
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [brideNameInput, setBrideNameInput] = useState(
    settings?.brideName || (isMale ? 'أحلى عريس' : t.defaultBrideName)
  );
  const [phoneInput, setPhoneInput] = useState(settings?.phoneNumber || '');
  const [weddingDateInput, setWeddingDateInput] = useState(settings?.weddingDate || '');
  const [genderInput, setGenderInput] = useState(settings?.gender || 'female');
  const [loadTemplateOnSwitch, setLoadTemplateOnSwitch] = useState(true);

  // Analytics calculations
  const totalItemsCount = items.length;
  const purchasedItemsCount = items.filter((i) => i.isPurchased).length;
  const priorityRemainingCount = items.filter((i) => i.isPriority && !i.isPurchased).length;
  const overallPercent =
    totalItemsCount > 0 ? Math.round((purchasedItemsCount / totalItemsCount) * 100) : 0;

  // Financial calculations
  const totalActualCost = items.reduce((sum, i) => sum + (Number(i.actualPrice) || 0), 0);
  const totalRemainingInstallments = items.reduce(
    (sum, i) => sum + (Number(i.remainingAmount) || 0),
    0
  );
  const totalCashPaid = items.reduce((sum, i) => {
    const actual = Number(i.actualPrice) || 0;
    const paid = Number(i.paidAmount) || 0;
    const rem = Number(i.remainingAmount) || 0;
    if (rem > 0 || paid > 0) {
      return sum + paid;
    }
    return sum + actual;
  }, 0);

  const totalSpent = Math.max(totalActualCost, totalCashPaid + totalRemainingInstallments);
  const totalBudget = Number(settings?.totalBudget) || 300000;
  const remainingBudget = totalBudget - totalSpent;
  const budgetUsedPercent =
    totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  const itemsWithInstallmentsCount = items.filter(
    (i) => (Number(i.remainingAmount) || 0) > 0
  ).length;

  let daysRemaining = null;
  if (settings?.weddingDate) {
    const diff = new Date(settings.weddingDate).getTime() - new Date().setHours(0, 0, 0, 0);
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Upcoming Installments & Delivery Alerts
  const todayMidnight = new Date().setHours(0, 0, 0, 0);
  const alertsList = [];
  items.forEach((item) => {
    const loc = getLocalizedItem(item, lang);
    if (item.nextInstallmentDate && Number(item.remainingAmount) > 0) {
      const diffDays = Math.ceil(
        (new Date(item.nextInstallmentDate).getTime() - todayMidnight) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 14) {
        alertsList.push({
          id: `inst-${item.id}`,
          type: 'installment',
          item,
          title: loc.displayName,
          date: item.nextInstallmentDate,
          diffDays,
          amount: item.remainingAmount
        });
      }
    }
    if (item.deliveryDate && !item.isPurchased) {
      const diffDays = Math.ceil(
        (new Date(item.deliveryDate).getTime() - todayMidnight) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 14) {
        alertsList.push({
          id: `del-${item.id}`,
          type: 'delivery',
          item,
          title: loc.displayName,
          date: item.deliveryDate,
          diffDays
        });
      }
    }
  });

  // Finishing Ledger Summary for Quick Card
  const finishingLedger = settings?.finishingLedger || {};
  const engAdvances = (finishingLedger.advances || []).reduce(
    (s, a) => s + (Number(a.amount) || 0),
    0
  );
  const engExpenses = (finishingLedger.expenses || []).reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0
  );
  const engNet = engAdvances - engExpenses;

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    const parsed = parseArabicNumber(budgetInput);
    onUpdateSettings({ totalBudget: parsed > 0 ? parsed : 0 });
    setIsEditingBudget(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    const currentGender = settings?.gender || 'female';
    if (genderInput !== currentGender) {
      await switchAccountGenderAndTemplate(genderInput, loadTemplateOnSwitch);
    }
    await onUpdateSettings({
      gender: genderInput,
      brideName:
        brideNameInput.trim() ||
        (genderInput === 'male' ? 'أحلى عريس' : t.defaultBrideName),
      phoneNumber: phoneInput.trim(),
      weddingDate: weddingDateInput
    });
    setIsEditingProfile(false);
  };

  const displayBrideName =
    !settings?.brideName ||
    settings.brideName === 'Lovely Bride' ||
    settings.brideName === 'أحلى عروسة'
      ? isMale
        ? lang === 'ar'
          ? 'أحلى عريس'
          : 'Handsome Groom'
        : t.defaultBrideName
      : settings.brideName;

  // Circular progress geometry
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallPercent / 100) * circumference;

  return (
    <div className="space-y-6 pb-8">
      {/* Mobile App Download Banner (Shown when not installed as standalone app) */}
      {!isAppInstalled && onTriggerInstall && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-l from-bridal-goldLight/70 via-bridal-roseLight/60 to-bridal-surface border border-bridal-gold/50 p-4 sm:p-5 shadow-bridal flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 text-center sm:text-right flex-col sm:flex-row">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-bridal-gold shadow-bridal flex-shrink-0 bg-bridal-surface">
              <img
                src={isMale ? '/groom-icon-192.png' : '/icon-192.png'}
                alt="أيقونة تطبيق م-شوارنا"
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-bridal-charcoal">
                {lang === 'ar'
                  ? isMale
                    ? 'حمّل تطبيق «م-شوارنا» بأيقونة العريس على موبايلك الآن 📲'
                    : 'حمّلي تطبيق «م-شوارنا» بأيقونة العروسة على موبايلك الآن 📲'
                  : 'Download "Meshwarna" App to Your Phone 📲'}
              </h3>
              <p className="text-xs text-bridal-mauve mt-0.5">
                {lang === 'ar'
                  ? isMale
                    ? 'ثبّت التطبيق ببورتريه العريس على شاشة موبايلك الرئيسية ليفتح بضغطة زر ويعمل معك بدون إنترنت!'
                    : 'ثبّتي التطبيق ببورتريه العروسة على شاشة موبايلك الرئيسية ليفتح بضغطة زر ويعمل معكِ بدون إنترنت!'
                  : 'Add the portrait app icon to your phone for instant 1-tap offline access!'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onTriggerInstall(isMale ? 'male' : 'female')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white text-xs sm:text-sm font-extrabold shadow-bridal hover:opacity-95 active:scale-95 transition flex-shrink-0"
          >
            <Download className="w-4 h-4 animate-bounce" />
            <span>
              {lang === 'ar' ? 'تنزيل التطبيق للموبايل 📲' : 'Install Mobile App 📲'}
            </span>
          </button>
        </motion.div>
      )}

      {/* Top Hero Card: Overall Progress & Bride/Groom Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-bridal-roseLight/60 via-bridal-surface to-bridal-cream border border-bridal-border p-5 sm:p-7 shadow-bridal"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Welcome & Overall Linear Progress */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bridal-roseLight text-bridal-roseDark text-xs font-bold border border-bridal-rose/25">
                <Heart className="w-3.5 h-3.5 fill-bridal-rose text-bridal-rose" />
                <span>
                  {lang === 'ar' && isMale
                    ? 'لوحة متابعة جهاز وتأسيس العريس 🤵‍♂️'
                    : t.dashboardBadge}
                </span>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setBrideNameInput(displayBrideName);
                    setPhoneInput(settings?.phoneNumber || '');
                    setWeddingDateInput(settings?.weddingDate || '');
                    setGenderInput(settings?.gender || 'female');
                    setIsEditingProfile(!isEditingProfile);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-bridal-mauve hover:text-bridal-rose transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.customizeProfile}</span>
                </button>
              )}
            </div>

            {isEditingProfile && !isReadOnly ? (
              <form
                onSubmit={handleSaveProfile}
                className="p-4 rounded-2xl bg-bridal-surface border border-bridal-border space-y-3 max-w-lg"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                      {genderInput === 'male' ? 'اسم العريس' : t.brideNameLabel}
                    </label>
                    <input
                      type="text"
                      value={brideNameInput}
                      onChange={(e) => setBrideNameInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-bridal-cream border border-bridal-border text-sm font-bold text-bridal-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                      رقم الموبايل
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="010xxxxxxxx"
                      className="w-full px-3 py-1.5 rounded-xl bg-bridal-cream border border-bridal-border text-sm font-bold text-bridal-charcoal text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                      {t.weddingDateLabel}
                    </label>
                    <input
                      type="date"
                      value={weddingDateInput}
                      onChange={(e) => setWeddingDateInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-bridal-cream border border-bridal-border text-sm text-bridal-charcoal"
                    />
                  </div>
                </div>

                {/* Gender & Checklist Mode Switcher */}
                <div className="pt-2 border-t border-bridal-border space-y-2">
                  <label className="block text-[11px] font-extrabold text-bridal-charcoal">
                    نوع الحساب والأقسام (عروسة 👰‍♀️ / عريس 🤵‍♂️):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGenderInput('female')}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                        genderInput === 'female'
                          ? 'bg-bridal-rose text-white border-bridal-rose'
                          : 'bg-bridal-cream text-bridal-charcoal border-bridal-border'
                      }`}
                    >
                      👰‍♀️ واجهة وأقسام العروسة
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenderInput('male')}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                        genderInput === 'male'
                          ? 'bg-bridal-rose text-white border-bridal-rose'
                          : 'bg-bridal-cream text-bridal-charcoal border-bridal-border'
                      }`}
                    >
                      🤵‍♂️ واجهة وأقسام العريس
                    </button>
                  </div>
                  {genderInput !== (settings?.gender || 'female') && (
                    <label className="flex items-center gap-2 text-[11px] font-bold text-bridal-mauve cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={loadTemplateOnSwitch}
                        onChange={(e) => setLoadTemplateOnSwitch(e.target.checked)}
                        className="rounded border-bridal-border text-bridal-rose"
                      />
                      <span>
                        تحميل الأقسام والأصناف الافتراضية الخاصة بـ{' '}
                        {genderInput === 'male' ? 'العريس (الأثاث والتشطيبات والبدلة)' : 'العروسة (المطبخ والمفروشات والملابس)'}
                      </span>
                    </label>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-1 rounded-lg text-xs text-bridal-mauve"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-bridal-rose text-white text-xs font-bold"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-bridal-charcoal">
                  {lang === 'ar'
                    ? isMale
                      ? `أهلاً بك يا ${displayBrideName} 🤵‍♂️💍`
                      : `${t.welcomeBride} ${displayBrideName} 🌸`
                    : `${t.welcomeBride} ${displayBrideName} ${isMale ? '🤵‍♂️' : '🌸'}`}
                </h2>
                <p className="text-xs sm:text-sm text-bridal-mauve mt-1">
                  {lang === 'ar' && isMale
                    ? 'كل خطوة في تأسيس شقتك وتجهيزات فرحك تقربكما من عش الزوجية السعيد بإذن الله ✨ — تقدر تضيف أو تحذف أي صنف وتشارك عروستك كل اللي اشتريته!'
                    : t.dashboardEncouragement}
                </p>
              </div>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bridal-surface border border-bridal-border text-xs font-bold text-bridal-charcoal">
                <CheckCircle2 className="w-4 h-4 text-bridal-sage" />
                <span>{t.purchasedSummary(purchasedItemsCount, totalItemsCount)}</span>
              </div>

              {priorityRemainingCount > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenShoppingMode('priority')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bridal-goldLight border border-bridal-gold/40 text-xs font-bold text-bridal-gold hover:bg-bridal-gold/20 transition"
                >
                  <Star className="w-3.5 h-3.5 fill-bridal-gold text-bridal-gold" />
                  <span>{t.prioritiesForNextTrip(priorityRemainingCount)}</span>
                </button>
              )}

              {!isReadOnly && onOpenShareFiance && (
                <button
                  type="button"
                  onClick={onOpenShareFiance}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bridal-roseLight/80 hover:bg-bridal-rose/25 border border-bridal-rose/35 text-xs font-bold text-bridal-roseDark transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'ar'
                      ? isMale
                        ? 'شارك عروستك باللي اشتريته 🔗'
                        : t.shareWithFianceBtn
                      : t.shareWithFianceBtn}
                  </span>
                </button>
              )}

              {!isReadOnly && onOpenShareShowcase && (
                <button
                  type="button"
                  onClick={onOpenShareShowcase}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bridal-surface hover:bg-bridal-cream border border-bridal-border text-xs font-bold text-bridal-charcoal transition"
                >
                  <Link2 className="w-3.5 h-3.5 text-bridal-rose" />
                  <span>نسخ رابط عرض الجهاز 🌐</span>
                </button>
              )}

              {daysRemaining !== null && daysRemaining >= 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bridal-roseLight/70 border border-bridal-rose/30 text-xs font-bold text-bridal-roseDark">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t.daysUntilWedding(daysRemaining)}</span>
                </div>
              )}
            </div>

            {/* Linear Progress Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-bridal-charcoal">{t.overallProgressTitle}</span>
                <span className="text-bridal-roseDark">{overallPercent}%</span>
              </div>
              <div className="w-full h-3 bg-bridal-border/70 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-l from-bridal-sage to-bridal-rose"
                />
              </div>
            </div>
          </div>

          {/* Circular Progress Ring */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-bridal-surface p-4 rounded-3xl border border-bridal-border shadow-xs">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke="var(--bridal-border)"
                  strokeWidth="10"
                  fill="transparent"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke={
                    overallPercent === 100
                      ? 'var(--bridal-sage)'
                      : 'var(--bridal-rose)'
                  }
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-bridal-charcoal">
                  {overallPercent}%
                </span>
                <span className="text-[11px] font-medium text-bridal-mauve">
                  {t.completedWord}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upcoming Installments & Delivery Alerts Banner (Suggestion #3) */}
      {alertsList.length > 0 && (
        <div className="bg-bridal-goldLight/70 border border-bridal-gold/50 rounded-3xl p-4 sm:p-5 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-bridal-charcoal">
            <Bell className="w-4 h-4 text-bridal-gold animate-bounce" />
            <span>تنبيهات الأقساط ومواعيد الاستلام القادمة ({alertsList.length}) 🔔</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {alertsList.map((al) => (
              <div
                key={al.id}
                onClick={() => onEditItem && onEditItem(al.item)}
                className="cursor-pointer p-3 rounded-2xl bg-bridal-surface border border-bridal-border hover:border-bridal-rose flex items-center justify-between gap-2 transition"
              >
                <div>
                  <div className="text-xs font-extrabold text-bridal-charcoal">
                    {al.type === 'installment' ? '💰 قسط: ' : '🚚 استلام: '}
                    {al.title}
                  </div>
                  <div className="text-[11px] text-bridal-mauve mt-0.5">
                    الموعد: {al.date} •{' '}
                    <strong
                      className={
                        al.diffDays < 0
                          ? 'text-red-600'
                          : al.diffDays <= 3
                          ? 'text-bridal-gold'
                          : 'text-bridal-sageDark'
                      }
                    >
                      {al.diffDays < 0
                        ? `متأخر منذ ${Math.abs(al.diffDays)} يوم`
                        : al.diffDays === 0
                        ? 'اليوم!'
                        : `خلال ${al.diffDays} أيام`}
                    </strong>
                  </div>
                </div>
                {al.amount && (
                  <span className="text-xs font-extrabold text-bridal-roseDark whitespace-nowrap">
                    {formatCurrency(al.amount, lang)} {t.currency}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Smart Power Features Bar (Engineer Custody Ledger, Couple Room, Qayma Generator, Smart Budget) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Engineer & Finishing Custody Ledger */}
        {onOpenFinishingLedger && (
          <button
            type="button"
            onClick={onOpenFinishingLedger}
            className="text-right p-4 rounded-2xl bg-bridal-surface hover:bg-bridal-roseLight/40 border border-bridal-border hover:border-bridal-rose shadow-bridal transition flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-bridal-roseLight text-bridal-roseDark flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-bridal-cream text-bridal-charcoal border border-bridal-border">
                {engAdvances > 0 || engExpenses > 0
                  ? `متبقي: ${formatCurrency(engNet, 'ar')} ج.م`
                  : 'جديد ✨'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-bridal-charcoal group-hover:text-bridal-rose transition">
                عُهدة المهندس والتشطيبات 👷‍♂️🧱
              </h4>
              <p className="text-[11px] text-bridal-mauve mt-0.5 line-clamp-1">
                دفعات المهندس، فواتير الرمل والطوب والأسمنت والونش ومشاركتها
              </p>
            </div>
          </button>
        )}

        {/* 2. Couple Room (Link Bride & Groom) */}
        {onOpenCoupleRoom && (
          <button
            type="button"
            onClick={onOpenCoupleRoom}
            className="text-right p-4 rounded-2xl bg-bridal-surface hover:bg-bridal-roseLight/40 border border-bridal-border hover:border-bridal-rose shadow-bridal transition flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-bridal-sageLight text-bridal-sageDark flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-bridal-sageLight text-bridal-sageDark">
                {settings?.linkedPartnerUid ? 'مرتبط بالشريك 🔗' : 'ربط الحسابين 🏡'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-bridal-charcoal group-hover:text-bridal-rose transition">
                غرفة شقتنا المشتركة 🏡💍
              </h4>
              <p className="text-[11px] text-bridal-mauve mt-0.5 line-clamp-1">
                ربط حساب العريس بالعروسة وتنسيق الاتفاقات والمنقولات
              </p>
            </div>
          </button>
        )}

        {/* 3. Official Qayma Generator */}
        {onOpenPrintQayma && (
          <button
            type="button"
            onClick={onOpenPrintQayma}
            className="text-right p-4 rounded-2xl bg-bridal-surface hover:bg-bridal-roseLight/40 border border-bridal-border hover:border-bridal-rose shadow-bridal transition flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-bridal-goldLight text-bridal-gold flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-bridal-goldLight text-bridal-gold">
                جاهزة للطباعة 📜
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-bridal-charcoal group-hover:text-bridal-rose transition">
                مولّد قايمة المنقولات الزوجية 📜
              </h4>
              <p className="text-[11px] text-bridal-mauve mt-0.5 line-clamp-1">
                توليد وطباعة وثيقة قائمة العفش الرسمية من مشترياتك بضغطة زر
              </p>
            </div>
          </button>
        )}

        {/* 4. Smart Governorate Budget Calculator */}
        {onOpenSmartBudget && (
          <button
            type="button"
            onClick={onOpenSmartBudget}
            className="text-right p-4 rounded-2xl bg-bridal-surface hover:bg-bridal-roseLight/40 border border-bridal-border hover:border-bridal-rose shadow-bridal transition flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-bridal-cream text-bridal-roseDark flex items-center justify-center border border-bridal-border">
                <Calculator className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-bridal-cream text-bridal-charcoal border border-bridal-border">
                حاسبة ذكية 🧮
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-bridal-charcoal group-hover:text-bridal-rose transition">
                تقسيم الميزانية حسب المحافظة 🏷️
              </h4>
              <p className="text-[11px] text-bridal-mauve mt-0.5 line-clamp-1">
                توزيع استرشادي للميزانية على الأقسام حسب عرف محافظتك
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Financial Summary Cards (3 Key Cards) - Hidden if Showcase link has showPrices === false */}
      {showPrices && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Customizable Overall Budget */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-bridal-surface rounded-2xl border border-bridal-border p-5 shadow-bridal flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-bridal-mauve">
                  {t.totalBudgetTitle}
                </span>
                {isEditingBudget && !isReadOnly ? (
                  <form onSubmit={handleSaveBudget} className="mt-2 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      autoFocus
                      className="w-36 px-3 py-1.5 rounded-xl bg-bridal-cream border border-bridal-rose text-sm font-bold text-bridal-charcoal outline-none"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-bridal-sage text-white hover:opacity-90"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-extrabold text-bridal-charcoal">
                      {formatCurrency(totalBudget, lang)}
                    </span>
                    <span className="text-xs font-bold text-bridal-mauve">
                      {t.currency}
                    </span>
                  </div>
                )}
              </div>

              {!isEditingBudget && !isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setBudgetInput(String(totalBudget));
                    setIsEditingBudget(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-bridal-cream hover:bg-bridal-roseLight text-bridal-roseDark text-xs font-bold transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.editBtn}</span>
                </button>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-bridal-border/70">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-bridal-mauve font-medium">
                  {t.remainingFromBudget}
                </span>
                <span
                  className={`font-extrabold ${
                    remainingBudget >= 0 ? 'text-bridal-sageDark' : 'text-red-500'
                  }`}
                >
                  {remainingBudget >= 0
                    ? `${formatCurrency(remainingBudget, lang)} ${t.currency}`
                    : `${t.overBudgetBy(
                        formatCurrency(Math.abs(remainingBudget), lang)
                      )} ${t.currency}`}
                </span>
              </div>
              <div className="w-full h-2 bg-bridal-cream rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    remainingBudget < 0 ? 'bg-red-400' : 'bg-bridal-rose'
                  }`}
                  style={{ width: `${budgetUsedPercent}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Total Money Spent So Far */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bridal-surface rounded-2xl border border-bridal-border p-5 shadow-bridal flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-bridal-mauve">
                  {t.totalSpentTitle}
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-extrabold text-bridal-sageDark">
                    {formatCurrency(totalSpent, lang)}
                  </span>
                  <span className="text-xs font-bold text-bridal-mauve">
                    {t.currency}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-bridal-sageLight flex items-center justify-center text-bridal-sageDark">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-bridal-border/70 flex items-center justify-between text-xs">
              <span className="text-bridal-mauve">{t.cashPaidSoFar}</span>
              <span className="font-bold text-bridal-charcoal">
                {formatCurrency(totalCashPaid, lang)} {t.currency}
              </span>
            </div>
          </motion.div>

          {/* Card 3: Total Remaining Installments / Balances */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-bridal-surface rounded-2xl border border-bridal-border p-5 shadow-bridal flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-bridal-mauve">
                  {t.totalRemainingInstallmentsTitle}
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span
                    className={`text-2xl font-extrabold ${
                      totalRemainingInstallments > 0
                        ? 'text-bridal-gold'
                        : 'text-bridal-charcoal'
                    }`}
                  >
                    {formatCurrency(totalRemainingInstallments, lang)}
                  </span>
                  <span className="text-xs font-bold text-bridal-mauve">
                    {t.currency}
                  </span>
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  totalRemainingInstallments > 0
                    ? 'bg-bridal-goldLight text-bridal-gold'
                    : 'bg-bridal-cream text-bridal-mauve'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-bridal-border/70 flex items-center justify-between text-xs">
              <span className="text-bridal-mauve">
                {itemsWithInstallmentsCount > 0
                  ? t.distributedAcrossItems(itemsWithInstallmentsCount)
                  : t.noInstallmentsMsg}
              </span>
              {itemsWithInstallmentsCount > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenShoppingMode('installments')}
                  className="text-bridal-gold font-bold underline hover:opacity-80"
                >
                  {t.viewThemBtn}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Category Breakdown Section */}
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-extrabold text-bridal-charcoal flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-bridal-rose" />
              <span>{t.categoryBreakdownTitle}</span>
            </h3>
            <p className="text-xs text-bridal-mauve">
              {t.categoryBreakdownSubtitle}
            </p>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenNewCategory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-surface border border-bridal-border hover:border-bridal-rose text-xs font-bold text-bridal-charcoal shadow-2xs transition"
            >
              <Plus className="w-4 h-4 text-bridal-rose" />
              <span>{t.addCustomCategoryBtn}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => {
            const locCat = getLocalizedCategory(cat, lang);
            const catItems = items.filter((i) => i.categoryId === cat.id);
            const catTotal = catItems.length;
            const catPurchased = catItems.filter((i) => i.isPurchased).length;
            const catPercent =
              catTotal > 0 ? Math.round((catPurchased / catTotal) * 100) : 0;

            const catSpent = catItems.reduce(
              (sum, i) => sum + (Number(i.actualPrice) || 0),
              0
            );
            const catRemainingInstallment = catItems.reduce(
              (sum, i) => sum + (Number(i.remainingAmount) || 0),
              0
            );

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => onSelectCategory(cat.id)}
                className="group cursor-pointer bg-bridal-surface rounded-2xl border border-bridal-border hover:border-bridal-rose p-4 shadow-bridal hover:shadow-bridal-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {cat.image ? (
                      <img
                        src={cat.image.dataUrl || cat.image}
                        alt={locCat.displayName}
                        className="w-12 h-12 rounded-2xl object-cover border border-bridal-border transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: `${cat.color || '#D88C9A'}24`,
                          color: cat.color || '#D88C9A'
                        }}
                      >
                        <CategoryIcon iconName={cat.icon} className="w-6 h-6" />
                      </div>
                    )}

                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                        catPercent === 100 && catTotal > 0
                          ? 'bg-bridal-sageLight text-bridal-sageDark'
                          : 'bg-bridal-cream text-bridal-charcoal'
                      }`}
                    >
                      {catPercent}%
                    </span>
                  </div>

                  <h4 className="font-bold text-bridal-charcoal group-hover:text-bridal-rose transition-colors text-base line-clamp-1">
                    {locCat.displayName}
                  </h4>
                  <p className="text-xs text-bridal-mauve mt-0.5 line-clamp-1">
                    {locCat.displayDescription || t.categoryDefaultDesc}
                  </p>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="w-full h-2 bg-bridal-cream rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${catPercent}%`,
                        backgroundColor:
                          catPercent === 100
                            ? 'var(--bridal-sage)'
                            : cat.color || 'var(--bridal-rose)'
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-bridal-border/60">
                    <span className="text-bridal-mauve font-medium">
                      {t.completedCount(catPurchased, catTotal)}
                    </span>
                    {showPrices && (
                      <span className="font-bold text-bridal-charcoal">
                        {formatCurrency(catSpent, lang)} {t.currency}
                      </span>
                    )}
                  </div>

                  {showPrices && catRemainingInstallment > 0 && (
                    <div className="text-[11px] font-bold text-bridal-gold bg-bridal-goldLight px-2.5 py-1 rounded-lg border border-bridal-gold/30 flex items-center justify-between">
                      <span>{t.remainingInstallmentsShort}</span>
                      <span>
                        {formatCurrency(catRemainingInstallment, lang)} {t.currency}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-end text-[11px] font-bold text-bridal-rose transition-transform">
                    <span>{t.openCategoryBtn}</span>
                    {isRtl ? (
                      <ChevronLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
