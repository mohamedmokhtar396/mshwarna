import Dexie from 'dexie';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db as firestoreDb } from './firebaseConfig';
import { initialCategories, initialItems, defaultSettings } from './seedData';
import { groomInitialCategories, groomInitialItems } from './groomSeedData';

/**
 * Smart Gender Detector from Arabic/English First Name or Email (for 1-Click Google Sign-In)
 */
const COMMON_MALE_NAMES = new Set([
  'mohamed', 'mohammed', 'muhammad', 'ahmed', 'ahmad', 'mahmoud', 'mostafa', 'mustafa',
  'ali', 'omar', 'youssef', 'yousef', 'youssef', 'karim', 'kareem', 'hassan', 'hussein',
  'ibrahim', 'amr', 'khaled', 'khalid', 'tarek', 'tariq', 'hossam', 'eslam', 'islam',
  'ziad', 'zeyad', 'marwan', 'seif', 'saif', 'adel', 'sherif', 'hazem', 'ramy', 'rami',
  'tamer', 'walid', 'waleed', 'wael', 'ayman', 'ashraf', 'osama', 'sameh', 'hany', 'hani',
  'mina', 'kirollos', 'abanoub', 'george', 'peter', 'michael', 'fady', 'beshoy', 'bola',
  'abdallah', 'abdelrahman', 'hamza', 'mazen', 'bassem', 'nasser', 'salah', 'gamal',
  'magdy', 'medhat', 'emad', 'alaa', 'essam', 'hatem', 'maged', 'farouk', 'fouad',
  'محمد', 'أحمد', 'احمد', 'محمود', 'مصطفى', 'مصطفي', 'علي', 'على', 'عمر', 'يوسف',
  'كريم', 'حسن', 'حسين', 'إبراهيم', 'ابراهيم', 'عمرو', 'خالد', 'طارق', 'حسام',
  'إسلام', 'اسلام', 'زياد', 'مروان', 'سيف', 'عادل', 'شريف', 'حازم', 'رامي', 'رامى',
  'تامر', 'وليد', 'وائل', 'أيمن', 'ايمن', 'أشرف', 'اشرف', 'أسامة', 'اسامة', 'سامح',
  'هاني', 'هانى', 'مينا', 'كيرلس', 'أبانوب', 'ابانوب', 'جورج', 'بيتر', 'مايكل', 'فادي',
  'بيشوي', 'عبدالله', 'عبدالرحمن', 'حمزة', 'مازن', 'باسم', 'ياسر', 'عماد', 'مجدى', 'مجدي'
]);

export function detectGenderFromName(displayName = '', email = '') {
  const cleanName = String(displayName || '').trim().toLowerCase();
  const firstWord = cleanName.split(/\s+/)[0] || '';
  if (COMMON_MALE_NAMES.has(firstWord)) {
    return 'male';
  }
  const emailPrefix = String(email || '').split('@')[0]?.toLowerCase() || '';
  for (const maleName of COMMON_MALE_NAMES) {
    if (maleName.length >= 4 && emailPrefix.startsWith(maleName)) {
      return 'male';
    }
  }
  return 'female';
}

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

  const detectedGender =
    extraMeta.gender ||
    detectGenderFromName(firebaseUser.displayName, rawEmail);

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
      (detectedGender === 'male' ? 'أحلى عريس' : 'أحلى عروسة'),
    gender: detectedGender,
    photoURL: firebaseUser.photoURL || extraMeta.photoURL || '',
    authMethod
  };
}

/**
 * Helper to write a target user's categories, items, and settings into local Dexie
 */
