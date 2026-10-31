import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Layers,
  ShoppingBag,
  ShieldCheck,
  Shield,
  Sparkles,
  Eye,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, SUPER_ADMIN_EMAIL } from './firebaseConfig';
import {
  db,
  initializeDatabase,
  ensurePersistentStorage,
  initializeUserCloudProfile,
  subscribeToBrideCloudData,
  fetchSharedShowcaseProfile,
  setReadOnlyMode,
  setActiveCloudUid,
  toggleItemPurchased,
  toggleItemPriority,
  updateItemQuantity,
  saveItem,
  deleteItem,
  saveCategory,
  deleteCategory,
  updateAppSettings
} from './db';
import { defaultSettings, initialCategories, initialItems } from './seedData';
import { translations } from './i18n';
import {
  triggerCategoryCelebration,
  triggerMiniSparkle
} from './utils/celebrate';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CategoryView from './components/CategoryView';
import ShoppingMode from './components/ShoppingMode';
import BackupManager from './components/BackupManager';
import PrintReport from './components/PrintReport';
import ItemModal from './components/ItemModal';
import CategoryModal from './components/CategoryModal';
import AuthScreen from './components/AuthScreen';
import AdminDashboard from './components/AdminDashboard';
import ShareShowcaseModal from './components/ShareShowcaseModal';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isStoragePersisted, setIsStoragePersisted] = useState(false);

  // Auth & Cloud State
  const [currentUser, setCurrentUser] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [activeTargetUid, setActiveTargetUid] = useState(null);
  const [impersonatedBride, setImpersonatedBride] = useState(null);

  // Public Showcase Mode (?showcase={shareId})
  const [showcaseId, setShowcaseId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('showcase') || null;
  });
  const [showcaseData, setShowcaseData] = useState(null);
  const [showcaseLoading, setShowcaseLoading] = useState(false);
  const [showcaseError, setShowcaseError] = useState('');

  // Navigation Tabs: 'dashboard' | 'categories' | 'shopping' | 'backup' | 'print' | 'admin'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat-appliances');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalDefaultCategoryId, setModalDefaultCategoryId] = useState('cat-appliances');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // PWA Install Prompt
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  const isSuperAdmin = Boolean(
    currentUser?.email &&
      currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
  );

  // 1. Initialize Local Dexie & Check Showcase Mode
  useEffect(() => {
    let mounted = true;
    initializeDatabase().then(async () => {
      const persisted = await ensurePersistentStorage();
      if (mounted) {
        setIsStoragePersisted(persisted);
        setIsDbReady(true);
      }
    });

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      mounted = false;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 2. Load Public Showcase Snapshot if ?showcase={shareId} is present
  useEffect(() => {
    if (!showcaseId) {
      setReadOnlyMode(false);
      setShowcaseData(null);
      return;
    }

    let mounted = true;
    setReadOnlyMode(true);
    setShowcaseLoading(true);
    setShowcaseError('');

    fetchSharedShowcaseProfile(showcaseId)
      .then((snap) => {
        if (!mounted) return;
        if (!snap) {
          setShowcaseError('رابط العرض المشترك غير موجود أو انتهت صلاحيته.');
        } else {
          setShowcaseData(snap);
        }
      })
      .catch((err) => {
        if (mounted) {
          setShowcaseError(err?.message || 'تعذر تحميل نسخة الجهاز المشتركة.');
        }
      })
      .finally(() => {
        if (mounted) setShowcaseLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [showcaseId]);

  // 3. Listen to Firebase Authentication State
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user || null);
      if (user) {
        setIsGuestMode(false);
        await initializeUserCloudProfile(user);
        setActiveTargetUid((prev) => prev || user.uid);
      } else {
        setActiveTargetUid(null);
        setImpersonatedBride(null);
        setActiveCloudUid(null);
      }
      setIsAuthChecking(false);
    });
    return () => unsubAuth();
  }, []);

  // 4. Real-Time Cloud Subscription to Active Target Bride's Data
  useEffect(() => {
    if (!activeTargetUid || showcaseId) return undefined;
    const unsubCloud = subscribeToBrideCloudData(activeTargetUid);
    return () => unsubCloud();
  }, [activeTargetUid, showcaseId]);

  // Reactive Live Queries from IndexedDB via Dexie
  const localCategories = useLiveQuery(
    () => db.categories.orderBy('order').toArray(),
    [],
    []
  );
  const localItems = useLiveQuery(() => db.items.toArray(), [], []);
  const localSettings = useLiveQuery(
    () => db.settings.get('app-settings'),
    [],
    defaultSettings
  );

  // Determine effective data (Showcase Snapshot vs Live Account/Local DB)
  const isReadOnly = Boolean(showcaseId);
  const showPrices = isReadOnly ? Boolean(showcaseData?.showPrices ?? true) : true;
  const categories = isReadOnly
    ? showcaseData?.categories || initialCategories
    : localCategories;
  const items = isReadOnly ? showcaseData?.items || initialItems : localItems;
  const settings = isReadOnly
    ? showcaseData?.settings || defaultSettings
    : localSettings || defaultSettings;

  const lang = settings?.language || 'ar';
  const theme = settings?.theme || 'light';
  const t = translations[lang] || translations.ar;

  // Apply RTL/LTR direction and Dark/Light theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.lang = lang;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [lang, theme]);

  const handleToggleLang = async () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    if (isReadOnly) {
      setShowcaseData((prev) =>
        prev
          ? {
              ...prev,
              settings: { ...(prev.settings || {}), language: nextLang }
            }
          : prev
      );
      return;
    }
    await updateAppSettings({ language: nextLang });
  };

  const handleToggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (isReadOnly) {
      setShowcaseData((prev) =>
        prev
          ? {
              ...prev,
              settings: { ...(prev.settings || {}), theme: nextTheme }
            }
          : prev
      );
      return;
    }
    await updateAppSettings({ theme: nextTheme });
  };

  // Exit Showcase Mode to Register Own Account
  const handleExitShowcaseToRegister = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('showcase');
    window.history.replaceState({}, '', url.toString());
    setReadOnlyMode(false);
    setShowcaseId(null);
    setShowcaseData(null);
    setIsGuestMode(false);
    setActiveTab('dashboard');
  };

  // Sign out handler
  const handleSignOut = async () => {
    await signOut(auth);
    setImpersonatedBride(null);
    setActiveTargetUid(null);
    setIsGuestMode(false);
    setActiveTab('dashboard');
  };

  // Super Admin Impersonation Handlers
  const handleImpersonateBride = (bride) => {
    setImpersonatedBride(bride);
    setActiveTargetUid(bride.uid);
    setActiveTab('dashboard');
  };

  const handlePrintBrideReport = (bride) => {
    setImpersonatedBride(bride);
    setActiveTargetUid(bride.uid);
    setActiveTab('print');
  };

  const handleExitImpersonation = () => {
    setImpersonatedBride(null);
    if (currentUser?.uid) {
      setActiveTargetUid(currentUser.uid);
    }
    setActiveTab('admin');
  };

  // Check if a category just hit 100% completion after an item update
  const checkAndCelebrateCategory = async (categoryId) => {
    const catItems = await db.items.where('categoryId').equals(categoryId).toArray();
    if (catItems.length > 0 && catItems.every((i) => i.isPurchased)) {
      triggerCategoryCelebration();
    } else {
      triggerMiniSparkle();
    }
  };

  // Item Handlers
  const handleTogglePurchased = async (item) => {
    if (isReadOnly) return;
    const nextPurchased = await toggleItemPurchased(item);
    if (nextPurchased) {
      await checkAndCelebrateCategory(item.categoryId);
    }
  };

  const handleTogglePriority = async (item) => {
    if (isReadOnly) return;
    await toggleItemPriority(item);
  };

  const handleUpdateQty = async (item, delta) => {
    if (isReadOnly) return;
    const wasPurchased = item.isPurchased;
    const { nextPurchased } = await updateItemQuantity(item, delta);
    if (!wasPurchased && nextPurchased) {
      await checkAndCelebrateCategory(item.categoryId);
    }
  };

  const handleSaveItem = async (itemData) => {
    if (isReadOnly) return;
    const wasPurchased = editingItem?.isPurchased;
    const saved = await saveItem(itemData, lang);
    if (!wasPurchased && saved.isPurchased) {
      await checkAndCelebrateCategory(saved.categoryId);
    }
  };

  const handleDeleteItem = async (item) => {
    if (isReadOnly) return;
    if (window.confirm(t.confirmDeleteItem(item.name))) {
      await deleteItem(item.id);
    }
  };

  // Category Handlers
  const handleSaveCategory = async (catData) => {
    if (isReadOnly) return;
    const saved = await saveCategory(catData, lang);
    setSelectedCategoryId(saved.id);
    setActiveTab('categories');
  };

  const handleDeleteCategory = async (cat) => {
    if (isReadOnly) return;
    if (window.confirm(t.confirmDeleteCategory(cat.name))) {
      await deleteCategory(cat.id);
      if (categories.length > 1) {
        const remaining = categories.filter((c) => c.id !== cat.id);
        setSelectedCategoryId(remaining[0]?.id || 'cat-appliances');
      }
    }
  };

  // Search bar handler: if typing from dashboard or backup, switch to shopping/search view
  const handleSearchChange = (q) => {
    setSearchQuery(q);
    if (q.trim() && (activeTab === 'dashboard' || activeTab === 'backup')) {
      setActiveTab('shopping');
    }
  };

  const handleTriggerInstall = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  };

  // Loading Screen
  if (!isDbReady || isAuthChecking || (showcaseId && showcaseLoading)) {
    return (
      <div className="min-h-screen bg-bridal-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-bridal-roseLight text-bridal-roseDark flex items-center justify-center animate-pulse mb-4 shadow-bridal">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-bridal-charcoal">
          رفيقة العروسة 🌸
        </h2>
        <p className="text-xs text-bridal-mauve mt-1">
          {showcaseId
            ? 'جاري تحميل نسخة الجهاز المشتركة...'
            : 'جاري تجهيز قائمة جهازك ومزامنة حسابك السحابي...'}
        </p>
      </div>
    );
  }

  // Showcase Not Found Error Screen
  if (showcaseId && showcaseError) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-bridal-bg flex flex-col items-center justify-center p-6 text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-bridal-charcoal">
          {showcaseError}
        </h2>
        <button
          type="button"
          onClick={handleExitShowcaseToRegister}
          className="px-6 py-3 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white text-sm font-extrabold shadow-bridal"
        >
          إنشاء حساب جديد وتنظيم جهازك مجاناً 🌸
        </button>
      </div>
    );
  }

  // Authentication Screen (if not logged in, not in Guest mode, and not viewing a Showcase link)
  if (!showcaseId && !currentUser && !isGuestMode) {
    return (
      <AuthScreen
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setActiveTargetUid(user.uid);
        }}
        onContinueAsGuest={() => setIsGuestMode(true)}
      />
    );
  }

  // Dedicated Print View
  if (activeTab === 'print') {
    return (
      <PrintReport
        lang={lang}
        categories={categories}
        items={items}
        settings={settings}
        onClose={() => setActiveTab('dashboard')}
      />
    );
  }

  const priorityRemainingCount = items.filter(
    (i) => i.isPriority && !i.isPurchased
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: LayoutDashboard
    },
    {
      id: 'categories',
      label: t.navCategories,
      icon: Layers,
      badge: categories.length
    },
    {
      id: 'shopping',
      label: t.navShopping,
      icon: ShoppingBag,
      badge: priorityRemainingCount > 0 ? priorityRemainingCount : null
    },
    {
      id: 'backup',
      label: t.navBackup,
      icon: ShieldCheck
    },
    ...(isSuperAdmin && !isReadOnly
      ? [
          {
            id: 'admin',
            label: 'لوحة الإدارة 🛡️',
            icon: Shield
          }
        ]
      : [])
  ];

  return (
    <div className="min-h-screen bg-bridal-bg flex flex-col pb-20 md:pb-6">
      {/* 1. Public Read-Only Showcase Banner (?showcase={shareId}) */}
      {isReadOnly && showcaseData && (
        <div
          dir="rtl"
          className="bg-gradient-to-l from-bridal-roseDark via-bridal-rose to-bridal-blush text-white px-4 py-3 shadow-md no-print"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-extrabold">
                وضع استعراض الجهاز المشترك (للقراءة فقط) 👁️
              </span>
              <span className="text-sm sm:text-base font-extrabold">
                {showcaseData.title || `جهاز العروسة ${showcaseData.brideName || ''}`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleExitShowcaseToRegister}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-bridal-roseDark text-xs sm:text-sm font-extrabold shadow-xs hover:bg-bridal-cream transition flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب جديد وتنظيم جهازك مجاناً</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Super Admin Impersonation Control Banner */}
      {isSuperAdmin && impersonatedBride && !isReadOnly && (
        <div
          dir="rtl"
          className="bg-gradient-to-l from-bridal-charcoal via-[#4A3540] to-bridal-charcoal text-white px-4 py-3 border-b border-bridal-gold/40 shadow-md no-print"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
              <span className="p-1.5 rounded-xl bg-bridal-gold/20 text-bridal-gold border border-bridal-gold/40">
                <Eye className="w-4 h-4" />
              </span>
              <span>
                وضع المدير العام: أنت تتصفح الآن حساب العروسة{' '}
                <strong className="text-bridal-gold underline mx-1">
                  [{impersonatedBride.brideName || settings?.brideName || 'العروسة'}]
                </strong>{' '}
                — يمكنك معاينة الأقسام أو تعديل الأصناف والأسعار مباشرة
              </span>
            </div>

            <button
              type="button"
              onClick={handleExitImpersonation}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-bridal-gold text-bridal-charcoal text-xs font-extrabold shadow-xs hover:opacity-95 transition flex-shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للوحة الإدارة العليا</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Sticky Header */}
      <Header
        lang={lang}
        theme={theme}
        onToggleLang={handleToggleLang}
        onToggleTheme={handleToggleTheme}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onOpenAddItem={() => {
          setEditingItem(null);
          setModalDefaultCategoryId(selectedCategoryId || categories[0]?.id);
          setIsItemModalOpen(true);
        }}
        onOpenPrintReport={() => setActiveTab('print')}
        installPromptEvent={installPromptEvent}
        onTriggerInstall={handleTriggerInstall}
        currentUser={currentUser}
        isSuperAdmin={isSuperAdmin && !isReadOnly}
        isReadOnly={isReadOnly}
        onOpenAdminDashboard={() => setActiveTab('admin')}
        onOpenShareShowcase={() => setIsShareModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenAuthScreen={() => setIsGuestMode(false)}
      />

      {/* Desktop Navigation Tabs Bar */}
      <div className="hidden md:block bg-bridal-surface/80 border-b border-bridal-border no-print">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <nav className="flex items-center gap-2">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? tab.id === 'admin'
                        ? 'bg-bridal-charcoal text-bridal-gold shadow-bridal'
                        : 'bg-bridal-rose text-white shadow-bridal'
                      : 'text-bridal-charcoal hover:bg-bridal-cream'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-bridal-roseLight text-bridal-roseDark'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="text-xs text-bridal-mauve font-medium">
            {t.totalRegisteredItems}{' '}
            <span className="font-bold text-bridal-charcoal">
              {items.length} {t.itemsWord}
            </span>{' '}
            {t.inWord}{' '}
            <span className="font-bold text-bridal-charcoal">
              {categories.length} {t.categoriesWord}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard
                lang={lang}
                categories={categories}
                items={items}
                settings={settings}
                onUpdateSettings={updateAppSettings}
                onSelectCategory={(catId) => {
                  setSelectedCategoryId(catId);
                  setActiveTab('categories');
                }}
                onOpenNewCategory={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                onOpenShoppingMode={(filterId) => {
                  setActiveFilter(filterId || 'priority');
                  setActiveTab('shopping');
                }}
                onOpenShareShowcase={
                  !isReadOnly ? () => setIsShareModalOpen(true) : undefined
                }
                isReadOnly={isReadOnly}
                showPrices={showPrices}
              />
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <CategoryView
                lang={lang}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                items={items}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                searchQuery={searchQuery}
                onTogglePurchased={handleTogglePurchased}
                onTogglePriority={handleTogglePriority}
                onUpdateQty={handleUpdateQty}
                onAddItem={(catId) => {
                  setEditingItem(null);
                  setModalDefaultCategoryId(catId);
                  setIsItemModalOpen(true);
                }}
                onEditItem={(item) => {
                  setEditingItem(item);
                  setIsItemModalOpen(true);
                }}
                onDeleteItem={handleDeleteItem}
                onEditCategory={(cat) => {
                  setEditingCategory(cat);
                  setIsCategoryModalOpen(true);
                }}
                onDeleteCategory={handleDeleteCategory}
                onAddCategory={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                isReadOnly={isReadOnly}
                showPrices={showPrices}
              />
            </motion.div>
          )}

          {activeTab === 'shopping' && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ShoppingMode
                lang={lang}
                categories={categories}
                items={items}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                searchQuery={searchQuery}
                onTogglePurchased={handleTogglePurchased}
                onTogglePriority={handleTogglePriority}
                onUpdateQty={handleUpdateQty}
                onEditItem={(item) => {
                  setEditingItem(item);
                  setIsItemModalOpen(true);
                }}
                onDeleteItem={handleDeleteItem}
                onAddItem={(catId) => {
                  setEditingItem(null);
                  setModalDefaultCategoryId(catId || selectedCategoryId);
                  setIsItemModalOpen(true);
                }}
                isReadOnly={isReadOnly}
                showPrices={showPrices}
              />
            </motion.div>
          )}

          {activeTab === 'backup' && (
            <motion.div
              key="backup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <BackupManager
                lang={lang}
                categories={categories}
                items={items}
                settings={settings}
                isStoragePersisted={isStoragePersisted}
                onOpenPrintReport={() => setActiveTab('print')}
                onOpenShareShowcase={
                  !isReadOnly ? () => setIsShareModalOpen(true) : undefined
                }
                isReadOnly={isReadOnly}
              />
            </motion.div>
          )}

          {activeTab === 'admin' && isSuperAdmin && !isReadOnly && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AdminDashboard
                currentUser={currentUser}
                activeTargetUid={activeTargetUid}
                onImpersonateBride={handleImpersonateBride}
                onPrintBrideReport={handlePrintBrideReport}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Bottom Navigation Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bridal-surface/95 backdrop-blur-md border-t border-bridal-border px-2 py-1.5 shadow-bridal-lg no-print">
        <div
          className={`grid ${
            navItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4'
          } gap-1 max-w-md mx-auto`}
        >
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-bridal-roseLight text-bridal-roseDark font-extrabold'
                    : 'text-bridal-mauve font-medium hover:text-bridal-charcoal'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] leading-tight truncate w-full text-center">
                  {tab.label}
                </span>
                {tab.badge && (
                  <span className="absolute top-1 left-2 bg-bridal-rose text-white text-[9px] font-bold px-1.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Add / Edit Item Modal */}
      {!isReadOnly && (
        <ItemModal
          lang={lang}
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          onSave={handleSaveItem}
          initialItem={editingItem}
          categories={categories}
          defaultCategoryId={modalDefaultCategoryId}
        />
      )}

      {/* Add / Edit Category Modal */}
      {!isReadOnly && (
        <CategoryModal
          lang={lang}
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={handleSaveCategory}
          initialCategory={editingCategory}
        />
      )}

      {/* Share Read-Only Showcase Modal */}
      {!isReadOnly && (
        <ShareShowcaseModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          targetUid={activeTargetUid}
          defaultBrideName={settings?.brideName || 'أحلى عروسة'}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
