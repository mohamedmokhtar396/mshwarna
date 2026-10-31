import Dexie from 'dexie';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db as firestoreDb } from './firebaseConfig';
import { initialCategories, initialItems, defaultSettings } from './seedData';

export const db = new Dexie('BridalTrousseauDB');

db.version(1).stores({
  categories: 'id, name, order',
  items: 'id, categoryId, name, subcategory, isPurchased, isPriority',
  settings: 'id'
});

// Active Cloud Sync State
let activeCloudUid = null;
let activeUserMeta = {};
let isApplyingRemoteSnapshot = false;
let isReadOnlyMode = false;
let lastLocalWriteStamp = '';

export function setReadOnlyMode(flag) {
  isReadOnlyMode = Boolean(flag);
}

export function getReadOnlyMode() {
  return isReadOnlyMode;
}

export function getActiveCloudUid() {
  return activeCloudUid;
}

export function setActiveCloudUid(uid, meta = {}) {
  activeCloudUid = uid || null;
  if (meta && typeof meta === 'object') {
    activeUserMeta = { ...activeUserMeta, ...meta };
  }
}

/**
 * Request persistent storage on mobile browsers (iOS Safari / Android Chrome)
 * so IndexedDB is protected from automatic eviction.
 */
export async function ensurePersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        await navigator.storage.persist();
      }
      return await navigator.storage.persisted();
    }
  } catch (err) {
    console.warn('Persistent storage request warning:', err);
  }
  return false;
}

/**
 * Normalize Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) to standard numbers
 * so any input works seamlessly on Arabic or English mobile keyboards.
 */
export function parseArabicNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, val);
  const str = String(val)
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[^0-9.]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Format number in clean currency format (supports English & Arabic locales)
 */