async function writeSnapshotToDexie({ categories, items, settings, profileFallback = {} }) {
  const effectiveName =
    settings?.brideName &&
    settings.brideName !== 'Lovely Bride' &&
    settings.brideName !== 'أحلى عروسة' &&
    settings.brideName !== 'أحلى عريس'
      ? settings.brideName
      : profileFallback?.brideName ||
        profileFallback?.displayName ||
        settings?.brideName ||
        'أحلى عروسة';

  const effectiveGender =
    settings?.gender ||
    profileFallback?.gender ||
    detectGenderFromName(effectiveName, profileFallback?.email || '');

  const isMale = effectiveGender === 'male';
  const defaultCats = isMale ? groomInitialCategories : initialCategories;
  const defaultItms = isMale ? groomInitialItems : initialItems;

  const finalCategories =
    Array.isArray(categories) && categories.length > 0 ? categories : defaultCats;
  const finalItems =
    Array.isArray(items) && items.length > 0 ? items : defaultItms;

  const finalSettings = {
    ...defaultSettings,
    ...(settings || {}),
    id: 'app-settings',
    language: settings?.language || 'ar',
    gender: effectiveGender,
    brideName: effectiveName,
    phoneNumber: settings?.phoneNumber || profileFallback?.phoneNumber || '',
    weddingDate: settings?.weddingDate || profileFallback?.weddingDate || '',
    totalBudget:
      Number(settings?.totalBudget) ||
      Number(profileFallback?.totalBudget) ||
      300000
  };

  try {
    isApplyingRemoteSnapshot = true;
    await db.transaction('rw', db.categories, db.items, db.settings, async () => {
      await db.categories.clear();
      await db.items.clear();
      await db.categories.bulkPut(finalCategories);
      await db.items.bulkPut(finalItems);
      await db.settings.put(finalSettings);
    });
  } catch (e) {
    console.warn('Error writing snapshot to Dexie:', e);
  } finally {
    isApplyingRemoteSnapshot = false;
  }
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

    const resolvedName =
      cleanSettings.brideName &&
      cleanSettings.brideName !== 'Lovely Bride'
        ? cleanSettings.brideName
        : activeUserMeta.brideName || cleanSettings.brideName || 'أحلى عروسة';

    // Save to top-level user doc (including categories/items/settings so it always works even if subcollections are restricted)
    const userDocPromise = setDoc(
      userDocRef,
      {
        uid: targetUid,
        brideName: resolvedName,
        gender: cleanSettings.gender || activeUserMeta.gender || 'female',
        ...(cleanSettings.phoneNumber ? { phoneNumber: cleanSettings.phoneNumber } : {}),
        ...(cleanSettings.partnerCode ? { partnerCode: cleanSettings.partnerCode } : {}),
        ...(cleanSettings.linkedPartnerUid
          ? { linkedPartnerUid: cleanSettings.linkedPartnerUid }
          : {}),
        weddingDate: cleanSettings.weddingDate || '',
        totalBudget: metrics.totalBudget,
        totalSpent: metrics.totalSpent,
        totalCashPaid: metrics.totalCashPaid,
        totalRemainingDebt: metrics.totalRemainingDebt,
        totalItemsCount: metrics.totalItemsCount,
        purchasedItemsCount: metrics.purchasedItemsCount,
        priorityItemsCount: metrics.priorityItemsCount,
        completionPercentage: metrics.completionPercentage,
        categories,
        items,
        settings: cleanSettings,
        updatedAt: nowIso,
        lastActiveAt: nowIso
      },
      { merge: true }
    );

    const trousseauDocPromise = setDoc(
      trousseauRef,
      {
        categories,
        items,
        settings: cleanSettings,
        updatedAt: nowIso
      },
      { merge: true }
    ).catch(() => {});

    await Promise.all([userDocPromise, trousseauDocPromise]);
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
      getDoc(userDocRef).catch(() => null),
      getDoc(trousseauRef).catch(() => null)
    ]);

    const existingUser = userSnap && userSnap.exists() ? userSnap.data() : null;
    const existingTrousseau =
      trousseauSnap && trousseauSnap.exists() ? trousseauSnap.data() : null;

    const effectiveGender =
      extraMeta.gender ||
      existingTrousseau?.settings?.gender ||
      existingUser?.settings?.gender ||
      existingUser?.gender ||
      userDetails.gender ||
      'female';

    const isMale = effectiveGender === 'male';
    let categoriesToUse = isMale ? groomInitialCategories : initialCategories;
    let itemsToUse = isMale ? groomInitialItems : initialItems;
    const defaultPartnerCode =
      existingUser?.partnerCode ||
      existingTrousseau?.settings?.partnerCode ||
      `MSH-${uid.slice(0, 4).toUpperCase()}`;

    let settingsToUse = {
      ...defaultSettings,
      language: 'ar',
      gender: effectiveGender,
      partnerCode: defaultPartnerCode,
      linkedPartnerUid:
        existingTrousseau?.settings?.linkedPartnerUid ||
        existingUser?.linkedPartnerUid ||
        '',
      brideName:
        extraMeta.brideName ||
        existingUser?.brideName ||
        userDetails.brideName ||
        (isMale ? 'أحلى عريس' : 'أحلى عروسة'),
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

    const sourceData =
      existingTrousseau &&
      Array.isArray(existingTrousseau.categories) &&
      existingTrousseau.categories.length > 0
        ? existingTrousseau
        : existingUser &&
          Array.isArray(existingUser.categories) &&
          existingUser.categories.length > 0
        ? existingUser
        : null;

    if (sourceData) {
      categoriesToUse = sourceData.categories;
      itemsToUse = Array.isArray(sourceData.items) ? sourceData.items : itemsToUse;
      settingsToUse = {
        ...defaultSettings,
        ...(sourceData.settings || {}),
        gender:
          extraMeta.gender ||
          sourceData.settings?.gender ||
          existingUser?.gender ||
          effectiveGender,
        brideName:
          extraMeta.brideName ||
          existingUser?.brideName ||
          sourceData.settings?.brideName ||
          userDetails.brideName ||
          (isMale ? 'أحلى عريس' : 'أحلى عروسة'),
        phoneNumber:
          extraMeta.phoneNumber ||
          existingUser?.phoneNumber ||
          sourceData.settings?.phoneNumber ||
          userDetails.phoneNumber ||
          '',
        weddingDate:
          extraMeta.weddingDate ||
          existingUser?.weddingDate ||
          sourceData.settings?.weddingDate ||
          '',
        totalBudget:
          extraMeta.totalBudget !== undefined
            ? parseArabicNumber(extraMeta.totalBudget) || 300000
            : Number(existingUser?.totalBudget) ||
              Number(sourceData.settings?.totalBudget) ||
              300000,
        id: 'app-settings',
        lastUpdated: sourceData.updatedAt || nowIso
      };
    } else {
      await setDoc(trousseauRef, {
        categories: categoriesToUse,
        items: itemsToUse,
        settings: settingsToUse,
        updatedAt: nowIso
      }).catch(() => {});
    }

    const metrics = calculateTrousseauMetrics(itemsToUse, settingsToUse);

    const userProfilePayload = {
      uid,
      brideName: settingsToUse.brideName || (isMale ? 'أحلى عريس' : 'أحلى عروسة'),
      gender: settingsToUse.gender || effectiveGender,
      partnerCode: settingsToUse.partnerCode || defaultPartnerCode,
      linkedPartnerUid: settingsToUse.linkedPartnerUid || '',
      email: existingUser?.email || userDetails.email || '',
      phoneNumber:
        settingsToUse.phoneNumber ||
        existingUser?.phoneNumber ||
        userDetails.phoneNumber ||
        '',
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
      categories: categoriesToUse,
      items: itemsToUse,
      settings: settingsToUse,
      createdAt: existingUser?.createdAt || nowIso,
      lastActiveAt: nowIso
    };

    await setDoc(userDocRef, userProfilePayload, { merge: true }).catch(() => {});

    await writeSnapshotToDexie({
      categories: categoriesToUse,
      items: itemsToUse,
      settings: settingsToUse,
      profileFallback: userProfilePayload
    });

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
 * (Used both for the logged-in user AND when Super Admin impersonates any user)
 */
export function subscribeToBrideCloudData(
  targetUid,
  onUserProfileChange,
  initialProfileFallback = null
) {
  if (!targetUid) return () => {};

  setActiveCloudUid(targetUid, initialProfileFallback || {});
  const trousseauRef = doc(firestoreDb, 'users', targetUid, 'data', 'trousseau');
  const userDocRef = doc(firestoreDb, 'users', targetUid);

  let latestUserProfile = initialProfileFallback || {};
  let hasAppliedTrousseauSubdoc = false;

  // If Super Admin just clicked a user in Admin Dashboard, immediately switch Dexie to their profile so there is zero stale data from previous user!
  if (initialProfileFallback && initialProfileFallback.uid === targetUid) {
    writeSnapshotToDexie({
      categories: initialProfileFallback.categories,
      items: initialProfileFallback.items,
      settings: initialProfileFallback.settings,
      profileFallback: initialProfileFallback
    });
  }

  const unsubTrousseau = onSnapshot(
    trousseauRef,
    async (snap) => {
      if (!snap.exists()) {
        // Fallback to userDocRef if subdoc doesn't exist
        const userSnap = await getDoc(userDocRef).catch(() => null);
        const userData =
          userSnap && userSnap.exists()
            ? userSnap.data()
            : latestUserProfile || {};

        await writeSnapshotToDexie({
          categories: userData.categories,
          items: userData.items,
          settings: userData.settings,
          profileFallback: userData
        });
        return;
      }

      const data = snap.data();
      if (data.updatedAt && data.updatedAt === lastLocalWriteStamp) {
        return;
      }

      if (Array.isArray(data.categories) && Array.isArray(data.items)) {
        hasAppliedTrousseauSubdoc = true;
        await writeSnapshotToDexie({
          categories: data.categories,
          items: data.items,
          settings: data.settings,
          profileFallback: latestUserProfile
        });
      }
    },
    (err) => {
      console.warn('Trousseau subdoc listener fallback to user doc:', err);
    }
  );

  const unsubUser = onSnapshot(
    userDocRef,
    async (snap) => {
      if (snap.exists()) {
        const profile = { ...snap.data(), uid: snap.id };
        latestUserProfile = profile;
        activeUserMeta = { ...activeUserMeta, ...profile };
        if (onUserProfileChange) {
          onUserProfileChange(profile);
        }

        if (profile.updatedAt && profile.updatedAt === lastLocalWriteStamp) {
          return;
        }

        // If subdoc hasn't provided categories/items, or if userDoc has categories/items or updated profile metadata, sync Dexie!
        if (!hasAppliedTrousseauSubdoc || Array.isArray(profile.categories)) {
          await writeSnapshotToDexie({
            categories: profile.categories,
            items: profile.items,
            settings: profile.settings,
            profileFallback: profile
          });
        } else {
          // Even if subdoc exists, ensure brideName, gender, totalBudget, weddingDate from profile are reflected in Dexie settings
          const currentSettings = (await db.settings.get('app-settings')) || defaultSettings;
          const resolvedGender =
            profile.gender ||
            currentSettings.gender ||
            detectGenderFromName(profile.brideName || '', profile.email || '');
          await db.settings.put({
            ...currentSettings,
            id: 'app-settings',
            brideName: profile.brideName || currentSettings.brideName,
            gender: resolvedGender,
            phoneNumber: profile.phoneNumber || currentSettings.phoneNumber || '',
            weddingDate: profile.weddingDate || currentSettings.weddingDate || '',
            totalBudget: Number(profile.totalBudget) || Number(currentSettings.totalBudget) || 300000
          });
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
    getDoc(doc(firestoreDb, 'users', uidToExport(targetUid)))
  ]);
  function uidToExport(u) {
    return u;
  }

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
        language: 'ar',
        hasUnbackedChanges: false
      });
    });
  } else {
    const existingSettings = await db.settings.get('app-settings');
    if (!existingSettings) {
      await db.settings.put({
        ...defaultSettings,
        language: 'ar',
        hasUnbackedChanges: false
      });
    }
  }
}

