// Full Bilingual Dictionary (English & Arabic) and Localization Helpers
import { initialCategories, initialItems } from './seedData';
import { groomInitialCategories, groomInitialItems } from './groomSeedData';

const seedCategoryMap = {};
[...initialCategories, ...groomInitialCategories].forEach((c) => {
  seedCategoryMap[c.id] = c;
});

const seedItemMap = {};
[...initialItems, ...groomInitialItems].forEach((i) => {
  seedItemMap[i.id] = i;
});

export function getLocalizedCategory(cat, lang = 'en') {
  if (!cat) return { name: '', description: '' };
  const seed = seedCategoryMap[cat.id];
  if (lang === 'en') {
    return {
      ...cat,
      displayName: cat.nameEn || seed?.nameEn || cat.name,
      displayDescription: cat.descriptionEn || seed?.descriptionEn || cat.description
    };
  }
  return {
    ...cat,
    displayName: cat.name || seed?.name || cat.nameEn,
    displayDescription: cat.description || seed?.description || cat.descriptionEn
  };
}

export function getLocalizedItem(item, lang = 'en') {
  if (!item) return { displayName: '', displaySubcategory: '', displayNotes: '' };
  const seed = seedItemMap[item.id];
  if (lang === 'en') {
    return {
      ...item,
      displayName: item.nameEn || seed?.nameEn || item.name,
      displaySubcategory:
        item.subcategoryEn ||
        seed?.subcategoryEn ||
        (item.subcategory === 'عام' ? 'General' : item.subcategory),
      displayNotes: item.notesEn || seed?.notesEn || item.notes
    };
  }
  return {
    ...item,
    displayName: item.name || seed?.name || item.nameEn,
    displaySubcategory:
      item.subcategory ||
      seed?.subcategory ||
      (item.subcategoryEn === 'General' ? 'عام' : item.subcategoryEn),
    displayNotes: item.notes || seed?.notes || item.notesEn
  };
}

