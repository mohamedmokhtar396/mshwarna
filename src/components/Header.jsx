import React from 'react';
import {
  Search,
  X,
  CheckCircle2,
  Printer,
  Plus,
  Heart,
  Download,
  Moon,
  Sun,
  Globe,
  Shield,
  LogOut,
  LogIn,
  Share2,
  Cloud
} from 'lucide-react';
import { translations } from '../i18n';

export default function Header({
  lang = 'ar',
  theme = 'light',
  onToggleLang,
  onToggleTheme,
  searchQuery,
  onSearchChange,
  onOpenAddItem,
  onOpenPrintReport,
  installPromptEvent,
  onTriggerInstall,
  currentUser,
  isSuperAdmin = false,
  isReadOnly = false,
  onOpenAdminDashboard,
  onOpenShareShowcase,
  onSignOut,
  onOpenAuthScreen
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  return (
    <header className="sticky top-0 z-30 bg-bridal-bg/95 backdrop-blur-md border-b border-bridal-border shadow-2xs no-print transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Logo + Sync Status Badge + Mobile Quick Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-bridal-rose to-bridal-roseDark text-white flex items-center justify-center shadow-bridal flex-shrink-0">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-extrabold text-bridal-charcoal tracking-tight">
                    {t.appName}
                  </h1>
                  {currentUser ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-bridal-sageLight text-bridal-sageDark text-[11px] font-bold border border-bridal-sage/30">
                      <Cloud className="w-3 h-3" />
                      <span>
                        {lang === 'ar' ? 'متصل بالسحابة ومحفوظ تلقائياً ✓' : 'Cloud Synced ✓'}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-bridal-sageLight text-bridal-sageDark text-[11px] font-bold border border-bridal-sage/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t.autoSavedBadge}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-bridal-mauve">
                  {t.appSubtitle}
                </p>
              </div>
            </div>

            {/* Mobile Quick Controls */}
            <div className="flex md:hidden items-center gap-1.5">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdminDashboard}
                  className="p-2 rounded-xl bg-bridal-charcoal text-bridal-gold border border-bridal-gold/40 shadow-2xs"
                  title="لوحة الإدارة العليا"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-xl bg-bridal-surface border border-bridal-border text-bridal-roseDark shadow-2xs transition"
                title={theme === 'dark' ? t.lightMode : t.darkMode}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-bridal-gold" />
                ) : (
                  <Moon className="w-4 h-4 text-bridal-roseDark" />
                )}
              </button>

              <button
                type="button"
                onClick={onToggleLang}
                className="px-2.5 py-1.5 rounded-xl bg-bridal-surface border border-bridal-border text-bridal-charcoal text-xs font-bold shadow-2xs transition"
              >
                {t.switchLangLabel}
              </button>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={onOpenAddItem}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-bridal-rose text-white text-xs font-bold shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Bar + Desktop Actions */}
          <div className="flex items-center gap-2 flex-1 md:max-w-3xl justify-end flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <Search
                className={`w-4 h-4 text-bridal-mauve absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                  isRtl ? 'right-3.5' : 'left-3.5'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full ${
                  isRtl ? 'pr-10 pl-8' : 'pl-10 pr-8'
                } py-2 rounded-2xl bg-bridal-surface border border-bridal-border focus:border-bridal-rose focus:ring-2 focus:ring-bridal-rose/15 outline-none text-xs sm:text-sm text-bridal-charcoal placeholder:text-bridal-mauve/70 transition`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className={`absolute ${
                    isRtl ? 'left-2.5' : 'right-2.5'
                  } top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-bridal-cream text-bridal-mauve`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Super Admin Button (Exclusively for mohameddmm027@gmail.com) */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={onOpenAdminDashboard}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-bridal-charcoal hover:opacity-95 text-bridal-gold border border-bridal-gold/40 text-xs font-extrabold shadow-bridal transition flex-shrink-0"
              >
                <Shield className="w-4 h-4 text-bridal-gold" />
                <span>لوحة الإدارة العليا 🛡️</span>
              </button>
            )}

            {/* Share Showcase Link Button */}
            {!isReadOnly && onOpenShareShowcase && (
              <button
                type="button"
                onClick={onOpenShareShowcase}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-bridal-sageLight hover:bg-bridal-sage/20 text-bridal-sageDark border border-bridal-sage/40 text-xs font-extrabold transition flex-shrink-0"
                title="نسخ البروفايل ومشاركته برابط عرض"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة الجهاز 🔗</span>
              </button>
            )}

            {/* Desktop Theme Switcher */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-bridal-surface hover:bg-bridal-roseLight/60 text-bridal-charcoal border border-bridal-border text-xs font-bold transition flex-shrink-0"
              title={theme === 'dark' ? t.lightMode : t.darkMode}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-bridal-gold" />
              ) : (
                <Moon className="w-4 h-4 text-bridal-rose" />
              )}
            </button>

            {/* Desktop Language Switcher */}
            <button
              type="button"
              onClick={onToggleLang}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-bridal-surface hover:bg-bridal-roseLight/60 text-bridal-charcoal border border-bridal-border text-xs font-bold transition flex-shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-bridal-rose" />
              <span>{t.switchLangLabel}</span>
            </button>

            {/* Install PWA Button if available */}
            {installPromptEvent && (
              <button
                type="button"
                onClick={onTriggerInstall}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-bridal-goldLight text-bridal-charcoal border border-bridal-gold/40 text-xs font-bold hover:bg-bridal-gold/25 transition flex-shrink-0"
                title={t.installApp}
              >
                <Download className="w-3.5 h-3.5 text-bridal-gold" />
                <span className="hidden sm:inline">{t.installApp}</span>
              </button>
            )}

            {/* Print Report Quick Button */}
            <button
              type="button"
              onClick={onOpenPrintReport}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-bridal-surface hover:bg-bridal-cream text-bridal-charcoal border border-bridal-border text-xs font-bold transition flex-shrink-0"
              title={t.printReportBtn}
            >
              <Printer className="w-4 h-4 text-bridal-rose" />
              <span>{t.printReportBtn}</span>
            </button>

            {/* Desktop Add Item Button */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={onOpenAddItem}
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-xs font-bold shadow-bridal hover:opacity-95 transition flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addItemBtn}</span>
              </button>
            )}

            {/* Sign Out / Sign In Button */}
            {!isReadOnly && (
              currentUser ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-bridal-cream hover:bg-red-500/10 text-bridal-mauve hover:text-red-500 border border-bridal-border text-xs font-bold transition flex-shrink-0"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">خروج</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuthScreen}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-bridal-roseLight text-bridal-roseDark border border-bridal-rose/30 text-xs font-extrabold transition flex-shrink-0"
                  title="تسجيل الدخول لحفظ جهازك سحابياً"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>حساب سحابي</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