/**
 * Touch lastUpdated timestamp in settings whenever data changes & sync to cloud
 */
export async function touchLastUpdated(markUnbacked = true) {
  if (isReadOnlyMode) return;
  try {
    const updateObj = {
      lastUpdated: new Date().toISOString()
    };
    if (markUnbacked) {
      updateObj.hasUnbackedChanges = true;
    }
    await db.settings.update('app-settings', updateObj);
  } catch {
    // ignore if settings not yet initialized
  }
  await syncCurrentDexieToCloud();
}

/**
 * Mark backup as up-to-date
 */
export async function markBackupCompleted() {
  try {
    await db.settings.update('app-settings', {
      hasUnbackedChanges: false,
      lastBackedUpAt: new Date().toISOString()
    });
  } catch {
    // ignore
  }
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
  await touchLastUpdated(true);
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
  await touchLastUpdated(true);
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
  await touchLastUpdated(true);
  return { nextQty, nextPurchased };
}

/**
 * Save or Create an Item (including product/price-quote images & invoice photos)
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
    nextInstallmentDate:
      itemData.nextInstallmentDate !== undefined
        ? itemData.nextInstallmentDate
        : existing?.nextInstallmentDate || '',
    deliveryDate:
      itemData.deliveryDate !== undefined
        ? itemData.deliveryDate
        : existing?.deliveryDate || '',
    notes: lang === 'ar' ? trimmedNotes : existing?.notes ?? trimmedNotes,
    notesEn: lang === 'en' ? trimmedNotes : existing?.notesEn ?? trimmedNotes,
    images: Array.isArray(itemData.images) ? itemData.images : existing?.images || [],
    invoiceImages: Array.isArray(itemData.invoiceImages)
      ? itemData.invoiceImages
      : existing?.invoiceImages || [],
    fianceNote: itemData.fianceNote !== undefined ? itemData.fianceNote : existing?.fianceNote || ''
  };

  await db.items.put(record);
  await touchLastUpdated(true);
  return record;
}

/**
 * Quick helper to append photos or invoices directly to an item from ItemCard
 */
