import React from 'react';
import {
  Search,
  X,
  CheckCircle2,
  Printer,
  Plus,
  Download,
  Moon,
  Sun,
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Share2,
  Shield,
  LogOut,
  LogIn
} from 'lucide-react';
import { translations } from '../i18n';

export default function Header({
  lang = 'ar',
  theme = 'light',
  gender = 'female',
  onToggleLang,
  onToggleTheme,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onSafeRefresh,
  hasUnbackedChanges = false,
  searchQuery,
  onSearchChange,
  onOpenAddItem,
  onOpenPrintReport,
  onOpenShareFiance,
  onOpenShareShowcase,
  isAppInstalled = false,
  onTriggerInstall,
  currentUser = null,
  isSuperAdmin = false,
  isReadOnly = false,
  onOpenAdminDashboard,
  onSignOut,
  onOpenAuthScreen
}) {
  const t = translations[lang] || translations.ar;
  const isMale = gender === 'male';
  const portraitIconSrc = isMale ? '/groom-icon-192.png' : '/icon-192.png';

  const sharePartnerLabel =
    lang === 'ar'
      ? isMale
        ? 'مشاركة مع عروستي 🔗'
        : t.shareWithFianceBtn
      : isMale
      ? 'Share with Bride 🔗'
      : t.shareWithFianceBtn;

  // Crescent / Sun Icon-Only Button
  const ThemeIconButton = () => (
    <button
      type="button"
      onClick={onToggleTheme}
      aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
      title={theme === 'dark' ? t.lightMode : t.darkMode}
      className="w-9 h-9 rounded-2xl bg-bridal-surface hover:bg-bridal-roseLight/80 text-bridal-rose border border-bridal-border flex items-center justify-center shadow-2xs active:scale-95 transition-all flex-shrink-0"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-bridal-gold fill-bridal-gold/20" />
      ) : (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-bridal-rose fill-bridal-rose/15" />
      )}
    </button>
  );

  // Back (Left Arrow), Forward (Right Arrow), and Refresh Controls
  const HistoryAndRefreshGroup = () => (
    <div
      dir="ltr"
      className="inline-flex items-center gap-0.5 bg-bridal-surface p-1 rounded-2xl border border-bridal-border shadow-2xs flex-shrink-0"
    >
      <button
        type="button"
        onClick={onGoBack}
        disabled={!canGoBack}
        title={t.navBackTooltip}
        aria-label={t.navBackTooltip}
        className="w-7 h-7 rounded-xl flex items-center justify-center text-bridal-charcoal hover:bg-bridal-cream disabled:opacity-30 disabled:pointer-events-none transition"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onGoForward}
        disabled={!canGoForward}
        title={t.navForwardTooltip}
        aria-label={t.navForwardTooltip}
        className="w-7 h-7 rounded-xl flex items-center justify-center text-bridal-charcoal hover:bg-bridal-cream disabled:opacity-30 disabled:pointer-events-none transition"
      >
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-bridal-border mx-0.5" />

      <button
        type="button"
        onClick={onSafeRefresh}
        title={t.navRefreshTooltip}
        aria-label={t.navRefreshTooltip}
        className="relative w-7 h-7 rounded-xl flex items-center justify-center text-bridal-charcoal hover:bg-bridal-cream hover:text-bridal-rose transition"
      >
        <RotateCw className="w-3.5 h-3.5" />
        {hasUnbackedChanges && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-bridal-amber animate-pulse"
            title={t.unbackedOfflineBadge}
          />
        )}
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 bg-bridal-bg/95 backdrop-blur-md border-b border-bridal-border shadow-2xs no-print transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 xl:gap-4">
          {/* Side 1: Portrait Logo (Bride or Groom), App Name & Sync Badge */}
          <div className="flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-bridal-gold shadow-bridal flex-shrink-0 bg-bridal-surface">
                <img
                  src={portraitIconSrc}
                  alt={t.appName}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-bridal-charcoal tracking-tight whitespace-nowrap">
                    {t.appName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bridal-sageLight text-bridal-sageDark text-[10px] font-bold border border-bridal-sage/30 whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    <span>{currentUser ? 'متصل بالسحابة ☁️' : t.autoSavedBadge}</span>
                  </span>
                </div>
                <p className="text-[11px] text-bridal-mauve truncate max-w-[230px] sm:max-w-[300px] mt-0.5">
                  {lang === 'ar'
                    ? isMale
                      ? 'رفيق العريس لتنظيم الجهاز وتأسيس الشقة ومشاركتها مع العروسة'
                      : t.appSubtitle
                    : t.appSubtitle}
                </p>
              </div>
            </div>

            {/* Mobile/Tablet Far-End Controls */}
            <div className="flex xl:hidden items-center gap-1.5 flex-shrink-0">
              {!isAppInstalled && onTriggerInstall && (
                <button
                  type="button"
                  onClick={() => onTriggerInstall(gender)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-l from-bridal-goldLight to-bridal-roseLight text-bridal-charcoal border border-bridal-gold/60 text-[11px] font-extrabold shadow-2xs active:scale-95 transition whitespace-nowrap"
                  title={lang === 'ar' ? 'تنزيل التطبيق للموبايل' : 'Install Mobile App'}
                >
                  <Download className="w-3.5 h-3.5 text-bridal-roseDark animate-bounce flex-shrink-0" />
                  <span>{lang === 'ar' ? 'تنزيل التطبيق' : 'Install'}</span>
                </button>
              )}
              <HistoryAndRefreshGroup />
              <ThemeIconButton />
            </div>
          </div>

          {/* Side 2: Search Box + Action Buttons + Far-End Controls */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between xl:justify-end gap-2 flex-1">
            {/* Search Box */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-bridal-surface border border-bridal-border focus-within:border-bridal-rose focus-within:ring-2 focus-within:ring-bridal-rose/15 transition w-full sm:w-auto sm:flex-1 sm:min-w-[170px] sm:max-w-[240px]">
              <Search className="w-4 h-4 text-bridal-mauve flex-shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-bridal-charcoal placeholder:text-bridal-mauve/70 min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-0.5 rounded-full hover:bg-bridal-cream text-bridal-mauve flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Action Pills + Far-Left Controls Group */}
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap sm:flex-nowrap">
              {/* Install Mobile App Button (Always visible on desktop when not installed) */}
              {!isAppInstalled && onTriggerInstall && (
                <button
                  type="button"
                  onClick={() => onTriggerInstall(gender)}
                  className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-l from-bridal-goldLight to-bridal-roseLight text-bridal-charcoal border border-bridal-gold/60 text-xs font-extrabold hover:opacity-95 shadow-2xs transition flex-shrink-0 whitespace-nowrap"
                  title={lang === 'ar' ? 'تنزيل التطبيق للموبايل بضغطة زر' : 'Install Mobile App'}
                >
                  <Download className="w-3.5 h-3.5 text-bridal-roseDark flex-shrink-0" />
                  <span>{lang === 'ar' ? 'تنزيل التطبيق 📲' : 'Install App 📲'}</span>
                </button>
              )}

              {/* Super Admin Command Center Button */}
              {isSuperAdmin && onOpenAdminDashboard && (
                <button
                  type="button"
                  onClick={onOpenAdminDashboard}
                  title="لوحة الإدارة العليا"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-bridal-charcoal text-bridal-gold border border-bridal-gold/40 text-xs font-extrabold shadow-xs hover:opacity-95 transition flex-shrink-0 whitespace-nowrap"
                >
                  <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden lg:inline">لوحة الإدارة 🛡️</span>
                </button>
              )}

              {/* Share with Partner */}
              {!isReadOnly && (onOpenShareFiance || onOpenShareShowcase) && (
                <button
                  type="button"
                  onClick={onOpenShareFiance || onOpenShareShowcase}
                  title={sharePartnerLabel}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-bridal-roseLight hover:bg-bridal-rose/25 text-bridal-roseDark border border-bridal-rose/40 text-xs font-bold transition flex-shrink-0 whitespace-nowrap"
                >
                  <Share2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden md:inline">{sharePartnerLabel}</span>
                </button>
              )}

              {/* Language Switcher */}
              <button
                type="button"
                onClick={onToggleLang}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-bridal-surface hover:bg-bridal-roseLight/60 text-bridal-charcoal border border-bridal-border text-xs font-bold transition flex-shrink-0 whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5 text-bridal-rose flex-shrink-0" />
                <span>{t.switchLangLabel}</span>
              </button>

              {/* Print Report */}
              <button
                type="button"
                onClick={onOpenPrintReport}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-bridal-surface hover:bg-bridal-cream text-bridal-charcoal border border-bridal-border text-xs font-bold transition flex-shrink-0 whitespace-nowrap"
                title={t.printReportBtn}
              >
                <Printer className="w-4 h-4 text-bridal-rose flex-shrink-0" />
                <span className="hidden lg:inline">{t.printReportBtn}</span>
              </button>

              {/* Add Item */}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={onOpenAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-xs font-bold shadow-bridal hover:opacity-95 transition flex-shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{t.addItemBtn}</span>
                </button>
              )}

              {/* Sign Out / Cloud Account */}
              {!isReadOnly && (onSignOut || onOpenAuthScreen) && (
                currentUser ? (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-bridal-cream hover:bg-red-500/10 text-bridal-mauve hover:text-red-500 border border-bridal-border text-xs font-bold transition flex-shrink-0 whitespace-nowrap"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden 2xl:inline">خروج</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAuthScreen}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-bridal-roseLight text-bridal-roseDark border border-bridal-rose/30 text-xs font-extrabold transition flex-shrink-0 whitespace-nowrap"
                    title="تسجيل الدخول لحفظ جهازك سحابياً"
                  >
                    <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">حساب سحابي</span>
                  </button>
                )
              )}

              {/* Desktop Far-End Controls: Back / Forward / Refresh + Crescent Dark Mode Icon */}
              <div className="hidden xl:flex items-center gap-1.5 ps-1.5 border-s border-bridal-border flex-shrink-0">
                <HistoryAndRefreshGroup />
                <ThemeIconButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
