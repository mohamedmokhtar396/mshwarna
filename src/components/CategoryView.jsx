import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit3,
  Trash2,
  PartyPopper,
  Star,
  CheckCircle2,
  Clock,
  Wallet,
  Layers,
  SearchX,
  Camera,
  StickyNote,
  Save,
  X
} from 'lucide-react';
import ItemCard from './ItemCard';
import { CategoryIcon } from '../utils/categoryIcons';
import { formatCurrency } from '../db';
import {
  translations,
  getLocalizedCategory,
  getLocalizedItem
} from '../i18n';
import { compressImageFile, compressMultipleImages } from '../utils/imageUtils';

export function getSmartFilters(t) {
  return [
    { id: 'all', label: t.filterAll, icon: Layers },
    { id: 'priority', label: t.filterPriority, icon: Star },
    { id: 'purchased', label: t.filterPurchased, icon: CheckCircle2 },
    { id: 'remaining', label: t.filterRemaining, icon: Clock },
    { id: 'installments', label: t.filterInstallments, icon: Wallet }
  ];
}

export default function CategoryView({
  lang = 'en',
  categories,
  selectedCategoryId,
  onSelectCategory,
  items,
  activeFilter,
  onFilterChange,
  searchQuery,
  onTogglePurchased,
  onTogglePriority,
  onUpdateQty,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
  onQuickUploadItemPhotos,
  onSaveCategoryDirect,
  onSaveSubcategoryMeta,
  onOpenLightbox
}) {
  const t = translations[lang] || translations.en;
  const smartFilters = useMemo(() => getSmartFilters(t), [t]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');

  // Subcategory Photo & Notes inline editor state
  const [editingSubcatName, setEditingSubcatName] = useState(null);
  const [subcatNotesInput, setSubcatNotesInput] = useState('');
  const [subcatImagesInput, setSubcatImagesInput] = useState([]);

  const catPhotoInputRef = useRef(null);
  const subcatPhotoInputRef = useRef(null);

  const rawCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const currentCategory = useMemo(
    () => getLocalizedCategory(rawCategory, lang),
    [rawCategory, lang]
  );

  const categoryItems = useMemo(() => {
    if (!rawCategory) return [];
    return items.filter((i) => i.categoryId === rawCategory.id);
  }, [items, rawCategory]);

  // Unique localized subcategories inside this category
  const subcategories = useMemo(() => {
    const subs = new Set();
    categoryItems.forEach((i) => {
      const loc = getLocalizedItem(i, lang);
      if (loc.displaySubcategory) subs.add(loc.displaySubcategory);
    });
    return ['all', ...Array.from(subs)];
  }, [categoryItems, lang]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return categoryItems.filter((item) => {
      const loc = getLocalizedItem(item, lang);

      if (
        selectedSubcategory !== 'all' &&
        loc.displaySubcategory !== selectedSubcategory
      ) {
        return false;
      }

      if (activeFilter === 'priority' && !item.isPriority) return false;
      if (activeFilter === 'purchased' && !item.isPurchased) return false;
      if (activeFilter === 'remaining' && item.isPurchased) return false;
      if (
        activeFilter === 'installments' &&
        (Number(item.remainingAmount) || 0) <= 0
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName =
          item.name?.toLowerCase().includes(q) ||
          loc.displayName?.toLowerCase().includes(q);
        const matchNotes =
          item.notes?.toLowerCase().includes(q) ||
          loc.displayNotes?.toLowerCase().includes(q);
        const matchSub =
          item.subcategory?.toLowerCase().includes(q) ||
          loc.displaySubcategory?.toLowerCase().includes(q);
        if (!matchName && !matchNotes && !matchSub) return false;
      }

      return true;
    });
  }, [categoryItems, selectedSubcategory, activeFilter, searchQuery, lang]);

  if (!rawCategory) return null;

  const totalCount = categoryItems.length;
  const purchasedCount = categoryItems.filter((i) => i.isPurchased).length;
  const completionPercent =
    totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0;
  const categorySpent = categoryItems.reduce(
    (sum, i) => sum + (Number(i.actualPrice) || 0),
    0
  );
  const categoryRemainingInstallments = categoryItems.reduce(
    (sum, i) => sum + (Number(i.remainingAmount) || 0),
    0
  );

  const isCustomCategory = rawCategory.id.startsWith('cat-custom-');
  const subcatMetaMap = rawCategory.subcategoriesMeta || {};

  const handleQuickCategoryPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onSaveCategoryDirect) return;
    const compressed = await compressImageFile(file);
    onSaveCategoryDirect({
      ...rawCategory,
      name: currentCategory.displayName,
      description: currentCategory.displayDescription,
      image: compressed
    });
    e.target.value = '';
  };

  const openSubcategoryEditor = (subName) => {
    const existing = subcatMetaMap[subName] || {};
    setEditingSubcatName(subName);
    setSubcatNotesInput(existing.notes || '');
    setSubcatImagesInput(existing.images || []);
  };

  const handleUploadSubcatPhotos = async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const compressed = await compressMultipleImages(files);
    setSubcatImagesInput((prev) => [...prev, ...compressed]);
    e.target.value = '';
  };

  const handleSaveSubcatEditor = () => {
    if (!editingSubcatName || !onSaveSubcategoryMeta) return;
    onSaveSubcategoryMeta(rawCategory.id, editingSubcatName, {
      notes: subcatNotesInput.trim(),
      images: subcatImagesInput
    });
    setEditingSubcatName(null);
  };

  const activeSubcatMeta =
    selectedSubcategory !== 'all' ? subcatMetaMap[selectedSubcategory] : null;

  return (
    <div className="space-y-5 pb-10">
      {/* Horizontal Category Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => {
          const locCat = getLocalizedCategory(cat, lang);
          const isSelected = cat.id === rawCategory.id;
          const catItems = items.filter((i) => i.categoryId === cat.id);
          const doneCount = catItems.filter((i) => i.isPurchased).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onSelectCategory(cat.id);
                setSelectedSubcategory('all');
                setEditingSubcatName(null);
              }}
              className={`flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all ${
                isSelected
                  ? 'bg-bridal-rose text-white border-bridal-rose shadow-bridal'
                  : 'bg-bridal-surface text-bridal-charcoal border-bridal-border hover:border-bridal-rose/50'
              }`}
            >
              {cat.image ? (
                <img
                  src={cat.image.dataUrl || cat.image}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <CategoryIcon
                  iconName={cat.icon}
                  className="w-4 h-4"
                  style={{ color: isSelected ? '#FFFFFF' : cat.color }}
                />
              )}
              <span>{locCat.displayName}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-white/25 text-white'
                    : 'bg-bridal-cream text-bridal-mauve'
                }`}
              >
                {doneCount}/{catItems.length}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onAddCategory}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-dashed border-bridal-rose bg-bridal-roseLight/40 text-bridal-roseDark text-xs sm:text-sm font-bold hover:bg-bridal-roseLight transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newCategoryPill}</span>
        </button>
      </div>

      {/* Category Hero Header Card */}
      <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 sm:p-6 shadow-bridal">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {/* Category Cover Photo or Icon */}
            <div className="relative group/catimg flex-shrink-0">
              {rawCategory.image ? (
                <img
                  src={rawCategory.image.dataUrl || rawCategory.image}
                  alt={currentCategory.displayName}
                  onClick={() =>
                    onOpenLightbox &&
                    onOpenLightbox(
                      [rawCategory.image],
                      0,
                      currentCategory.displayName
                    )
                  }
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-bridal-rose cursor-pointer shadow-xs"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${rawCategory.color || '#D88C9A'}24`,
                    color: rawCategory.color || '#D88C9A'
                  }}
                >
                  <CategoryIcon iconName={rawCategory.icon} className="w-7 h-7" />
                </div>
              )}

              <input
                ref={catPhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleQuickCategoryPhoto}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => catPhotoInputRef.current?.click()}
                title={t.uploadCategoryPhotoBtn}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-bridal-rose text-white flex items-center justify-center shadow-xs hover:scale-110 transition"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-bridal-charcoal">
                  {currentCategory.displayName}
                </h2>
                <button
                  type="button"
                  onClick={() => onEditCategory(rawCategory)}
                  className="p-1.5 rounded-lg text-bridal-mauve hover:text-bridal-rose hover:bg-bridal-cream transition"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {isCustomCategory && (
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(rawCategory)}
                    className="p-1.5 rounded-lg text-bridal-mauve hover:text-red-500 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-bridal-mauve mt-0.5">
                {currentCategory.displayDescription}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs">
                <span className="font-bold text-bridal-charcoal bg-bridal-cream px-2.5 py-1 rounded-xl border border-bridal-border">
                  {t.categoryTotalSpent} {formatCurrency(categorySpent, lang)} {t.currency}
                </span>
                {categoryRemainingInstallments > 0 && (
                  <span className="font-bold text-bridal-gold bg-bridal-goldLight px-2.5 py-1 rounded-xl border border-bridal-gold/40">
                    {t.remainingInstallmentsShort}{' '}
                    {formatCurrency(categoryRemainingInstallments, lang)} {t.currency}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Add New Item Button */}
          <button
            type="button"
            onClick={() => onAddItem(rawCategory.id)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-sm font-bold shadow-bridal hover:opacity-95 transition flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNewItemInCat}</span>
          </button>
        </div>

        {/* Category Progress Bar */}
        <div className="mt-5 pt-4 border-t border-bridal-border/70">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-bridal-mauve">
              {t.categoryProgressText(purchasedCount, totalCount)}
            </span>
            <span
              className={
                completionPercent === 100
                  ? 'text-bridal-sageDark font-extrabold'
                  : 'text-bridal-roseDark font-extrabold'
              }
            >
              {completionPercent}% {t.completedWord}
            </span>
          </div>
          <div className="w-full h-2.5 bg-bridal-cream rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{
                backgroundColor:
                  completionPercent === 100
                    ? 'var(--bridal-sage)'
                    : rawCategory.color || 'var(--bridal-rose)'
              }}
            />
          </div>
        </div>

        {/* 100% Celebration Banner */}
        <AnimatePresence>
          {completionPercent === 100 && totalCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3.5 rounded-2xl bg-bridal-sageLight border border-bridal-sage/40 flex items-center gap-3 text-bridal-sageDark"
            >
              <PartyPopper className="w-6 h-6 flex-shrink-0 text-bridal-sageDark" />
              <div className="text-xs sm:text-sm font-bold">
                {t.celebrationBanner(currentCategory.displayName)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Smart Filter Pills + Subcategory Pills with Photo/Notes Support */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {smartFilters.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterChange(f.id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isActive
                    ? 'bg-bridal-rose text-white border-bridal-rose shadow-xs'
                    : 'bg-bridal-surface text-bridal-mauve border-bridal-border hover:border-bridal-rose/40 hover:text-bridal-charcoal'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Subcategory Filter Pills + Subcategory Photo/Notes Button */}
        {subcategories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold text-bridal-mauve flex-shrink-0">
              {t.subcategoryLabel}
            </span>
            {subcategories.map((sub) => {
              const meta = subcatMetaMap[sub];
              const hasMeta =
                meta && ((meta.images && meta.images.length > 0) || meta.notes);
              return (
                <div key={sub} className="inline-flex items-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                      selectedSubcategory === sub
                        ? 'bg-bridal-roseLight text-bridal-roseDark font-bold border border-bridal-rose/40'
                        : 'bg-bridal-cream text-bridal-mauve hover:bg-bridal-surface border border-bridal-border'
                    }`}
                  >
                    {meta?.images?.[0] && (
                      <img
                        src={meta.images[0].dataUrl}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    )}
                    <span>{sub === 'all' ? t.allSubcategories : sub}</span>
                    {sub !== 'all' && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          openSubcategoryEditor(sub);
                        }}
                        title={t.subcategoryPhotoAndNotesModalTitle(sub)}
                        className={`p-0.5 rounded-full hover:bg-bridal-rose/20 transition ${
                          hasMeta ? 'text-bridal-rose' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Camera className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Active Subcategory Notes & Photos Banner */}
        {activeSubcatMeta &&
          (activeSubcatMeta.notes || activeSubcatMeta.images?.length > 0) && (
            <div className="p-4 rounded-2xl bg-bridal-surface border border-bridal-rose/40 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-extrabold text-bridal-charcoal flex items-center gap-1.5">
                  <StickyNote className="w-4 h-4 text-bridal-rose" />
                  <span>{selectedSubcategory}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => openSubcategoryEditor(selectedSubcategory)}
                  className="text-xs font-bold text-bridal-rose hover:underline"
                >
                  {t.editBtn}
                </button>
              </div>
              {activeSubcatMeta.notes && (
                <p className="text-xs text-bridal-mauve leading-relaxed">
                  {activeSubcatMeta.notes}
                </p>
              )}
              {activeSubcatMeta.images?.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                  {activeSubcatMeta.images.map((img, idx) => (
                    <img
                      key={img.id || idx}
                      src={img.dataUrl}
                      alt={selectedSubcategory}
                      onClick={() =>
                        onOpenLightbox &&
                        onOpenLightbox(
                          activeSubcatMeta.images,
                          idx,
                          selectedSubcategory
                        )
                      }
                      className="w-16 h-16 rounded-xl object-cover border border-bridal-border cursor-pointer hover:border-bridal-rose transition"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        {/* Subcategory Photo & Notes Modal / Inline Drawer */}
        <AnimatePresence>
          {editingSubcatName && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-2xl bg-bridal-surface border-2 border-bridal-rose/50 shadow-bridal space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-bridal-charcoal">
                  {t.subcategoryPhotoAndNotesModalTitle(editingSubcatName)}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingSubcatName(null)}
                  className="p-1 rounded-full bg-bridal-cream text-bridal-mauve"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-bridal-mauve mb-1">
                  {t.subcategoryNotesLabel}
                </label>
                <textarea
                  rows={2}
                  value={subcatNotesInput}
                  onChange={(e) => setSubcatNotesInput(e.target.value)}
                  placeholder={t.subcategoryNotesPlaceholder}
                  className="w-full px-3 py-2 rounded-xl bg-bridal-cream border border-bridal-border text-xs sm:text-sm text-bridal-charcoal outline-none focus:border-bridal-rose resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-bridal-charcoal">
                    {t.uploadSubcategoryPhotoBtn}
                  </span>
                  <input
                    ref={subcatPhotoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadSubcatPhotos}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => subcatPhotoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bridal-roseLight text-bridal-roseDark text-xs font-bold"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>+ {t.uploadSubcategoryPhotoBtn}</span>
                  </button>
                </div>

                {subcatImagesInput.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                    {subcatImagesInput.map((img) => (
                      <div
                        key={img.id}
                        className="relative w-14 h-14 rounded-xl overflow-hidden border border-bridal-border flex-shrink-0"
                      >
                        <img
                          src={img.dataUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSubcatImagesInput((prev) =>
                              prev.filter((i) => i.id !== img.id)
                            )
                          }
                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/65 text-white hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubcatName(null)}
                  className="px-3 py-1.5 rounded-xl bg-bridal-cream text-bridal-mauve text-xs font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveSubcatEditor}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-bridal-rose text-white text-xs font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.saveSubcategoryMetaBtn}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-10 text-center space-y-3 shadow-bridal">
          <div className="w-12 h-12 rounded-2xl bg-bridal-cream text-bridal-rose mx-auto flex items-center justify-center">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-bridal-charcoal">
            {t.noMatchingItemsTitle}
          </h3>
          <p className="text-xs text-bridal-mauve max-w-sm mx-auto">
            {t.noMatchingItemsSubtitle}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            {(activeFilter !== 'all' || selectedSubcategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  onFilterChange('all');
                  setSelectedSubcategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-bridal-cream text-bridal-charcoal text-xs font-bold border border-bridal-border"
              >
                {t.showAllItemsBtn}
              </button>
            )}
            <button
              type="button"
              onClick={() => onAddItem(rawCategory.id)}
              className="px-4 py-2 rounded-xl bg-bridal-rose text-white text-xs font-bold"
            >
              + {t.addItemBtn}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                lang={lang}
                onTogglePurchased={onTogglePurchased}
                onTogglePriority={onTogglePriority}
                onUpdateQty={onUpdateQty}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
                onQuickUploadPhotos={onQuickUploadItemPhotos}
                onOpenLightbox={onOpenLightbox}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