export async function appendItemImages(itemId, newImages = [], isInvoice = false) {
  if (isReadOnlyMode) return;
  const existing = await db.items.get(itemId);
  if (!existing) return;
  if (isInvoice) {
    const updatedInvoices = [...(existing.invoiceImages || []), ...newImages];
    await db.items.update(itemId, { invoiceImages: updatedInvoices });
  } else {
    const updatedImages = [...(existing.images || []), ...newImages];
    await db.items.update(itemId, { images: updatedImages });
  }
  await touchLastUpdated(true);
}

/**
 * Remove a specific image from an item
 */
export async function removeItemImage(itemId, imageId) {
  if (isReadOnlyMode) return;
  const existing = await db.items.get(itemId);
  if (!existing) return;
  const updatedImages = (existing.images || []).filter((img) => img.id !== imageId);
  const updatedInvoices = (existing.invoiceImages || []).filter((img) => img.id !== imageId);
  await db.items.update(itemId, {
    images: updatedImages,
    invoiceImages: updatedInvoices
  });
  await touchLastUpdated(true);
}

/**
 * Delete an Item
 */
export async function deleteItem(itemId) {
  if (isReadOnlyMode) return;
  await db.items.delete(itemId);
  await touchLastUpdated(true);
}

/**
 * Save or Create a Category (including category cover image & subcategory metadata)
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
    icon: catData.icon || existing?.icon || 'Sparkles',
    color: catData.color || existing?.color || '#D88C9A',
    image: catData.image !== undefined ? catData.image : existing?.image || null,
    subcategoriesMeta:
      catData.subcategoriesMeta !== undefined
        ? catData.subcategoriesMeta
        : existing?.subcategoriesMeta || {},
    order: catData.order || existing?.order || count + 1
  };
  await db.categories.put(record);
  await touchLastUpdated(true);
  return record;
}

/**
 * Save photo & notes for a specific subcategory inside a category
 */
