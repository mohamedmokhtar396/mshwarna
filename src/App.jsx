import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Layers,
  ShoppingBag,
  ShieldCheck,
  Shield,
  Eye,
  ArrowRight,
  UserPlus,
  Wrench,
  Users
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
  updateAppSettings,
  appendItemImages,
  removeItemImage,
  saveSubcategoryMeta,
  exportDatabasePayload,
  decodeSharePayload
} from './db';
import { defaultSettings, initialCategories, initialItems } from './seedData';
import {
  translations,
  getLocalizedItem,
  getLocalizedCategory
} from './i18n';
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
import ImageLightbox from './components/ImageLightbox';
import ShareFianceModal from './components/ShareFianceModal';
import FianceSharedView from './components/FianceSharedView';
import RefreshSafetyModal from './components/RefreshSafetyModal';
import InstallAppModal, { detectMobilePlatform } from './components/InstallAppModal';
import FinishingLedger from './components/FinishingLedger';
import EngineerSharedView from './components/EngineerSharedView';
import CoupleRoomView from './components/CoupleRoomView';
import SmartBudgetModal from './components/SmartBudgetModal';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isStoragePersisted, setIsStoragePersisted] = useState(false);

  // Auth & Cloud State
  const [currentUser, setCurrentUser] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [activeTargetUid, setActiveTargetUid] = useState(null);
  const [impersonatedBride, setImpersonatedBride] = useState(null);

  // Public Showcase Mode (?showcase={shareId} or ?engineer_ledger={shareId})
  const [showcaseId, setShowcaseId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('showcase') || null;
  });
  const [engineerShareId, setEngineerShareId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('engineer_ledger') || null;
  });
  const [engineerLedgerSharedData, setEngineerLedgerSharedData] = useState(null);
  const [showcaseData, setShowcaseData] = useState(null);
  const [showcaseLoading, setShowcaseLoading] = useState(false);
  const [showcaseError, setShowcaseError] = useState('');

  // Navigation Tabs: 'dashboard' | 'categories' | 'shopping' | 'finishing' | 'couple' | 'backup' | 'print' | 'admin'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [printDefaultDocType, setPrintDefaultDocType] = useState('report');
  const [isSmartBudgetOpen, setIsSmartBudgetOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat-appliances');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation History Stack for Back (<) and Forward (>) buttons
  const [historyStack, setHistoryStack] = useState([
    { activeTab: 'dashboard', selectedCategoryId: 'cat-appliances', activeFilter: 'all' }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isNavigatingHistoryRef = useRef(false);

  // Modals State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalDefaultCategoryId, setModalDefaultCategoryId] = useState('cat-appliances');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [hasUnsavedFormChanges, setHasUnsavedFormChanges] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isShareFianceModalOpen, setIsShareFianceModalOpen] = useState(false);
  const [fianceSharedData, setFianceSharedData] = useState(null);
  const [isRefreshWarningOpen, setIsRefreshWarningOpen] = useState(false);

  // Lightbox State
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
    title: '',
    itemId: null
  });

  // PWA Install Prompt & Guide Modal State
  const [installPromptEvent, setInstallPromptEvent] = useState(
    () => (typeof window !== 'undefined' && window.__deferredInstallPrompt) || null
  );
  const [isAppInstalled, setIsAppInstalled] = useState(
    () => detectMobilePlatform().isStandalone
  );
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [installModalGender, setInstallModalGender] = useState(null);

  const isSuperAdmin = Boolean(
    currentUser?.email &&
      currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
  );

  // 1. Initialize Local Dexie & Listen for PWA Install Events
  useEffect(() => {
    let mounted = true;
    initializeDatabase().then(async () => {
      const persisted = await ensurePersistentStorage();
      if (mounted) {
        setIsStoragePersisted(persisted);
        setIsDbReady(true);
      }
    });

    if (window.__deferredInstallPrompt) {
      setInstallPromptEvent(window.__deferredInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.__deferredInstallPrompt = e;
      setInstallPromptEvent(e);
    };

    const handleCustomInstallAvailable = (e) => {
      if (e.detail) {
        setInstallPromptEvent(e.detail);
      }
    };

    const handleAppInstalled = () => {
      window.__deferredInstallPrompt = null;
      setInstallPromptEvent(null);
      setIsAppInstalled(true);
      setIsInstallModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handleCustomInstallAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      mounted = false;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-available', handleCustomInstallAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 2. Load Public Showcase Snapshot if ?showcase={shareId} or ?engineer_ledger={shareId} is present
  useEffect(() => {
    if (engineerShareId) {
      let mounted = true;
      setShowcaseLoading(true);
      fetchSharedShowcaseProfile(engineerShareId)
        .then((snap) => {
          if (!mounted) return;
          if (snap) {
            setEngineerLedgerSharedData(snap);
          } else {
            setShowcaseError('رابط كشف حساب المهندس غير موجود أو انتهت صلاحيته.');
          }
        })
        .catch(() => {
          if (mounted) setShowcaseError('تعذر تحميل كشف حساب المهندس المشترك.');
        })
        .finally(() => {
          if (mounted) setShowcaseLoading(false);
        });
      return () => {
        mounted = false;
      };
    }

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
  }, [showcaseId, engineerShareId]);

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
    const fallbackProfile =
      impersonatedBride && impersonatedBride.uid === activeTargetUid
        ? impersonatedBride
        : null;
    const unsubCloud = subscribeToBrideCloudData(
      activeTargetUid,
      undefined,
      fallbackProfile
    );
    return () => unsubCloud();
  }, [activeTargetUid, showcaseId, impersonatedBride]);

  // Import fiancé reply payload helper
  const handleImportFianceReply = async (replyPayload) => {
    if (!replyPayload) return 0;
    let count = 0;

    if (replyPayload.notesMap && typeof replyPayload.notesMap === 'object') {
      for (const [itemId, noteText] of Object.entries(replyPayload.notesMap)) {
        if (noteText) {
          await db.items.update(itemId, { fianceNote: noteText });
          count++;
        }
      }
    }

    if (Array.isArray(replyPayload.newSuggestions)) {
      for (const sug of replyPayload.newSuggestions) {
        if (sug?.name) {
          await saveItem(
            {
              categoryId: 'cat-appliances',
              name: sug.name,
              subcategory: 'مقترح الخطيب',
              requiredQty: 1,
              purchasedQty: 0,
              isPriority: true,
              isPurchased: false,
              notes: sug.note || '',
              fianceNote: `مقترح من الخطيب: ${sug.note || sug.name}`
            },
            'ar'
          );
          count++;
        }
      }
    }

    return count;
  };

  // Check URL Hash for #share=... or #fiance_reply=...
  useEffect(() => {
    const checkHash = async () => {
      const hash = window.location.hash || '';
      if (hash.startsWith('#share=')) {
        const encoded = hash.replace('#share=', '');
        const decoded = decodeSharePayload(encoded);
        if (decoded && Array.isArray(decoded.items)) {
          setFianceSharedData(decoded);
        }
      } else if (hash.startsWith('#engineer_ledger=')) {
        const encoded = hash.replace('#engineer_ledger=', '');
        const decoded = decodeSharePayload(encoded);
        if (decoded) {
          setEngineerLedgerSharedData(decoded);
        }
      } else if (hash.startsWith('#fiance_reply=')) {
        const encoded = hash.replace('#fiance_reply=', '');
        const decoded = decodeSharePayload(encoded);
        if (decoded) {
          const importedCount = await handleImportFianceReply(decoded);
          window.history.replaceState(null, '', window.location.pathname);
          if (importedCount > 0) {
            triggerCategoryCelebration();
          }
        }
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

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
  const baseSettings = isReadOnly
    ? showcaseData?.settings || defaultSettings
    : localSettings || defaultSettings;

  // Ensure that when Super Admin is impersonating a user, their name & gender are reflected immediately even on the first render tick
  const settings =
    impersonatedBride && impersonatedBride.uid === activeTargetUid
      ? {
          ...baseSettings,
          brideName:
            impersonatedBride.brideName ||
            baseSettings?.brideName ||
            'أحلى عروسة',
          gender:
            impersonatedBride.gender ||
            baseSettings?.gender ||
            'female'
        }
      : baseSettings;

  const lang = settings?.language || 'ar';
  const theme = settings?.theme || 'light';
  const gender = settings?.gender || 'female';
  const t = translations[lang] || translations.ar;

  // Apply RTL/LTR direction, Dark/Light theme class, and Groom ('theme-male') class to <html>
  // Women's theme ('female') never adds 'theme-male', keeping women's colors 100% untouched.
  useEffect(() => {
    const root = document.documentElement;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.lang = lang;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (gender === 'male') {
      root.classList.add('theme-male');
    } else {
      root.classList.remove('theme-male');
    }
    if (typeof window !== 'undefined' && window.syncGenderAppIcons) {
      window.syncGenderAppIcons(gender === 'male' ? 'male' : 'female');
    }
  }, [lang, theme, gender]);

  // Keep selectedCategoryId valid when categories switch between Bride and Groom templates
  useEffect(() => {
    if (
      categories &&
      categories.length > 0 &&
      !categories.some((c) => c.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Track navigation history whenever activeTab, selectedCategoryId, or activeFilter changes
  useEffect(() => {
    if (isNavigatingHistoryRef.current) {
      isNavigatingHistoryRef.current = false;
      return;
    }
    setHistoryStack((prev) => {
      const currentTop = prev[historyIndex];
      if (
        currentTop &&
        currentTop.activeTab === activeTab &&
        currentTop.selectedCategoryId === selectedCategoryId &&
        currentTop.activeFilter === activeFilter
      ) {
        return prev;
      }
      const nextStack = prev.slice(0, historyIndex + 1);
      nextStack.push({ activeTab, selectedCategoryId, activeFilter });
      setHistoryIndex(nextStack.length - 1);
      return nextStack;
    });
  }, [activeTab, selectedCategoryId, activeFilter]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyStack.length - 1;

  const handleGoBack = () => {
    if (!canGoBack) return;
    const prevStep = historyStack[historyIndex - 1];
    if (prevStep) {
      isNavigatingHistoryRef.current = true;
      setHistoryIndex(historyIndex - 1);
      setActiveTab(prevStep.activeTab);
      setSelectedCategoryId(prevStep.selectedCategoryId);
      setActiveFilter(prevStep.activeFilter);
    }
  };

  const handleGoForward = () => {
    if (!canGoForward) return;
    const nextStep = historyStack[historyIndex + 1];
    if (nextStep) {
      isNavigatingHistoryRef.current = true;
      setHistoryIndex(historyIndex + 1);
      setActiveTab(nextStep.activeTab);
      setSelectedCategoryId(nextStep.selectedCategoryId);
      setActiveFilter(nextStep.activeFilter);
    }
  };

  const handleSafeRefresh = () => {
    if (hasUnsavedFormChanges || settings?.hasUnbackedChanges || !navigator.onLine) {
      setIsRefreshWarningOpen(true);
    } else {
      window.location.reload();
    }
  };

  const handleDownloadBackupAndRefresh = async () => {
    try {
      const payload = await exportDatabasePayload();
      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const now = new Date();
      const fileName = `bridal_jihaz_backup_${now.getFullYear()}_${String(
        now.getMonth() + 1
      ).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}.json`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn(err);
    }
    setIsRefreshWarningOpen(false);
    setTimeout(() => window.location.reload(), 400);
  };

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

  const handleExitImpersonation = async () => {
    setImpersonatedBride(null);
    if (currentUser?.uid) {
      setActiveTargetUid(currentUser.uid);
      await initializeUserCloudProfile(currentUser);
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
    const loc = getLocalizedItem(item, lang);
    if (window.confirm(t.confirmDeleteItem(loc.displayName || item.name))) {
      await deleteItem(item.id);
    }
  };

  const handleQuickUploadItemPhotos = async (itemId, newImages, isInvoice = false) => {
    if (isReadOnly) return;
    await appendItemImages(itemId, newImages, isInvoice);
    triggerMiniSparkle();
  };

  const handleOpenLightbox = (images, currentIndex = 0, title = '', itemId = null) => {
    setLightboxState({
      isOpen: true,
      images,
      currentIndex,
      title,
      itemId
    });
  };

  const handleDeleteLightboxImage = async (imageId) => {
    if (!lightboxState.itemId || isReadOnly) return;
    await removeItemImage(lightboxState.itemId, imageId);
    const remaining = lightboxState.images.filter((i) => i.id !== imageId);
    if (remaining.length === 0) {
      setLightboxState((prev) => ({ ...prev, isOpen: false }));
    } else {
      setLightboxState((prev) => ({
        ...prev,
        images: remaining,
        currentIndex: Math.min(prev.currentIndex, remaining.length - 1)
      }));
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
    const loc = getLocalizedCategory(cat, lang);
    if (window.confirm(t.confirmDeleteCategory(loc.displayName || cat.name))) {
      await deleteCategory(cat.id);
      if (categories.length > 1) {
        const remaining = categories.filter((c) => c.id !== cat.id);
        setSelectedCategoryId(remaining[0]?.id || 'cat-appliances');
      }
    }
  };

  // Search bar handler
  const handleSearchChange = (q) => {
    setSearchQuery(q);
    if (q.trim() && (activeTab === 'dashboard' || activeTab === 'backup')) {
      setActiveTab('shopping');
    }
  };

  // 1-Click Native Install if supported, otherwise open the step-by-step iPhone/Android Install Guide Modal
  const handleTriggerNativeInstall = async () => {
    const promptEvent = installPromptEvent || window.__deferredInstallPrompt;
    if (!promptEvent) return false;
    try {
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult?.outcome === 'accepted') {
        window.__deferredInstallPrompt = null;
        setInstallPromptEvent(null);
        setIsAppInstalled(true);
      }
      return true;
    } catch (err) {
      console.warn('Native install prompt error:', err);
      return false;
    }
  };

  const handleInstallButtonClick = async (preferredGender) => {
    const effectiveGender =
      preferredGender === 'male' || preferredGender === 'female'
        ? preferredGender
        : gender;
    setInstallModalGender(effectiveGender);
    if (typeof window !== 'undefined' && window.syncGenderAppIcons) {
      window.syncGenderAppIcons(effectiveGender);
    }
    const promptEvent = installPromptEvent || window.__deferredInstallPrompt;
    if (promptEvent) {
      const triggered = await handleTriggerNativeInstall();
      if (triggered) return;
    }
    // Fallback: Open interactive step-by-step instructions modal for iPhone & Android
    setIsInstallModalOpen(true);
  };

  // Loading Screen with Bride / Groom Portrait Icon
  if (!isDbReady || isAuthChecking || (showcaseId && showcaseLoading)) {
    const savedGender =
      (typeof window !== 'undefined' && localStorage.getItem('meshwarna_gender')) ||
      gender;
    return (
      <div className="min-h-screen bg-bridal-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-bridal-gold animate-pulse mb-4 shadow-bridal-lg bg-bridal-surface">
          <img
            src={savedGender === 'male' ? '/groom-icon-192.png' : '/icon-192.png'}
            alt="م-شوارنا"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-xl font-extrabold text-bridal-charcoal">
          م-شوارنا 🌸💍
        </h2>
        <p className="text-xs text-bridal-mauve mt-1">
          {showcaseId
            ? 'جاري تحميل نسخة الجهاز المشتركة...'
            : 'جاري تجهيز قائمة جهازك ومزامنة حسابك السحابي...'}
        </p>
      </div>
    );
  }

  // Engineer Shared Ledger View (Requires ZERO Registration!)
  if (engineerLedgerSharedData) {
    return (
      <EngineerSharedView
        ledgerData={engineerLedgerSharedData}
        onExitPreview={() => {
          setEngineerLedgerSharedData(null);
          setEngineerShareId(null);
          const url = new URL(window.location.href);
          url.searchParams.delete('engineer_ledger');
          window.history.replaceState(null, '', url.pathname);
        }}
      />
    );
  }

  // Fiancé Shared Guest View (Requires ZERO Registration!)
  if (fianceSharedData) {
    return (
      <FianceSharedView
        shareData={fianceSharedData}
        lang={lang}
        onExitPreview={() => {
          setFianceSharedData(null);
          if (window.location.hash.startsWith('#share=')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        onSaveLocalSuggestions={handleImportFianceReply}
      />
    );
  }

  // Showcase Not Found Error Screen
  if (showcaseId && showcaseError) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-bridal-bg flex flex-col items-center justify-center p-6 text-center space-y-4"
      >
        <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-bridal-gold shadow-bridal mx-auto">
          <img
            src="/icon-192.png"
            alt="رفيقة العروسة"
            className="w-full h-full object-cover"
          />
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
      <>
        <AuthScreen
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setActiveTargetUid(user.uid);
          }}
          onContinueAsGuest={() => setIsGuestMode(true)}
          onTriggerInstall={handleInstallButtonClick}
          isAppInstalled={isAppInstalled}
        />
        <InstallAppModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          installPromptEvent={installPromptEvent}
          onTriggerNativeInstall={handleTriggerNativeInstall}
          lang={lang}
          gender={installModalGender || gender}
          onChangeGenderIcon={(nextG) => setInstallModalGender(nextG)}
        />
      </>
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
        defaultDocType={printDefaultDocType}
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
      id: 'finishing',
      label: 'عهدة التشطيب 👷‍♂️',
      icon: Wrench
    },
    {
      id: 'couple',
      label: 'شقتنا المشتركة 🏡',
      icon: Users
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
    <div className="min-h-screen bg-bridal-bg flex flex-col pb-20 md:pb-6 transition-colors">
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
        gender={gender}
        onToggleLang={handleToggleLang}
        onToggleTheme={handleToggleTheme}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onSafeRefresh={handleSafeRefresh}
        hasUnbackedChanges={Boolean(settings?.hasUnbackedChanges || hasUnsavedFormChanges)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onOpenAddItem={() => {
          setEditingItem(null);
          setModalDefaultCategoryId(selectedCategoryId || categories[0]?.id);
          setIsItemModalOpen(true);
        }}
        onOpenPrintReport={() => setActiveTab('print')}
        onOpenShareFiance={!isReadOnly ? () => setIsShareFianceModalOpen(true) : undefined}
        onOpenShareShowcase={!isReadOnly ? () => setIsShareModalOpen(true) : undefined}
        isAppInstalled={isAppInstalled}
        onTriggerInstall={handleInstallButtonClick}
        currentUser={currentUser}
        isSuperAdmin={isSuperAdmin && !isReadOnly}
        isReadOnly={isReadOnly}
        onOpenAdminDashboard={() => setActiveTab('admin')}
        onSignOut={handleSignOut}
        onOpenAuthScreen={() => setIsGuestMode(false)}
      />

      {/* Desktop Navigation Tabs Bar */}
      <div className="hidden md:block bg-bridal-surface/80 border-b border-bridal-border no-print transition-colors">
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
                onOpenShareFiance={
                  !isReadOnly ? () => setIsShareFianceModalOpen(true) : undefined
                }
                onOpenShareShowcase={
                  !isReadOnly ? () => setIsShareModalOpen(true) : undefined
                }
                onOpenFinishingLedger={() => setActiveTab('finishing')}
                onOpenCoupleRoom={() => setActiveTab('couple')}
                onOpenPrintQayma={() => {
                  setPrintDefaultDocType('qayma');
                  setActiveTab('print');
                }}
                onOpenSmartBudget={() => setIsSmartBudgetOpen(true)}
                onEditItem={(item) => {
                  setEditingItem(item);
                  setIsItemModalOpen(true);
                }}
                onTriggerInstall={handleInstallButtonClick}
                isAppInstalled={isAppInstalled}
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
                onQuickUploadItemPhotos={handleQuickUploadItemPhotos}
                onSaveCategoryDirect={handleSaveCategory}
                onSaveSubcategoryMeta={saveSubcategoryMeta}
                onOpenLightbox={handleOpenLightbox}
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
                onQuickUploadItemPhotos={handleQuickUploadItemPhotos}
                onOpenLightbox={handleOpenLightbox}
                isReadOnly={isReadOnly}
                showPrices={showPrices}
              />
            </motion.div>
          )}

          {activeTab === 'finishing' && (
            <motion.div
              key="finishing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <FinishingLedger
                lang={lang}
                settings={settings}
                onUpdateSettings={updateAppSettings}
                onOpenLightbox={handleOpenLightbox}
                onPreviewEngineerView={(ledgerPayload) =>
                  setEngineerLedgerSharedData(ledgerPayload)
                }
                isReadOnly={isReadOnly}
              />
            </motion.div>
          )}

          {activeTab === 'couple' && (
            <motion.div
              key="couple"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <CoupleRoomView
                settings={settings}
                items={items}
                onUpdateSettings={updateAppSettings}
                onOpenPrintQayma={() => {
                  setPrintDefaultDocType('qayma');
                  setActiveTab('print');
                }}
                isReadOnly={isReadOnly}
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bridal-surface/95 backdrop-blur-md border-t border-bridal-border px-1.5 py-1.5 shadow-bridal-lg no-print transition-colors">
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar max-w-lg mx-auto">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 min-w-[58px] flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
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
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          onSave={handleSaveItem}
          initialItem={editingItem}
          categories={categories}
          defaultCategoryId={modalDefaultCategoryId}
          lang={lang}
          onFormDirtyChange={setHasUnsavedFormChanges}
        />
      )}

      {/* Add / Edit Category Modal */}
      {!isReadOnly && (
        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={handleSaveCategory}
          initialCategory={editingCategory}
          lang={lang}
          onFormDirtyChange={setHasUnsavedFormChanges}
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

      {/* Share with Fiancé Modal */}
      {!isReadOnly && (
        <ShareFianceModal
          isOpen={isShareFianceModalOpen}
          onClose={() => setIsShareFianceModalOpen(false)}
          lang={lang}
          categories={categories}
          items={items}
          settings={settings}
          onPreviewFianceMode={(payload) => {
            setIsShareFianceModalOpen(false);
            setFianceSharedData(payload);
          }}
          onImportFianceReply={handleImportFianceReply}
        />
      )}

      {/* Fullscreen Image & Invoice Lightbox */}
      <ImageLightbox
        isOpen={lightboxState.isOpen}
        images={lightboxState.images}
        currentIndex={lightboxState.currentIndex}
        title={lightboxState.title}
        onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
        onDeleteImage={lightboxState.itemId ? handleDeleteLightboxImage : undefined}
      />

      {/* Safe Refresh Warning Modal */}
      <RefreshSafetyModal
        isOpen={isRefreshWarningOpen}
        lang={lang}
        hasUnsavedForm={hasUnsavedFormChanges}
        onClose={() => setIsRefreshWarningOpen(false)}
        onDownloadBackupAndRefresh={handleDownloadBackupAndRefresh}
        onRefreshAnyway={() => window.location.reload()}
      />

      {/* Mobile App Download / Install Steps Modal (iOS & Android) */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        installPromptEvent={installPromptEvent}
        onTriggerNativeInstall={handleTriggerNativeInstall}
        lang={lang}
        gender={installModalGender || gender}
        onChangeGenderIcon={(nextG) => setInstallModalGender(nextG)}
      />

      {/* Smart Budget Allocation Calculator Modal */}
      <SmartBudgetModal
        isOpen={isSmartBudgetOpen}
        onClose={() => setIsSmartBudgetOpen(false)}
        settings={settings}
        onApplyBudget={(newTotal) => updateAppSettings({ totalBudget: newTotal })}
      />
    </div>
  );
}