export const translations = {
  en: {
    appName: 'Meshwarna | م-شوارنا',
    appSubtitle: 'Smart Bride & Groom Trousseau, Apartment & Budget Planner',
    autoSavedBadge: 'Auto-saved on your device ✓',
    unbackedOfflineBadge: 'Offline edits pending backup',
    searchPlaceholder: 'Search any item, brand, or note...',
    installApp: 'Install App',
    printReportBtn: 'Print List',
    addItemBtn: 'Add Item',
    newItemShort: 'New Item',

    // Navigation History & Safe Refresh
    navBackTooltip: 'Go Back (Previous View)',
    navForwardTooltip: 'Go Forward (Next View)',
    navRefreshTooltip: 'Refresh Page (With Data Safety Check)',
    refreshWarningTitle: 'Hold On! Protect Your Latest Edits 🌸',
    refreshWarningDesc:
      'You have recent offline edits or unsaved text that have not been exported to an external backup file yet.Refreshing keeps your local browser database, but we recommend saving a quick backup first so zero data is ever lost.',
    refreshUnsavedFormWarn:
      'You currently have an open form with unsaved text! Refreshing now will discard what you just typed.',
    downloadBackupFirstBtn: 'Download Backup First (Recommended)',
    refreshAnywayBtn: 'Refresh Page Now',
    stayOnPageBtn: 'Stay & Continue Editing',

    // Share with Fiancé Feature
    shareWithFianceBtn: 'Share with Fiancé 💍',
    shareModalTitle: 'Share Trousseau & Favorites with Fiancé 💍',
    shareModalSubtitle:
      'Generate an instant link for your fiancé—he can view what you bought & your favorites and add his suggestions without creating an account!',
    fianceNameLabel: "Fiancé's Name (Optional)",
    fianceNamePlaceholder: 'e.g., Ahmed',
    whatToShareLabel: 'Choose What to Include in the Link:',
    shareOptPurchased: 'Purchased Items ✅',
    shareOptFavorites: 'Favorites & Priorities ⭐',
    shareOptRemaining: 'Remaining Items ⏳',
    shareOptPrices: 'Include Prices & Budget Details 💰',
    personalMessageToFianceLabel: 'Sweet Note or Question for Him (Optional)',
    personalMessageToFiancePlaceholder:
      'e.g., Check out the appliances I marked as favorites and let me know which brand you prefer!',
    copyShareLinkBtn: 'Copy Direct Link (No Login Needed)',
    linkCopiedMsg: 'Share link copied! Send it to your fiancé now ✓',
    sendViaWhatsappToFianceBtn: 'Send to Fiancé via WhatsApp 💬',
    previewFianceModeBtn: 'Preview Fiancé View 👁️',
    importFianceReplyTitle: "Have a Suggestion Code/Link from Your Fiancé?",
    importFianceReplyPlaceholder: 'Paste your fiancé reply code or link here...',
    importFianceReplyBtn: 'Import His Suggestions',
    fianceReplyImportedSuccess: (count) =>
      `Imported ${count} suggestions & notes from your fiancé! 💕`,

    // Fiancé Guest View (No Registration Required)
    fianceViewBannerBadge: 'Shared Bridal Trousseau • Guest View (No Login Needed)',
    fianceViewTitle: (bride, groom) =>
      groom ? `${bride} & ${groom}'s Trousseau List 💍` : `${bride}'s Shared Trousseau List 💍`,
    fianceViewSubtitle:
      'Browse purchased items and favorites below. You can write your opinion, price quotes, or suggest new items and send them back in one tap!',
    exitFianceViewBtn: 'Exit Guest Preview / Back to Bride App',
    fianceFilterAll: 'All Shared',
    fianceFilterFavorites: "Bride's Favorites ⭐",
    fianceFilterPurchased: 'Already Bought ✅',
    fianceFilterSuggestions: 'My Suggestions 💬',
    addFianceCommentPlaceholder: 'Write your opinion, preferred brand, or price quote...',
    saveFianceCommentBtn: 'Save Note',
    fianceApprovedBadge: 'Approved by Fiancé 👍',
    toggleApproveBtn: 'Approve / Like 👍',
    fianceSuggestNewItemTitle: 'Suggest an Item or Brand to the Bride',
    fianceSuggestItemNamePlaceholder: 'e.g., LG 55" OLED TV at Cairo Sales for 21,000 EGP',
    fianceSuggestItemNotePlaceholder: 'Store name, price quote, or why you recommend it...',
    addSuggestionBtn: 'Add Suggestion',
    sendSuggestionsBackToBrideBtn: 'Send My Suggestions Back to Bride 💬',
    copyReplyCodeBtn: 'Copy Reply Link for Bride',
    replyCopiedForBrideMsg:
      'Reply link copied! Send it to the bride on WhatsApp so it imports into her app ✓',
    fianceNoteLabel: "Fiancé's Note / Suggestion:",

    // Image & Invoice Uploads
    itemPhotosTitle: 'Product & Price Quote Photos 📸',
    itemPhotosSubtitle: 'Upload photos of models, price tags, or store quotes to compare',
    uploadItemPhotoBtn: 'Add Product / Quote Photo',
    invoicePhotosTitle: 'Purchase Invoices & Warranty Receipts 🧾',
    invoicePhotosSubtitle: 'Keep photos of receipts, warranty cards, and installment contracts safe',
    uploadInvoicePhotoBtn: 'Add Invoice / Receipt Photo',
    categoryCoverPhotoLabel: 'Category Cover Photo (Optional)',
    uploadCategoryPhotoBtn: 'Upload Category Image',
    removePhotoBtn: 'Remove',
    subcategoryGalleryTitle: 'Subcategories Visual Guide & Notes',
    subcategoryPhotoAndNotesModalTitle: (sub) => `Subcategory Details: ${sub}`,
    subcategoryNotesLabel: 'Subcategory Notes / Price Quotes Summary',
    subcategoryNotesPlaceholder: 'Write store comparisons, measurements, or notes for this subcategory...',
    uploadSubcategoryPhotoBtn: 'Upload Subcategory Photo',
    saveSubcategoryMetaBtn: 'Save Subcategory Details',
    QuickPhotoBtnLabel: 'Photos / Invoice',
    invoicesCountBadge: (n) => `${n} Invoice${n > 1 ? 's' : ''}`,
    photosCountBadge: (n) => `${n} Photo${n > 1 ? 's' : ''}`,

    // Navigation Tabs
    navDashboard: 'Dashboard',
    navCategories: 'Categories',
    navShopping: 'Shopping Mode',
    navBackup: 'Backup & Print',
    totalRegisteredItems: 'Total Registered:',
    itemsWord: 'items',
    inWord: 'in',
    categoriesWord: 'categories',

    // Theme & Language
    lightMode: 'Light Mode',
    darkMode: 'Girly Dark',
    switchLangLabel: 'العربية',

    // Dashboard
    dashboardBadge: 'Trousseau & Budget Overview',
    customizeProfile: 'Edit Name & Wedding Date',
    brideNameLabel: "Bride's Name",
    weddingDateLabel: 'Wedding Date (Optional)',
    cancel: 'Cancel',
    save: 'Save',
    welcomeBride: 'Welcome,',
    defaultBrideName: 'Lovely Bride',
    dashboardEncouragement:
      'Track your bridal trousseau step by step—every item checked brings you closer to your dream home.',
    purchasedSummary: (done, total) => `${done} of ${total} items purchased`,
    prioritiesForNextTrip: (count) => `${count} priorities for next shopping trip`,
    daysUntilWedding: (days) => `${days} days left until the wedding 💍`,
    overallProgressTitle: 'Overall Trousseau Completion',
    completedWord: 'Completed',

    // Financial Cards
    totalBudgetTitle: 'Total Planned Budget',
    editBtn: 'Edit',
    remainingFromBudget: 'Remaining Budget:',
    overBudgetBy: (amt) => `Over by ${amt}`,
    totalSpentTitle: 'Total Spent & Committed',
    cashPaidSoFar: 'Cash Paid So Far:',
    totalRemainingInstallmentsTitle: 'Remaining Merchant Balances',
    distributedAcrossItems: (count) => `Across ${count} items with installments`,
    noInstallmentsMsg: 'No pending installments or balances',
    viewThemBtn: 'View All',
    currency: 'EGP',

    // Category Breakdown
    categoryBreakdownTitle: 'Categories & Completion Progress',
    categoryBreakdownSubtitle:
      'Tap any category to explore items, upload invoices/photos, or record prices',
    addCustomCategoryBtn: 'Add Custom Category',
    categoryDefaultDesc: 'Category items and essentials',
    completedCount: (done, total) => `${done} of ${total} done`,
    remainingInstallmentsShort: 'Installments due:',
    openCategoryBtn: 'Explore Category',

    // Smart Filters
    filterAll: 'All Items',
    filterPriority: 'Priorities & Favorites ⭐',
    filterPurchased: 'Purchased ✅',
    filterRemaining: 'Remaining ⏳',
    filterInstallments: 'Has Installments 💰',
    subcategoryLabel: 'Subcategories (Tap to filter or add photo/notes):',
    allSubcategories: 'All Subcategories',
    allCategories: 'All Categories',

    // Category View
    newCategoryPill: 'New Category',
    categoryTotalSpent: 'Category Total:',
    addNewItemInCat: 'Add Item to Category',
    categoryProgressText: (done, total) =>
      `Purchased ${done} of ${total} items in this category`,
    celebrationBanner: (catName) =>
      `Congratulations! 🎉 You have completed 100% of "${catName}"! Wishing you endless happiness!`,
    noMatchingItemsTitle: 'No items match the current filter',
    noMatchingItemsSubtitle:
      'Try switching the filter above or add a new custom item to this category.',
    showAllItemsBtn: 'Show All Items',

    // Item Card
    purchasedBadge: 'Purchased ✓',
    qtyLabel: 'Qty:',
    ofWord: 'of',
    priceLabel: 'Price:',
    estPriceLabel: 'Est:',
    recordPriceBtn: 'Set Price',
    remainingBadge: 'Due:',
    editItemTooltip: 'Edit details, photos & price',
    deleteItemTooltip: 'Delete item',
    priorityTooltipAdd: 'Add to shopping priorities',
    priorityTooltipRemove: 'Remove from priorities',

    // Item Modal
    editItemModalTitle: 'Edit Item, Photos, Invoices & Price',
    addItemModalTitle: 'Add New Trousseau Item',
    itemModalSubtitle:
      'Record prices, quantities, installments, price quote photos, or invoices—saved instantly',
    itemNameLabel: 'Item / Product Name *',
    itemNamePlaceholder: 'e.g., Sharp 18 cu.ft Inverter Digital Fridge',
    mainCategoryLabel: 'Main Category',
    subcategoryInputLabel: 'Subcategory',
    subcategoryPlaceholder: 'e.g., Major Appliances / Pot Sets / Towels',
    markedPurchasedBtn: 'Purchased ✓',
    markAsPurchasedBtn: 'Mark as Purchased',
    inPrioritiesBtn: 'Top Priority ⭐',
    addToPrioritiesBtn: 'Add to Priorities',
    requiredQtyLabel: 'Required Quantity',
    purchasedQtyLabel: 'Purchased Quantity',
    financialSectionTitle: 'Financial & Price Tracking (EGP)',
    cashFullMode: 'Full Cash / Paid',
    installmentMode: 'Deposit / Installment',
    actualTotalPriceLabel: 'Actual Total Price (EGP)',
    estimatedBudgetPriceLabel: 'Estimated Budget Price (Optional)',
    paidDepositAmountLabel: 'Paid Amount / Deposit (EGP)',
    remainingMerchantAmountLabel: 'Remaining Balance Due (EGP)',
    actualTotalSummary: 'Actual Total:',
    remainingToPaySummary: 'Remaining Due:',
    notesLabel: 'Notes (Brand, Price Quotes, Color, Store Name, Warranty)',
    notesPlaceholder:
      'Write brand name, price quotes from different stores, showroom, or warranty info...',
    saveItemBtn: 'Save Item',
    itemNameRequiredError: 'Please enter the item name first',

    // Category Modal
    editCategoryModalTitle: 'Edit Category & Photo',
    addCategoryModalTitle: 'Add New Category',
    categoryNameLabel: 'Category Name *',
    categoryNamePlaceholder: 'e.g., Wedding & Honeymoon Prep',
    categoryDescLabel: 'Short Description',
    categoryDescPlaceholder: 'e.g., Dress, makeup artist, venue, and travel bags',
    chooseCategoryIcon: 'Choose Category Icon',
    chooseCategoryColor: 'Category Accent Color',
    saveCategoryBtn: 'Save Category',
    categoryNameRequiredError: 'Please enter a category name',

    // Shopping Mode
    shoppingModeBadge: 'Smart Shopping & Quick Filter Mode',
    shoppingModeTitle: 'Market Shopping List & Priorities',
    shoppingModeSubtitle:
      'Use quick filters to focus on your next shopping trip priorities, capture store price quote photos, or track installments.',
    quickAddItemBtn: 'Quick Add Item',
    displayedItemsCount: (count) => `Displayed Items: ${count}`,
    remainingPrioritiesCount: (count) => `Remaining Priorities: ${count}`,
    listEstimatedActualTotal: 'List Total (Actual/Est):',
    totalRemainingToMerchants: 'Total Merchant Balance:',
    emptyShoppingTitle: 'No items in this filter right now',
    emptyShoppingSubtitle:
      'Tap the priority star ⭐ next to any item in Categories to add it to your focused shopping list.',
    showAllTrousseauBtn: 'Show All Trousseau Items',

    // Backup & Print Manager
    offlineProtectionBadge: '100% Offline Data Protection',
    backupCenterTitle: 'Safety, Backup & Print Center',
    backupCenterSubtitle:
      'All your items, photos, invoices, and prices are automatically saved on your device. Export a backup to WhatsApp or Google Drive anytime.',
    persistentStorageActive: 'Persistent Storage Protected ✓',
    autoSaveActive: 'Auto-Save Active on Device ✓',
    lastUpdatedLabel: 'Last updated:',
    exportShareCardTitle: 'Save & Share Backup File',
    exportShareCardDesc:
      'Download a complete JSON backup of your categories, items, photos, and prices, or share it directly to your WhatsApp or Google Drive.',
    downloadJsonBtn: 'Download Backup (JSON)',
    shareWhatsappBtn: 'Share via WhatsApp / Drive',
    restoreCardTitle: 'Restore from Previous Backup',
    restoreCardDesc:
      'Switching phones or restoring a saved backup? Select your bridal_jihaz_backup.json file to restore everything instantly.',
    selectBackupFileBtn: 'Choose Backup File (.json) to Restore',
    printQaimaCardTitle: 'Printable Trousseau Inventory / Qaima Report (PDF)',
    printQaimaCardDesc:
      'Open a clean, print-ready view listing your purchased items, quantities, brands/notes, and prices—ready to save as PDF or print on paper.',
    openPrintViewBtn: 'Open Printable Report / PDF',
    factoryResetTitle: 'Reset to Default List:',
    factoryResetDesc:
      'Clear custom edits and restore the original 8 pre-seeded bridal categories.',
    factoryResetBtn: 'Factory Reset',
    areYouSure: 'Are you sure?',
    confirmResetBtn: 'Yes, Reset',

    // Print Report View
    backToAppBtn: 'Back to App',
    printPreviewTitle: 'Printable Trousseau & Qaima Report Preview',
    printPreviewSubtitle:
      'Choose report mode below, then click "Print / Save as PDF"',
    purchasedOnlyTab: (count) => `Purchased Only (${count})`,
    allItemsTab: (count) => `All Items (${count})`,
    hidePricesBtn: 'Hide Prices',
    showPricesBtn: 'Show Prices',
    printPdfBtn: 'Print / Save as PDF',
    reportMainHeading: 'Bridal Trousseau Inventory & Checklist Report',
    brideLabel: 'Bride:',
    weddingDatePrintLabel: 'Wedding Date:',
    reportDateLabel: 'Report Date:',
    totalItemsInReportLabel: 'Total Items in Report:',
    totalReportCostLabel: 'Total Financial Value:',
    noPurchasedYetMsg: 'No items have been marked as "Purchased" yet.',
    showAllForPrintBtn: (count) => `Show & Print All Trousseau Items (${count} items)`,
    tableColNum: '#',
    tableColItem: 'Item / Description',
    tableColSubcat: 'Subcategory',
    tableColQty: 'Quantity',
    tableColNotes: 'Brand / Specs & Notes',
    tableColPrice: 'Price (EGP)',
    grandTotalFooter: (count) => `Grand Total (${count} items):`,
    additionalNotesPrint: 'Additional Notes:',
    signaturePrint: 'Signature / Approval:',

    // Confirmations & Alerts
    confirmDeleteItem: (name) => `Are you sure you want to delete "${name}"?`,
    confirmDeleteCategory: (name) =>
      `Are you sure you want to delete category "${name}" and all items inside it?`,
    backupDownloadedMsg: (file) => `Backup file (${file}) downloaded successfully ✓`,
    backupSharedMsg: 'Backup file shared successfully ✓',
    backupRestoredMsg: (itemsCount, catsCount) =>
      `Backup restored successfully! (${itemsCount} items across ${catsCount} categories) ✓`,
    factoryResetSuccessMsg: 'Database reset to default bridal checklist ✓'
  },

  ar: {
    appName: 'م-شوارنا',
    appSubtitle: 'لتنظيم ومتابعة جهاز العروسة وتجهيزات العريس والميزانية والأقساط',
    autoSavedBadge: 'تم الحفظ تلقائياً على جهازك ✓',
    unbackedOfflineBadge: 'تعديلات بدون نت لم تُنسخ احتياطياً بعد',
    searchPlaceholder: 'ابحثي عن أي جهاز، ماركة، أو ملاحظة...',
    installApp: 'تثبيت التطبيق',
    printReportBtn: 'كشف الطباعة',
    addItemBtn: 'إضافة بند',
    newItemShort: 'بند جديد',

    // Navigation History & Safe Refresh
    navBackTooltip: 'رجوع للخطوة السابقة',
    navForwardTooltip: 'تقدم للخطوة التالية',
    navRefreshTooltip: 'تحديث الصفحة (مع تنبيه حماية البيانات)',
    refreshWarningTitle: 'انتبهي يا عروسة قبل التحديث! 🌸',
    refreshWarningDesc:
      'لديكِ تعديلات أو عمليات تمت بدون إنترنت لم يتم تصدير نسخة احتياطية خارجية لها بعد (أو كتابة لم يتم حفظها). ننصح بتحميل نسخة احتياطية سريعة أولاً لضمان عدم ضياع أي بيانات أبداً.',
    refreshUnsavedFormWarn:
      'لديكِ نافذة مفتوحة بها بيانات قيد الكتابة لم تضغطي على حفظ لها بعد! التحديث الآن سيلغي ما كتبتِه.',
    downloadBackupFirstBtn: 'تحميل نسخة احتياطية أولاً (مستحسن)',
    refreshAnywayBtn: 'تحديث الصفحة الآن',
    stayOnPageBtn: 'البقاء ومتابعة التعديل',

    // Share with Fiancé Feature
    shareWithFianceBtn: 'مشاركة مع خطيبي 💍',
    shareModalTitle: 'مشاركة المشتريات والمفضلة مع خطيبك 💍',
    shareModalSubtitle:
      'انسخي رابطاً مباشراً لخطيبك ليرى ما اشتريتِه وقائمة المفضلة والأولويات ويضيف مقترحاته وتعليقاته فوراً بدون الحاجة لأي تسجيل في الموقع!',
    fianceNameLabel: 'اسم الخطيب (اختياري)',
    fianceNamePlaceholder: 'مثال: أحمد',
    whatToShareLabel: 'اختاري ما يظهر له في الرابط:',
    shareOptPurchased: 'البنود التي تم شراؤها ✅',
    shareOptFavorites: 'الأولويات والمفضلة ⭐',
    shareOptRemaining: 'البنود المتبقية للشراء ⏳',
    shareOptPrices: 'إظهار الأسعار والتفاصيل المالية 💰',
    personalMessageToFianceLabel: 'رسالة أو سؤال لخطيبك يظهر أعلى الصفحة (اختياري)',
    personalMessageToFiancePlaceholder:
      'مثال: شوف الأجهزة اللي حطيتها في المفضلة وقولي رأيك نختار أي ماركة فيهم!',
    copyShareLinkBtn: 'نسخ رابط المشاركة المباشر (بدون تسجيل)',
    linkCopiedMsg: 'تم نسخ الرابط! أرسليه لخطيبك الآن ليفتحه مباشرة ✓',
    sendViaWhatsappToFianceBtn: 'إرسال لخطيبي عبر واتساب 💬',
    previewFianceModeBtn: 'معاينة صفحة الخطيب 👁️',
    importFianceReplyTitle: 'هل أرسل لكِ خطيبك رابط أو كود مقترحاته؟',
    importFianceReplyPlaceholder: 'الصقي رابط أو كود رد الخطيب هنا لإضافته لجهازك...',
    importFianceReplyBtn: 'استيراد مقترحات خطيبي',
    fianceReplyImportedSuccess: (count) =>
      `تم استيراد ${count} مقترحات وملاحظات من خطيبك بنجاح! 💕`,

    // Fiancé Guest View (No Registration Required)
    fianceViewBannerBadge: 'صفحة مشاركة الجهاز • تصفح مباشر بدون تسجيل حساب',
    fianceViewTitle: (bride, groom) =>
      groom ? `قائمة جهاز ${bride} و ${groom} 💍` : `قائمة جهاز ومفضلة ${bride} 💍`,
    fianceViewSubtitle:
      'تصفح المشتريات والمفضلة بالأسفل، ويمكنك كتابة رأيك أو عروض الأسعار أو اقتراح أصناف جديدة وإرسالها للعروسة بضغطة واحدة!',
    exitFianceViewBtn: 'إغلاق المعاينة والعودة لوضع العروسة',
    fianceFilterAll: 'كل المشترك',
    fianceFilterFavorites: 'مفضلة العروسة ⭐',
    fianceFilterPurchased: 'تم شراؤه ✅',
    fianceFilterSuggestions: 'مقترحاتي وتعليقاتي 💬',
    addFianceCommentPlaceholder: 'اكتب رأيك، الماركة المفضلة، أو عرض سعر وجدته...',
    saveFianceCommentBtn: 'حفظ رأيي',
    fianceApprovedBadge: 'نال إعجاب الخطيب 👍',
    toggleApproveBtn: 'موافق / أعجبني 👍',
    fianceSuggestNewItemTitle: 'اقترح صنفاً أو عرض سعر جديد للعروسة',
    fianceSuggestItemNamePlaceholder: 'مثال: شاشة LG 55 بوصة عليها عرض ممتاز',
    fianceSuggestItemNotePlaceholder: 'اسم المعرض، السعر، أو سبب ترشيحك لهذا الصنف...',
    addSuggestionBtn: 'إضافة المقترح',
    sendSuggestionsBackToBrideBtn: 'إرسال مقترحاتي ورأيي للعروسة عبر واتساب 💬',
    copyReplyCodeBtn: 'نسخ رابط ردي ومقترحاتي للعروسة',
    replyCopiedForBrideMsg:
      'تم نسخ رابط مقترحاتك! أرسله للعروسة على واتساب لتفتحه وتنزل مقترحاتك عندها ✓',
    fianceNoteLabel: 'رأي / مقترح الخطيب:',

    // Image & Invoice Uploads
    itemPhotosTitle: 'صور الصنف وعروض الأسعار 📸',
    itemPhotosSubtitle: 'ارفعي صور الأجهزة أو عروض الأسعار في المعارض للمقارنة بينها',
    uploadItemPhotoBtn: 'إضافة صورة صنف / عرض سعر',
    invoicePhotosTitle: 'صور فواتير الشراء وشهادات الضمان 🧾',
    invoicePhotosSubtitle: 'احتفظي بصور الفواتير، الإيصالات، والضمان لحمايتها من الضياع',
    uploadInvoicePhotoBtn: 'إضافة صورة فاتورة / ضمان',
    categoryCoverPhotoLabel: 'صورة غلاف القسم (اختياري)',
    uploadCategoryPhotoBtn: 'رفع صورة للقسم',
    removePhotoBtn: 'حذف الصورة',
    subcategoryGalleryTitle: 'صور وملاحظات التصنيفات الفرعية داخل القسم',
    subcategoryPhotoAndNotesModalTitle: (sub) => `تفاصيل وصور تصنيف: ${sub}`,
    subcategoryNotesLabel: 'ملاحظات وعروض أسعار هذا التصنيف الفرعي',
    subcategoryNotesPlaceholder: 'اكتبي مقارنات الأسعار أو المقاسات أو أسماء المحلات لهذا التصنيف...',
    uploadSubcategoryPhotoBtn: 'رفع صورة للتصنيف الفرعي',
    saveSubcategoryMetaBtn: 'حفظ بيانات التصنيف',
    QuickPhotoBtnLabel: 'صور / فاتورة',
    invoicesCountBadge: (n) => `${n} فاتورة`,
    photosCountBadge: (n) => `${n} صور`,

    // Navigation Tabs
    navDashboard: 'ملخص الجهاز',
    navCategories: 'أقسام الجهاز',
    navShopping: 'وضع التسوق',
    navBackup: 'النسخ والطباعة',
    totalRegisteredItems: 'إجمالي البنود المسجلة:',
    itemsWord: 'بند',
    inWord: 'في',
    categoriesWord: 'أقسام',

    // Theme & Language
    lightMode: 'وضع نهاري',
    darkMode: 'وضع ليلي بناتي',
    switchLangLabel: 'English',

    // Dashboard
    dashboardBadge: 'ملخص الجهاز والميزانية',
    customizeProfile: 'تخصيص الاسم وموعد الفرح',
    brideNameLabel: 'اسم العروسة',
    weddingDateLabel: 'تاريخ الفرح (اختياري)',
    cancel: 'إلغاء',
    save: 'حفظ',
    welcomeBride: 'أهلاً بكِ يا',
    defaultBrideName: 'أحلى عروسة',
    dashboardEncouragement:
      'تابعي تقدم جهازك خطوة بخطوة، كل بند بتشتريه بيقربك من بيتك السعيد بإذن الله.',
    purchasedSummary: (done, total) => `تم شراء ${done} من أصل ${total} بند`,
    prioritiesForNextTrip: (count) => `${count} أولويات للنزولة القادمة`,
    daysUntilWedding: (days) => `متبقي ${days} يوم على الفرح 💍`,
    overallProgressTitle: 'نسبة إنجاز الجهاز الكلية',
    completedWord: 'مكتمل',

    // Financial Cards
    totalBudgetTitle: 'الميزانية الكلية المحددة',
    editBtn: 'تعديل',
    remainingFromBudget: 'المتبقي من الميزانية:',
    overBudgetBy: (amt) => `تجاوز بـ ${amt}`,
    totalSpentTitle: 'إجمالي المصروفات والتعاقدات',
    cashPaidSoFar: 'المدفوع نقداً حتى الآن:',
    totalRemainingInstallmentsTitle: 'إجمالي المبالغ المتبقية للتجار',
    distributedAcrossItems: (count) => `موزعة على ${count} بنود عليها أقساط/باقي`,
    noInstallmentsMsg: 'لا توجد أي أقساط أو مبالغ متبقية حالياً',
    viewThemBtn: 'عرضها',
    currency: 'ج.م',

    // Category Breakdown
    categoryBreakdownTitle: 'تفاصيل الأقسام ونسب الإنجاز',
    categoryBreakdownSubtitle:
      'اضغطي على أي قسم لاستعراض البنود، رفع صور الفواتير وعروض الأسعار، أو تسجيل المشتريات',
    addCustomCategoryBtn: 'إضافة قسم مخصص',
    categoryDefaultDesc: 'بنود ومستلزمات القسم',
    completedCount: (done, total) => `${done} من ${total} مكتمل`,
    remainingInstallmentsShort: 'متبقي أقساط:',
    openCategoryBtn: 'فتح القسم',

    // Smart Filters
    filterAll: 'الكل',
    filterPriority: 'الأولويات والمفضلة ⭐',
    filterPurchased: 'تم الشراء ✅',
    filterRemaining: 'متبقي للشراء ⏳',
    filterInstallments: 'عليه أقساط/متبقي مالي 💰',
    subcategoryLabel: 'التصنيف الفرعي (اضغطي للفلترة أو إضافة صورة وملاحظة للتصنيف):',
    allSubcategories: 'كل التصنيفات',
    allCategories: 'كل الأقسام',

    // Category View
    newCategoryPill: 'قسم جديد',
    categoryTotalSpent: 'إجمالي القسم:',
    addNewItemInCat: 'إضافة بند جديد بالقسم',
    categoryProgressText: (done, total) =>
      `تم شراء ${done} من أصل ${total} بند في هذا القسم`,
    celebrationBanner: (catName) =>
      `ألف مبروك يا عروسة! 🎉 أتممتِ شراء جميع بنود «${catName}» بالكامل، عقبال باقي الجهاز بالهنا والسعادة!`,
    noMatchingItemsTitle: 'لا توجد بنود مطابقة للفلتر الحالي',
    noMatchingItemsSubtitle:
      'جربي تغيير الفلتر من الأعلى أو أضيفي بنداً جديداً إلى هذا القسم بكل سهولة.',
    showAllItemsBtn: 'إظهار كل البنود',

    // Item Card
    purchasedBadge: 'تم الشراء ✓',
    qtyLabel: 'الكمية:',
    ofWord: 'من',
    priceLabel: 'السعر:',
    estPriceLabel: 'تقريبي:',
    recordPriceBtn: 'تسجيل السعر',
    remainingBadge: 'متبقي:',
    editItemTooltip: 'تعديل التفاصيل والصور والأسعار',
    deleteItemTooltip: 'حذف البند',
    priorityTooltipAdd: 'إضافة لأولويات التسوق',
    priorityTooltipRemove: 'إزالة من الأولويات',

    // Item Modal
    editItemModalTitle: 'تعديل بيانات، صور، وفواتير البند',
    addItemModalTitle: 'إضافة بند جديد للجهاز',
    itemModalSubtitle:
      'سجلي الأسعار، الكميات، الأقساط، صور عروض الأسعار، أو الفواتير ويتم الحفظ فوراً',
    itemNameLabel: 'اسم البند / المنتج *',
    itemNamePlaceholder: 'مثال: ثلاجة شارب 18 قدم إنفرتر ديجيتال',
    mainCategoryLabel: 'القسم الرئيسي',
    subcategoryInputLabel: 'التصنيف الفرعي',
    subcategoryPlaceholder: 'مثال: أجهزة كبيرة / أطقم حلل / فوط',
    markedPurchasedBtn: 'تم الشراء بالفعل ✓',
    markAsPurchasedBtn: 'تحديد كـ تم الشراء',
    inPrioritiesBtn: 'ضمن الأولويات ⭐',
    addToPrioritiesBtn: 'إضافة للأولويات',
    requiredQtyLabel: 'الكمية المطلوبة بالجهاز',
    purchasedQtyLabel: 'الكمية المشتراة حتى الآن',
    financialSectionTitle: 'الحساب المالي والأسعار (ج.م)',
    cashFullMode: 'كاش / مدفوع كامل',
    installmentMode: 'عربون / تقسيط',
    actualTotalPriceLabel: 'السعر الفعلي الإجمالي (ج.م)',
    estimatedBudgetPriceLabel: 'السعر التقديري للميزانية (اختياري)',
    paidDepositAmountLabel: 'المبلغ المدفوع / العربون (ج.م)',
    remainingMerchantAmountLabel: 'المبلغ المتبقي للتاجر (ج.م)',
    actualTotalSummary: 'الإجمالي الفعلي:',
    remainingToPaySummary: 'متبقي للسداد:',
    notesLabel: 'ملاحظات (الماركة، عروض الأسعار، اللون، اسم المعرض، فترة الضمان)',
    notesPlaceholder:
      'اكتبي الماركة أو مقارنة عروض الأسعار أو اسم التاجر وتفاصيل الضمان...',
    saveItemBtn: 'حفظ البند',
    itemNameRequiredError: 'يرجى كتابة اسم البند أولاً',

    // Category Modal
    editCategoryModalTitle: 'تعديل القسم وصورته',
    addCategoryModalTitle: 'إضافة قسم جديد للجهاز',
    categoryNameLabel: 'اسم القسم *',
    categoryNamePlaceholder: 'مثال: تجهيزات الفرح وشهر العسل',
    categoryDescLabel: 'وصف مختصر للقسم',
    categoryDescPlaceholder: 'مثال: الفستان، الكوافير، القاعة، وشنطة السفر',
    chooseCategoryIcon: 'اختاري أيقونة القسم',
    chooseCategoryColor: 'لون القسم',
    saveCategoryBtn: 'حفظ القسم',
    categoryNameRequiredError: 'يرجى كتابة اسم القسم',

    // Shopping Mode
    shoppingModeBadge: 'وضع التسوق الذكي والفرز السريع',
    shoppingModeTitle: 'قائمة نزولة السوق والأولويات',
    shoppingModeSubtitle:
      'استخدمي الفلاتر السريعة لعرض أولويات النزولة القادمة، أو تصوير عروض الأسعار في المحلات، أو متابعة الأقساط.',
    quickAddItemBtn: 'إضافة بند سريع',
    displayedItemsCount: (count) => `عدد البنود المعروضة: ${count} بند`,
    remainingPrioritiesCount: (count) => `أولويات متبقية للشراء: ${count}`,
    listEstimatedActualTotal: 'إجمالي القائمة (فعلي/تقديري):',
    totalRemainingToMerchants: 'إجمالي المتبقي للتجار:',
    emptyShoppingTitle: 'لا توجد بنود في هذا الفلتر حالياً',
    emptyShoppingSubtitle:
      'يمكنك الضغط على نجمة الأولويات ⭐ بجانب أي بند في الأقسام ليظهر هنا في قائمة التسوق السريعة.',
    showAllTrousseauBtn: 'عرض كافة بنود الجهاز',

    // Backup & Print Manager
    offlineProtectionBadge: 'حماية البيانات 100% بدون إنترنت',
    backupCenterTitle: 'مركز الأمان والنسخ الاحتياطي والطباعة',
    backupCenterSubtitle:
      'جميع بياناتك وصور الفواتير وأسعارك محفوظة تلقائياً في قاعدة بيانات محمية على موبايلك، ويمكنك أخذ نسخة احتياطية على واتساب أو جوجل درايف في ثوانٍ.',
    persistentStorageActive: 'التخزين الدائم مفعل ومحمي ✓',
    autoSaveActive: 'الحفظ التلقائي مفعل على جهازك ✓',
    lastUpdatedLabel: 'آخر تحديث:',
    exportShareCardTitle: 'حفظ ومشاركة نسخة احتياطية (Backup)',
    exportShareCardDesc:
      'قومي بتنزيل ملف يحتوي على كل أقسامك وبنودك وصورك وأسعارك، أو أرسليه لنفسك على واتساب أو Google Drive بضغطة واحدة للرجوع إليه من أي موبايل آخر.',
    downloadJsonBtn: 'تحميل ملف النسخة (JSON)',
    shareWhatsappBtn: 'مشاركة عبر واتساب / درايف',
    restoreCardTitle: 'استعادة البيانات من نسخة سابقة (Restore)',
    restoreCardDesc:
      'إذا قمتِ بتغيير موبايلك أو أردتِ استرجاع نسخة احتياطية محفوظة مسبقاً، فقط اختاري ملف النسخة الاحتياطية (bridal_jihaz_backup.json) وسيتم استرجاع كل شيء فوراً.',
    selectBackupFileBtn: 'اختيار ملف النسخة الاحتياطية للاستعادة',
    printQaimaCardTitle: 'تصدير كشف الجهاز للطباعة أو PDF (كشف القائمة / الجرد)',
    printQaimaCardDesc:
      'افتحي الكشف المنسق للطباعة الذي يعرض جدولاً أنيقاً بجميع المشتريات، الكميات، الماركات والملاحظات، والأسعار لحفظه كملف PDF أو طباعته ورقياً.',
    openPrintViewBtn: 'فتح كشف الجهاز للطباعة / PDF',
    factoryResetTitle: 'إعادة ضبط القائمة الافتراضية:',
    factoryResetDesc:
      'في حال رغبتِ في مسح التعديلات والعودة إلى قائمة الجهاز الافتراضية (8 أقسام كاملة).',
    factoryResetBtn: 'إعادة ضبط المصنع',
    areYouSure: 'هل أنتِ متأكدة؟',
    confirmResetBtn: 'نعم، أعد الضبط',

    // Print Report View
    backToAppBtn: 'العودة للتطبيق',
    printPreviewTitle: 'معاينة كشف الجهاز للطباعة أو الحفظ PDF',
    printPreviewSubtitle:
      'اختاري نوع الكشف ثم اضغطي على زر «طباعة / حفظ كـ PDF»',
    purchasedOnlyTab: (count) => `المشتريات فقط (${count})`,
    allItemsTab: (count) => `كل بنود الجهاز (${count})`,
    hidePricesBtn: 'إخفاء الأسعار',
    showPricesBtn: 'إظهار الأسعار',
    printPdfBtn: 'طباعة / حفظ كـ PDF',
    reportMainHeading: 'كشف بيان ومشتريات جهاز العروسة',
    brideLabel: 'العروسة:',
    weddingDatePrintLabel: 'تاريخ الزفاف:',
    reportDateLabel: 'تاريخ استخراج الكشف:',
    totalItemsInReportLabel: 'إجمالي عدد البنود بالكشف:',
    totalReportCostLabel: 'الإجمالي المالي للكشف:',
    noPurchasedYetMsg: 'لم يتم تحديد أي بنود كـ «تم الشراء» بعد.',
    showAllForPrintBtn: (count) => `عرض وطباعة جميع بنود الجهاز (${count} بند)`,
    tableColNum: 'م',
    tableColItem: 'الصنف / البيان',
    tableColSubcat: 'التصنيف',
    tableColQty: 'الكمية',
    tableColNotes: 'الماركة / المواصفات والملاحظات',
    tableColPrice: 'السعر (ج.م)',
    grandTotalFooter: (count) => `الإجمالي الكلي لبنود الكشف (${count} بند):`,
    additionalNotesPrint: 'ملاحظات إضافية:',
    signaturePrint: 'التوقيع / الاعتماد:',

    // Confirmations & Alerts
    confirmDeleteItem: (name) => `هل أنتِ متأكدة من حذف البند «${name}»؟`,
    confirmDeleteCategory: (name) =>
      `هل أنتِ متأكدة من حذف قسم «${name}» وجميع البنود الموجودة بداخله؟`,
    backupDownloadedMsg: (file) =>
      `تم تحميل ملف النسخة الاحتياطية (${file}) بنجاح على جهازك ✓`,
    backupSharedMsg: 'تمت مشاركة ملف النسخة الاحتياطية بنجاح ✓',
    backupRestoredMsg: (itemsCount, catsCount) =>
      `تمت استعادة النسخة الاحتياطية بنجاح! (${itemsCount} بند في ${catsCount} أقسام) ✓`,
    factoryResetSuccessMsg:
      'تمت إعادة ضبط البيانات إلى القائمة الافتراضية الكاملة بنجاح ✓'
  }
};