export async function saveSubcategoryMeta(categoryId, subcategoryName, meta) {
  if (isReadOnlyMode) return;
  const existing = await db.categories.get(categoryId);
  if (!existing) return;
  const currentMeta = existing.subcategoriesMeta || {};
  const updatedMeta = {
    ...currentMeta,
    [subcategoryName]: {
      ...(currentMeta[subcategoryName] || {}),
      ...meta,
      updatedAt: new Date().toISOString()
    }
  };
  await db.categories.update(categoryId, { subcategoriesMeta: updatedMeta });
  await touchLastUpdated(true);
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
  await touchLastUpdated(true);
}

/**
 * Update overall app settings
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

  await markBackupCompleted();

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
        hasUnbackedChanges: false,
        lastUpdated: new Date().toISOString()
      });
    }
  });

  await syncCurrentDexieToCloud();
}

/**
 * Reset database back to factory pre-seeded state (preserving current language, theme & gender)
 */
export async function resetDatabaseToDefault(genderOverride = null) {
  if (isReadOnlyMode) return;
  const currentSettings = await db.settings.get('app-settings');
  const targetGender = genderOverride || currentSettings?.gender || 'female';
  const isMale = targetGender === 'male';

  await db.transaction('rw', db.categories, db.items, db.settings, async () => {
    await db.categories.clear();
    await db.items.clear();
    await db.settings.clear();
    await db.categories.bulkPut(isMale ? groomInitialCategories : initialCategories);
    await db.items.bulkPut(isMale ? groomInitialItems : initialItems);
    await db.settings.put({
      ...defaultSettings,
      gender: targetGender,
      brideName:
        currentSettings?.brideName &&
        currentSettings.brideName !== 'Lovely Bride' &&
        currentSettings.brideName !== 'أحلى عروسة' &&
        currentSettings.brideName !== 'أحلى عريس'
          ? currentSettings.brideName
          : isMale
          ? 'أحلى عريس'
          : 'أحلى عروسة',
      phoneNumber: currentSettings?.phoneNumber || '',
      weddingDate: currentSettings?.weddingDate || '',
      language: currentSettings?.language || 'ar',
      theme: currentSettings?.theme || 'light',
      hasUnbackedChanges: false,
      lastUpdated: new Date().toISOString()
    });
  });

  await syncCurrentDexieToCloud();
}

