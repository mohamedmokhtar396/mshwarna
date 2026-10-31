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
  Phone,
  Share2
} from 'lucide-react';
import { formatCurrency, parseArabicNumber } from '../db';
import { CategoryIcon } from '../utils/categoryIcons';
import { translations, getLocalizedCategory } from '../i18n';

export default function Dashboard({
  lang = 'ar',
  categories,
  items,
  settings,
  onUpdateSettings,
  onSelectCategory,
  onOpenNewCategory,
  onOpenShoppingMode,
  onOpenShareShowcase,
  isReadOnly = false,
  showPrices = true
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(settings?.totalBudget || 300000));
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [brideNameInput, setBrideNameInput] = useState(
    settings?.brideName || t.defaultBrideName
  );
  const [phoneInput, setPhoneInput] = useState(settings?.phoneNumber || '');
  const [weddingDateInput, setWeddingDateInput] = useState(settings?.weddingDate || '');
  const [profileBudgetInput, setProfileBudgetInput] = useState(
    String(settings?.totalBudget || 300000)
  );

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

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    const parsed = parseArabicNumber(budgetInput);
    onUpdateSettings({ totalBudget: parsed > 0 ? parsed : 0 });
    setIsEditingBudget(false);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    const parsedBudget = parseArabicNumber(profileBudgetInput);
    onUpdateSettings({
      brideName: brideNameInput.trim() || t.defaultBrideName,
      phoneNumber: phoneInput.trim(),
      weddingDate: weddingDateInput,
      ...(parsedBudget > 0 ? { totalBudget: parsedBudget } : {})
    });
    setIsEditingProfile(false);
  };

  // Localized default bride name if untouched
  const displayBrideName =
    !settings?.brideName ||
    settings.brideName === 'Lovely Bride' ||
    settings.brideName === 'أحلى عروسة'
      ? t.defaultBrideName
      : settings.brideName;

  const isMissingPhoneOrDate = !settings?.phoneNumber || !settings?.weddingDate;

  // Circular progress geometry
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallPercent / 100) * circumference;

  return (
    <div className="space-y-6 pb-8">
      {/* Top Hero Card: Overall Progress & Bride Greeting */}
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
                <span>{t.dashboardBadge}</span>
              </div>

              {!isReadOnly && (
                <div className="flex flex-wrap items-center gap-2">
                  {onOpenShareShowcase && (
                    <button
                      type="button"
                      onClick={onOpenShareShowcase}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-bridal-sageLight text-bridal-sageDark border border-bridal-sage/30 text-xs font-bold hover:bg-bridal-sage/20 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'ar' ? 'مشاركة رابط عرض الجهاز 🔗' : 'Share Showcase Link 🔗'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setBrideNameInput(displayBrideName);
                      setPhoneInput(settings?.phoneNumber || '');
                      setWeddingDateInput(settings?.weddingDate || '');
                      setProfileBudgetInput(String(totalBudget));
                      setIsEditingProfile(!isEditingProfile);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-bridal-surface border border-bridal-border text-xs font-bold text-bridal-mauve hover:text-bridal-rose transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t.customizeProfile}</span>
                  </button>
                </div>
              )}
            </div>

            {isEditingProfile && !isReadOnly ? (
              <form
                onSubmit={handleSaveProfile}
                className="p-4 rounded-2xl bg-bridal-surface border border-bridal-border space-y-3 max-w-xl shadow-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                      {t.brideNameLabel}
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
                      {lang === 'ar' ? 'رقم موبايل العروسة' : 'Phone Number'}
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
                  <div>
                    <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                      {t.totalBudgetTitle} ({t.currency})
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={profileBudgetInput}
                      onChange={(e) => setProfileBudgetInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-bridal-cream border border-bridal-border text-sm font-bold text-bridal-charcoal"
                    />
                  </div>
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
                  {t.welcomeBride} {displayBrideName} 🌸
                </h2>
                <p className="text-xs sm:text-sm text-bridal-mauve mt-1">
                  {t.dashboardEncouragement}
                </p>

                {!isReadOnly && isMissingPhoneOrDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setBrideNameInput(displayBrideName);
                      setPhoneInput(settings?.phoneNumber || '');
                      setWeddingDateInput(settings?.weddingDate || '');
                      setProfileBudgetInput(String(totalBudget));
                      setIsEditingProfile(true);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-bridal-goldLight border border-bridal-gold/40 text-[11px] font-bold text-bridal-charcoal hover:bg-bridal-gold/25 transition"
                  >
                    <Phone className="w-3 h-3 text-bridal-gold" />
                    <span>
                      {lang === 'ar'
                        ? 'اضغطي هنا لإضافة رقم موبايلك أو موعد الفرح لحسابك ✨'
                        : 'Tap here to add your phone number or wedding date ✨'}
                    </span>
                  </button>
                )}
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

      {/* Financial Summary Cards (3 Key Cards) - Shown when showPrices is true */}
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
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${cat.color || '#D88C9A'}24`,
                        color: cat.color || '#D88C9A'
                      }}
                    >
                      <CategoryIcon iconName={cat.icon} className="w-6 h-6" />
                    </div>

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
                  {/* Progress bar */}
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