export function formatCurrency(amount, lang = 'ar') {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Compute summary financial & completion metrics from items and settings
 */
export function calculateTrousseauMetrics(items = [], settings = {}) {
  const totalItemsCount = items.length;
  const purchasedItemsCount = items.filter((i) => Boolean(i.isPurchased)).length;
  const priorityItemsCount = items.filter((i) => Boolean(i.isPriority)).length;
  const completionPercentage =
    totalItemsCount > 0 ? Math.round((purchasedItemsCount / totalItemsCount) * 100) : 0;

  const totalActualCost = items.reduce((sum, i) => sum + (Number(i.actualPrice) || 0), 0);
  const totalRemainingDebt = items.reduce(
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

  const totalSpent = Math.max(totalActualCost, totalCashPaid + totalRemainingDebt);
  const totalBudget = Number(settings?.totalBudget) || 300000;

  return {
    totalBudget,
    totalSpent,
    totalCashPaid,
    totalRemainingDebt,
    totalItemsCount,
    purchasedItemsCount,
    priorityItemsCount,
    completionPercentage
  };
}

/**
 * Extract clean phone / authMethod from a Firebase Auth user
 */
export function deriveUserAuthDetails(firebaseUser, extraMeta = {}) {
  if (!firebaseUser) return {};
  const rawEmail = firebaseUser.email || '';
  const isPhoneSynthetic = rawEmail.endsWith('@phone.gehaz-el3rosa.com');
  const extractedPhone = isPhoneSynthetic ? rawEmail.split('@')[0] : '';

  const providerId = firebaseUser.providerData?.[0]?.providerId || '';
  let authMethod = extraMeta.authMethod || 'email';
  if (isPhoneSynthetic) {
    authMethod = 'phone';
  } else if (providerId.includes('google')) {
    authMethod = 'google';
  }

  return {
    uid: firebaseUser.uid,
    email: isPhoneSynthetic ? (extraMeta.realEmail || rawEmail) : rawEmail,
    phoneNumber:
      extraMeta.phoneNumber ||
      firebaseUser.phoneNumber ||
      extractedPhone ||
      '',
    brideName:
      extraMeta.brideName ||
      firebaseUser.displayName ||
      'أحلى عروسة',
    photoURL: firebaseUser.photoURL || extraMeta.photoURL || '',
    authMethod
  };
}

/**
 * Push current local Dexie state to Cloud Firestore for the active target user
 */
export async function syncCurrentDexieToCloud(uidOverride = null) {
  const targetUid = uidOverride || activeCloudUid;
  if (!targetUid || isApplyingRemoteSnapshot || isReadOnlyMode) return;

  try {
    const [categories, items, settings] = await Promise.all([
      db.categories.orderBy('order').toArray(),
      db.items.toArray(),
      db.settings.get('app-settings')
    ]);

    const nowIso = new Date().toISOString();
    lastLocalWriteStamp = nowIso;

    const cleanSettings = {
      ...defaultSettings,
      ...(settings || {}),
      id: 'app-settings',
      lastUpdated: nowIso
    };

    const metrics = calculateTrousseauMetrics(items, cleanSettings);

    const trousseauRef = doc(firestoreDb, 'users', targetUid, 'data', 'trousseau');
    const userDocRef = doc(firestoreDb, 'users', targetUid);

    await Promise.all([
      setDoc(
        trousseauRef,
        {
          categories,
          items,
          settings: cleanSettings,
          updatedAt: nowIso
        },
        { merge: true }
      ),
      setDoc(
        userDocRef,
        {
          uid: targetUid,
          brideName:
            cleanSettings.brideName &&
            cleanSettings.brideName !== 'Lovely Bride'
              ? cleanSettings.brideName
              : activeUserMeta.brideName || cleanSettings.brideName || 'أحلى عروسة',
          ...(cleanSettings.phoneNumber ? { phoneNumber: cleanSettings.phoneNumber } : {}),
          weddingDate: cleanSettings.weddingDate || '',
          totalBudget: metrics.totalBudget,
          totalSpent: metrics.totalSpent,
          totalCashPaid: metrics.totalCashPaid,
          totalRemainingDebt: metrics.totalRemainingDebt,
          totalItemsCount: metrics.totalItemsCount,
          purchasedItemsCount: metrics.purchasedItemsCount,
          priorityItemsCount: metrics.priorityItemsCount,
          completionPercentage: metrics.completionPercentage,
          lastActiveAt: nowIso
        },
        { merge: true }
      )
    ]);
  } catch (err) {
    console.warn('Cloud sync warning (queued offline if disconnected):', err);
  }
}

/**
 * Initialize or load a user's Cloud Firestore profile & trousseau upon login/signup
 */
export async function initializeUserCloudProfile(firebaseUser, extraMeta = {}) {
  if (!firebaseUser?.uid) return null;

  const userDetails = deriveUserAuthDetails(firebaseUser, extraMeta);
  const uid = firebaseUser.uid;
  const nowIso = new Date().toISOString();

  const userDocRef = doc(firestoreDb, 'users', uid);
  const trousseauRef = doc(firestoreDb, 'users', uid, 'data', 'trousseau');

  try {
    const [userSnap, trousseauSnap] = await Promise.all([
      getDoc(userDocRef),
      getDoc(trousseauRef)
    ]);

    const existingUser = userSnap.exists() ? userSnap.data() : null;
    const existingTrousseau = trousseauSnap.exists() ? trousseauSnap.data() : null;

    let categoriesToUse = initialCategories;
    let itemsToUse = initialItems;
    let settingsToUse = {
      ...defaultSettings,
      language: 'ar',
      brideName:
        extraMeta.brideName ||
        existingUser?.brideName ||
        userDetails.brideName ||
        'أحلى عروسة',
      phoneNumber:
        extraMeta.phoneNumber ||
        existingUser?.phoneNumber ||
        userDetails.phoneNumber ||
        '',
      weddingDate:
        extraMeta.weddingDate ||
        existingUser?.weddingDate ||
        '',
      totalBudget:
        extraMeta.totalBudget !== undefined
          ? parseArabicNumber(extraMeta.totalBudget) || 300000
          : existingUser?.totalBudget || 300000,
      lastUpdated: nowIso
    };

    if (
      existingTrousseau &&
      Array.isArray(existingTrousseau.categories) &&
      existingTrousseau.categories.length > 0 &&
      Array.isArray(existingTrousseau.items)
    ) {
      categoriesToUse = existingTrousseau.categories;
      itemsToUse = existingTrousseau.items;
      settingsToUse = {
        ...defaultSettings,
        ...(existingTrousseau.settings || {}),
        brideName:
          extraMeta.brideName ||
          existingTrousseau.settings?.brideName ||
          existingUser?.brideName ||
          userDetails.brideName ||
          'أحلى عروسة',
        phoneNumber:
          extraMeta.phoneNumber ||
          existingTrousseau.settings?.phoneNumber ||
          existingUser?.phoneNumber ||
          userDetails.phoneNumber ||
          '',
        weddingDate:
          extraMeta.weddingDate ||
          existingTrousseau.settings?.weddingDate ||
          existingUser?.weddingDate ||
          '',
        totalBudget:
          extraMeta.totalBudget !== undefined
            ? parseArabicNumber(extraMeta.totalBudget) || 300000
            : Number(existingTrousseau.settings?.totalBudget) ||
              Number(existingUser?.totalBudget) ||
              300000,
        id: 'app-settings',
        lastUpdated: existingTrousseau.updatedAt || nowIso
      };
    } else {
      // First time bride! Auto-seed her Firestore trousseau document
      await setDoc(trousseauRef, {
        categories: categoriesToUse,
        items: itemsToUse,
        settings: settingsToUse,
        updatedAt: nowIso
      });
    }

    const metrics = calculateTrousseauMetrics(itemsToUse, settingsToUse);

    const userProfilePayload = {
      uid,
      brideName: settingsToUse.brideName || 'أحلى عروسة',
      email: existingUser?.email || userDetails.email || '',
      phoneNumber: settingsToUse.phoneNumber || existingUser?.phoneNumber || userDetails.phoneNumber || '',
      authMethod: existingUser?.authMethod || userDetails.authMethod || 'email',
      photoURL: userDetails.photoURL || existingUser?.photoURL || '',
      weddingDate: settingsToUse.weddingDate || '',
      totalBudget: metrics.totalBudget,
      totalSpent: metrics.totalSpent,
      totalCashPaid: metrics.totalCashPaid,
      totalRemainingDebt: metrics.totalRemainingDebt,
      totalItemsCount: metrics.totalItemsCount,
      purchasedItemsCount: metrics.purchasedItemsCount,
      priorityItemsCount: metrics.priorityItemsCount,
      completionPercentage: metrics.completionPercentage,
      createdAt: existingUser?.createdAt || nowIso,
      lastActiveAt: nowIso
    };

    await setDoc(userDocRef, userProfilePayload, { merge: true });

    // Mirror to local Dexie DB
    isApplyingRemoteSnapshot = true;
    await db.transaction('rw', db.categories, db.items, db.settings, async () => {
      await db.categories.clear();
      await db.items.clear();
      await db.categories.bulkPut(categoriesToUse);
      await db.items.bulkPut(itemsToUse);
      await db.settings.put(settingsToUse);
    });
    isApplyingRemoteSnapshot = false;

    setActiveCloudUid(uid, userProfilePayload);
    return userProfilePayload;
  } catch (err) {
    isApplyingRemoteSnapshot = false;
    console.error('Error initializing user cloud profile:', err);
    setActiveCloudUid(uid, userDetails);
    return userDetails;
  }
}

/**
 * Subscribe to a target bride's Firestore trousseau & profile in real-time
 * Used both for the logged-in bride AND when Super Admin impersonates any bride.
 */
export function subscribeToBrideCloudData(targetUid, onUserProfileChange) {
  if (!targetUid) return () => {};

  setActiveCloudUid(targetUid);
  const trousseauRef = doc(firestoreDb, 'users', targetUid, 'data', 'trousseau');
  const userDocRef = doc(firestoreDb, 'users', targetUid);

  const unsubTrousseau = onSnapshot(
    trousseauRef,
    async (snap) => {
      if (!snap.exists()) {
        // Seed if target user has no trousseau doc yet
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const nowIso = new Date().toISOString();
        const seededSettings = {
          ...defaultSettings,
          language: 'ar',
          brideName: userData.brideName || 'أحلى عروسة',
          phoneNumber: userData.phoneNumber || '',
          weddingDate: userData.weddingDate || '',
          totalBudget: Number(userData.totalBudget) || 300000,
          id: 'app-settings',
          lastUpdated: nowIso
        };
        await setDoc(trousseauRef, {
          categories: initialCategories,
          items: initialItems,
          settings: seededSettings,
          updatedAt: nowIso
        });
        return;
      }

      const data = snap.data();
      if (data.updatedAt && data.updatedAt === lastLocalWriteStamp) {
        return;
      }

      if (Array.isArray(data.categories) && Array.isArray(data.items)) {
        try {
          isApplyingRemoteSnapshot = true;
          await db.transaction('rw', db.categories, db.items, db.settings, async () => {
            await db.categories.clear();
            await db.items.clear();
            await db.categories.bulkPut(data.categories);
            await db.items.bulkPut(data.items);
            if (data.settings) {
              await db.settings.put({
                ...defaultSettings,
                ...data.settings,
                id: 'app-settings'
              });
            }
          });
        } catch (e) {
          console.warn('Error applying remote snapshot to Dexie:', e);
        } finally {
          isApplyingRemoteSnapshot = false;
        }
      }
    },
    (err) => {
      console.warn('Trousseau snapshot listener error:', err);
    }
  );

  const unsubUser = onSnapshot(
    userDocRef,
    (snap) => {
      if (snap.exists()) {
        const profile = snap.data();
        activeUserMeta = { ...activeUserMeta, ...profile };
        if (onUserProfileChange) {
          onUserProfileChange(profile);
        }
      }
    },
    (err) => {
      console.warn('User profile snapshot listener error:', err);
    }
  );

  return () => {
    unsubTrousseau();
    unsubUser();
  };
}

/**
 * Create a read-only shared showcase profile snapshot in `shared_profiles/{shareId}`
 */
export async function createSharedShowcaseProfile({
  targetUid,
  title,
  showPrices = true,
  createdByUid = '',
  createdByEmail = ''
}) {
  const uidToExport = targetUid || activeCloudUid;
  let categories = [];
  let items = [];
  let settings = defaultSettings;
  let brideName = 'أحلى عروسة';

  if (uidToExport && uidToExport !== activeCloudUid) {
    const [trousseauSnap, userSnap] = await Promise.all([
      getDoc(doc(firestoreDb, 'users', uidToExport, 'data', 'trousseau')),
      getDoc(doc(firestoreDb, 'users', uidToExport))
    ]);
    const tData = trousseauSnap.exists() ? trousseauSnap.data() : null;
    const uData = userSnap.exists() ? userSnap.data() : null;
    categories = tData?.categories || initialCategories;
    items = tData?.items || initialItems;
    settings = tData?.settings || defaultSettings;
    brideName = uData?.brideName || settings?.brideName || 'أحلى عروسة';
  } else {
    categories = await db.categories.orderBy('order').toArray();
    items = await db.items.toArray();
    settings = (await db.settings.get('app-settings')) || defaultSettings;
    brideName = settings?.brideName || activeUserMeta?.brideName || 'أحلى عروسة';
  }

  const shareId = `share-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const nowIso = new Date().toISOString();
  const metrics = calculateTrousseauMetrics(items, settings);

  // Sanitize prices if showPrices is false? We still store items or zero them out if desired,
  // and also store showPrices flag so the Showcase UI respects it!
  const snapshotItems = showPrices
    ? items
    : items.map((item) => ({
        ...item,
        actualPrice: 0,
        estimatedPrice: 0,
        paidAmount: 0,
        remainingAmount: 0
      }));

  const payload = {
    shareId,
    sourceUid: uidToExport || 'local',
    brideName,
    title: (title || `جهاز العروسة ${brideName}`).trim(),
    showPrices: Boolean(showPrices),
    totalBudget: showPrices ? metrics.totalBudget : 0,
    weddingDate: settings?.weddingDate || '',
    categories,
    items: snapshotItems,
    settings: {
      ...settings,
      brideName,
      totalBudget: showPrices ? metrics.totalBudget : 0
    },
    createdAt: nowIso,
    createdBy: createdByUid || uidToExport || 'guest',
    createdByEmail: createdByEmail || ''
  };

  await setDoc(doc(firestoreDb, 'shared_profiles', shareId), payload);

  const shareUrl = `${window.location.origin}${window.location.pathname}?showcase=${shareId}`;
  return { shareId, shareUrl, payload };
}

/**
 * Fetch a shared showcase profile from `shared_profiles/{shareId}`
 */
export async function fetchSharedShowcaseProfile(shareId) {
  if (!shareId) return null;
  const snap = await getDoc(doc(firestoreDb, 'shared_profiles', shareId));
  if (!snap.exists()) return null;
  return snap.data();
}

/**
 * Export a specific bride's full profile data from Firestore (for Super Admin)
 */
export async function exportBrideCloudPayload(targetUid) {
  const [trousseauSnap, userSnap] = await Promise.all([
    getDoc(doc(firestoreDb, 'users', targetUid, 'data', 'trousseau')),
    getDoc(doc(firestoreDb, 'users', targetUid))
  ]);

  const tData = trousseauSnap.exists() ? trousseauSnap.data() : null;
  const uData = userSnap.exists() ? userSnap.data() : null;

  const categories = tData?.categories || initialCategories;
  const items = tData?.items || initialItems;
  const settings = {
    ...defaultSettings,
    ...(tData?.settings || {}),
    brideName: uData?.brideName || tData?.settings?.brideName || 'أحلى عروسة',
    phoneNumber: uData?.phoneNumber || tData?.settings?.phoneNumber || '',
    weddingDate: uData?.weddingDate || tData?.settings?.weddingDate || '',
    totalBudget: Number(uData?.totalBudget) || Number(tData?.settings?.totalBudget) || 300000
  };

  return {
    appName: 'رفيقة العروسة - لتنظيم ومتابعة الجهاز',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    brideProfile: uData || {},
    settings,
    categories,
    items
  };
}

/**
 * Seed the local database if empty on first launch
 */
export async function initializeDatabase() {
  await ensurePersistentStorage();

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.transaction('rw', db.categories, db.items, db.settings, async () => {
      await db.categories.bulkPut(initialCategories);
      await db.items.bulkPut(initialItems);
      await db.settings.put({
        ...defaultSettings,
        language: 'ar'
      });
    });
  } else {
    const existingSettings = await db.settings.get('app-settings');
    if (!existingSettings) {
      await db.settings.put({
        ...defaultSettings,
        language: 'ar'
      });
    }
  }
}

/**
 * Touch lastUpdated timestamp in settings whenever data changes & sync to cloud
 */
export async function touchLastUpdated() {
  if (isReadOnlyMode) return;
  try {
    await db.settings.update('app-settings', {
      lastUpdated: new Date().toISOString()
    });
  } catch {
    // ignore if settings not yet initialized
  }
  await syncCurrentDexieToCloud();
}

/**
 * Toggle Purchased Status of an item
 */
export async function toggleItemPurchased(item) {
  if (isReadOnlyMode) return item.isPurchased;
  const nextPurchased = !item.isPurchased;
  const nextQty = nextPurchased
    ? Math.max(item.purchasedQty || 0, item.requiredQty || 1)
    : 0;

  await db.items.update(item.id, {
    isPurchased: nextPurchased,
    purchasedQty: nextQty
  });
  await touchLastUpdated();
  return nextPurchased;
}

/**
 * Toggle Priority / Favorite Status of an item
 */
export async function toggleItemPriority(item) {
  if (isReadOnlyMode) return item.isPriority;
  const nextPriority = !item.isPriority;
  await db.items.update(item.id, {
    isPriority: nextPriority
  });
  await touchLastUpdated();
  return nextPriority;
}

/**
 * Update Purchased Quantity (+ / -) and auto-sync isPurchased when reaching requiredQty
 */
export async function updateItemQuantity(item, delta) {
  if (isReadOnlyMode) {
    return {
      nextQty: Number(item.purchasedQty) || 0,
      nextPurchased: Boolean(item.isPurchased)
    };
  }
  const reqQty = Math.max(1, Number(item.requiredQty) || 1);
  const currentQty = Number(item.purchasedQty) || 0;
  const nextQty = Math.max(0, currentQty + delta);
  const nextPurchased = nextQty >= reqQty;

  await db.items.update(item.id, {
    purchasedQty: nextQty,
    isPurchased: nextPurchased
  });
  await touchLastUpdated();
  return { nextQty, nextPurchased };
}

/**
 * Save or Create an Item
 */
export async function saveItem(itemData, lang = 'ar') {
  if (isReadOnlyMode) return itemData;
  const actualPrice = parseArabicNumber(itemData.actualPrice);
  const estimatedPrice = parseArabicNumber(itemData.estimatedPrice);
  const paidAmount = parseArabicNumber(itemData.paidAmount);
  const remainingAmount =
    itemData.remainingAmount !== undefined && itemData.remainingAmount !== ''
      ? parseArabicNumber(itemData.remainingAmount)
      : Math.max(0, actualPrice - paidAmount);

  const requiredQty = Math.max(1, Math.round(parseArabicNumber(itemData.requiredQty) || 1));
  const purchasedQty = Math.min(
    Math.max(0, Math.round(parseArabicNumber(itemData.purchasedQty))),
    Math.max(requiredQty, Math.round(parseArabicNumber(itemData.purchasedQty)))
  );

  const isPurchased =
    itemData.isPurchased !== undefined
      ? Boolean(itemData.isPurchased)
      : purchasedQty >= requiredQty && requiredQty > 0;

  const trimmedName = (itemData.name || '').trim();
  const trimmedSub = (itemData.subcategory || (lang === 'en' ? 'General' : 'عام')).trim();
  const trimmedNotes = (itemData.notes || '').trim();
  const trimmedBrand = (itemData.brand || '').trim();
  const trimmedStore = (itemData.storeName || '').trim();

  const existing = itemData.id ? await db.items.get(itemData.id) : null;

  const record = {
    ...(existing || {}),
    id: itemData.id || `item-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    categoryId: itemData.categoryId,
    name: lang === 'ar' ? trimmedName : existing?.name || trimmedName,
    nameEn: lang === 'en' ? trimmedName : existing?.nameEn || trimmedName,
    subcategory: lang === 'ar' ? trimmedSub : existing?.subcategory || trimmedSub,
    subcategoryEn: lang === 'en' ? trimmedSub : existing?.subcategoryEn || trimmedSub,
    requiredQty,
    purchasedQty: isPurchased && purchasedQty === 0 ? requiredQty : purchasedQty,
    estimatedPrice,
    actualPrice,
    paidAmount,
    remainingAmount,
    isPurchased,
    isPriority: Boolean(itemData.isPriority),
    brand: trimmedBrand || existing?.brand || '',
    storeName: trimmedStore || existing?.storeName || '',
    notes: lang === 'ar' ? trimmedNotes : existing?.notes ?? trimmedNotes,
    notesEn: lang === 'en' ? trimmedNotes : existing?.notesEn ?? trimmedNotes
  };

  await db.items.put(record);
  await touchLastUpdated();
  return record;
}

/**
 * Delete an Item
 */
export async function deleteItem(itemId) {
  if (isReadOnlyMode) return;
  await db.items.delete(itemId);
  await touchLastUpdated();
}

/**
 * Save or Create a Category
 */
export async function saveCategory(catData, lang = 'ar') {
  if (isReadOnlyMode) return catData;
  const count = await db.categories.count();
  const existing = catData.id ? await db.categories.get(catData.id) : null;
  const trimmedName = (catData.name || '').trim();
  const trimmedDesc = (catData.description || '').trim();

  const record = {
    ...(existing || {}),
    id: catData.id || `cat-custom-${Date.now()}`,
    name: lang === 'ar' ? trimmedName : existing?.name || trimmedName,
    nameEn: lang === 'en' ? trimmedName : existing?.nameEn || trimmedName,
    description: lang === 'ar' ? trimmedDesc : existing?.description || trimmedDesc,
    descriptionEn: lang === 'en' ? trimmedDesc : existing?.descriptionEn || trimmedDesc,
    icon: catData.icon || 'Sparkles',
    color: catData.color || '#D88C9A',
    order: catData.order || existing?.order || count + 1
  };
  await db.categories.put(record);
  await touchLastUpdated();
  return record;
}

/**
 * Delete a custom category and its items
 */
export async function deleteCategory(categoryId) {
  if (isReadOnlyMode) return;
  await db.transaction('rw', db.categories, db.items, async () => {
    await db.items.where('categoryId').equals(categoryId).delete();
    await db.categories.delete(categoryId);
  });
  await touchLastUpdated();
}

/**
 * Update overall app settings (budget, bride name, phone, wedding date, language, theme)
 */
export async function updateAppSettings(partialSettings) {
  if (isReadOnlyMode) return partialSettings;
  const current = (await db.settings.get('app-settings')) || defaultSettings;
  const updated = {
    ...current,
    ...partialSettings,
    id: 'app-settings',
    lastUpdated: new Date().toISOString()
  };
  await db.settings.put(updated);
  await syncCurrentDexieToCloud();
  return updated;
}

/**
 * Export full database to JSON object
 */
export async function exportDatabasePayload() {
  const [categories, items, settings] = await Promise.all([
    db.categories.orderBy('order').toArray(),
    db.items.toArray(),
    db.settings.get('app-settings')
  ]);

  return {
    appName: 'رفيقة العروسة - لتنظيم ومتابعة الجهاز',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    settings: settings || defaultSettings,
    categories,
    items
  };
}

/**
 * Validate and restore database from a JSON backup object
 */
export async function restoreDatabaseFromPayload(payload) {
  if (isReadOnlyMode) return;
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray(payload.categories) ||
    !Array.isArray(payload.items)
  ) {
    throw new Error('ملف النسخة الاحتياطية غير صالح أو تالف.');
  }

  if (payload.categories.length === 0) {
    throw new Error('ملف النسخة الاحتياطية لا يحتوي على أي أقسام.');
  }

  await db.transaction('rw', db.categories, db.items, db.settings, async () => {
    await db.categories.clear();
    await db.items.clear();
    await db.categories.bulkPut(payload.categories);
    await db.items.bulkPut(payload.items);
    if (payload.settings) {
      await db.settings.put({
        ...defaultSettings,
        ...payload.settings,
        id: 'app-settings',
        lastUpdated: new Date().toISOString()
      });
    }
  });

  await syncCurrentDexieToCloud();
}

/**
 * Reset database back to factory pre-seeded state (preserving current language & theme)
 */
export async function resetDatabaseToDefault() {
  if (isReadOnlyMode) return;
  const currentSettings = await db.settings.get('app-settings');
  await db.transaction('rw', db.categories, db.items, db.settings, async () => {
    await db.categories.clear();
    await db.items.clear();
    await db.settings.clear();
    await db.categories.bulkPut(initialCategories);
    await db.items.bulkPut(initialItems);
    await db.settings.put({
      ...defaultSettings,
      brideName: currentSettings?.brideName || 'أحلى عروسة',
      phoneNumber: currentSettings?.phoneNumber || '',
      weddingDate: currentSettings?.weddingDate || '',
      language: currentSettings?.language || 'ar',
      theme: currentSettings?.theme || 'light',
      lastUpdated: new Date().toISOString()
    });
  });

  await syncCurrentDexieToCloud();
}