/**
 * Switch account between Bride ('female') and Groom ('male') mode,
 * optionally loading the default categories & items for that gender if currently using unmodified seed data or requested.
 */
export async function switchAccountGenderAndTemplate(newGender = 'female', loadGenderChecklist = true) {
  if (isReadOnlyMode) return;
  if (loadGenderChecklist) {
    await resetDatabaseToDefault(newGender);
  } else {
    await updateAppSettings({ gender: newGender });
  }
}

/**
 * Encode a compact shareable snapshot for the Fiancé (no registration required)
 */
export function encodeSharePayload(data) {
  try {
    const json = JSON.stringify(data);
    return btoa(encodeURIComponent(json));
  } catch (err) {
    console.error('Failed to encode share payload:', err);
    return '';
  }
}

/**
 * Decode a shareable snapshot from URL hash (#share=...)
 */
export function decodeSharePayload(encodedStr) {
  try {
    const json = decodeURIComponent(atob(encodedStr));
    return JSON.parse(json);
  } catch (err) {
    console.error('Failed to decode share payload:', err);
    return null;
  }
}

/**
 * Default Shared Agreements list for the Couple Room ("شقتنا المشتركة")
 */
export const DEFAULT_COUPLE_AGREEMENTS = [
  { id: 'agr-1', title: 'الأثاث والخشب الكامل (نوم، سفرة، صالون، ركنة)', assignedTo: 'groom', status: 'in_progress', budgetNote: '' },
  { id: 'agr-2', title: 'تشطيب الشقة والسباكة والكهرباء والدهانات', assignedTo: 'groom', status: 'in_progress', budgetNote: '' },
  { id: 'agr-3', title: 'الأجهزة الكهربائية الكبيرة والرفايع', assignedTo: 'bride', status: 'in_progress', budgetNote: '' },
  { id: 'agr-4', title: 'أطقم المطبخ والصيني والحلل والمفروشات', assignedTo: 'bride', status: 'in_progress', budgetNote: '' },
  { id: 'agr-5', title: 'التكييفات والسخان والشفاط', assignedTo: 'shared', status: 'pending', budgetNote: 'بالاتفاق بين الطرفين' },
  { id: 'agr-6', title: 'السجاد والستائر والنجف', assignedTo: 'shared', status: 'pending', budgetNote: 'بالاتفاق بين الطرفين' },
  { id: 'agr-7', title: 'قاعة الفرح والتصوير وشهر العسل', assignedTo: 'groom', status: 'pending', budgetNote: '' }
];

/**
 * Link current user's account with their partner (Bride <-> Groom) by Partner Code, Phone Number, or Email
 */
export async function linkWithPartnerByCodeOrPhone(searchInput) {
  const clean = String(searchInput || '').trim();
  if (!clean) {
    throw new Error('يرجى إدخال كود الشريك (مثال: MSH-1A2B) أو رقم الموبايل.');
  }

  const usersRef = collection(firestoreDb, 'users');
  const upperCode = clean.toUpperCase();

  // Try matching by partnerCode, phoneNumber, or email
  const snapAll = await getDocs(usersRef);
  let matchedUser = null;

  snapAll.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data || data.uid === activeCloudUid) return;
    const pCode = String(data.partnerCode || `MSH-${String(data.uid || '').slice(0, 4)}`).toUpperCase();
    const phone = String(data.phoneNumber || '').trim();
    const email = String(data.email || '').trim().toLowerCase();

    if (
      pCode === upperCode ||
      pCode.replace('MSH-', '') === upperCode.replace('MSH-', '') ||
      (phone && phone === clean) ||
      (email && email === clean.toLowerCase())
    ) {
      matchedUser = data;
    }
  });

  if (!matchedUser) {
    throw new Error(
      'لم يتم العثور على حساب شريك بهذا الكود أو رقم الموبايل. تأكد من أن شريكك سجل حساباً على المنصة.'
    );
  }

  await updateAppSettings({
    linkedPartnerUid: matchedUser.uid,
    linkedPartnerName: matchedUser.brideName || 'شريك حياتي',
    linkedPartnerGender: matchedUser.gender || 'female'
  });

  // Also reciprocally set linkedPartnerUid on partner's user doc if possible
  if (activeCloudUid) {
    try {
      await setDoc(
        doc(firestoreDb, 'users', matchedUser.uid),
        { linkedPartnerUid: activeCloudUid },
        { merge: true }
      );
    } catch {
      // ignore if restricted
    }
  }

  return matchedUser;
}

/**
 * Subscribe in real time to the linked partner's profile & trousseau data
 */
export function subscribeToLinkedPartnerData(partnerUid, callback) {
  if (!partnerUid) return () => {};

  const partnerUserRef = doc(firestoreDb, 'users', partnerUid);
  const partnerTrousseauRef = doc(firestoreDb, 'users', partnerUid, 'data', 'trousseau');

  let latestProfile = null;
  let latestTrousseau = null;

  const emit = () => {
    if (callback) {
      callback({
        profile: latestProfile,
        trousseau: latestTrousseau
      });
    }
  };

  const unsub1 = onSnapshot(
    partnerUserRef,
    (snap) => {
      if (snap.exists()) {
        latestProfile = snap.data();
        emit();
      }
    },
    () => {}
  );

  const unsub2 = onSnapshot(
    partnerTrousseauRef,
    (snap) => {
      if (snap.exists()) {
        latestTrousseau = snap.data();
        emit();
      }
    },
    () => {}
  );

  return () => {
    unsub1();
    unsub2();
  };
}

/**
 * Default Finishing Custody Ledger structure
 */
export const DEFAULT_FINISHING_LEDGER = {
  engineerName: '',
  engineerPhone: '',
  apartmentTitle: 'تشطيب شقة الزوجية',
  supervisionFeePercent: 0,
  advances: [],
  expenses: []
};

/**
 * Create a shareable Engineer Custody Ledger link (saved to Firestore `shared_profiles/eng_{id}` + hash fallback)
 */
export async function createEngineerLedgerShareLink({
  ledger,
  ownerName = 'صاحب الشقة'
}) {
  const cleanLedger = ledger || DEFAULT_FINISHING_LEDGER;
  const shareId = `eng-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  const payload = {
    shareId,
    type: 'engineer_ledger',
    ownerName,
    engineerName: cleanLedger.engineerName || 'المهندس المشرف',
    engineerPhone: cleanLedger.engineerPhone || '',
    apartmentTitle: cleanLedger.apartmentTitle || 'تشطيب شقة الزوجية',
    supervisionFeePercent: Number(cleanLedger.supervisionFeePercent) || 0,
    advances: Array.isArray(cleanLedger.advances) ? cleanLedger.advances : [],
    expenses: Array.isArray(cleanLedger.expenses) ? cleanLedger.expenses : [],
    createdAt: nowIso
  };

  let shareUrl = '';
  try {
    await setDoc(doc(firestoreDb, 'shared_profiles', shareId), payload);
    shareUrl = `${window.location.origin}${window.location.pathname}?engineer_ledger=${shareId}`;
  } catch (err) {
    console.warn('Cloud engineer share fallback to URL hash:', err);
    // Compact hash fallback without heavy base64 images if offline
    const compactPayload = {
      ...payload,
      advances: payload.advances.map(({ receiptImages, ...rest }) => rest),
      expenses: payload.expenses.map(({ invoiceImages, ...rest }) => rest)
    };
    const encoded = encodeSharePayload(compactPayload);
    shareUrl = `${window.location.origin}${window.location.pathname}#engineer_ledger=${encoded}`;
  }

  return { shareId, shareUrl, payload };
}

