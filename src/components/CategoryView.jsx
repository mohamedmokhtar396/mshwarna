import React, { useState, useMemo } from 'react';
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
  SearchX
} from 'lucide-react';
import ItemCard from './ItemCard';
import { CategoryIcon } from '../utils/categoryIcons';
import { formatCurrency } from '../db';
import {
  translations,
  getLocalizedCategory,
  getLocalizedItem
} from '../i18n';

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
  lang = 'ar',
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
  isReadOnly = false,
  showPrices = true
}) {
  const t = translations[lang] || translations.ar;
  const smartFilters = useMemo(() => getSmartFilters(t), [t]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');

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

      // Subcategory check
      if (
        selectedSubcategory !== 'all' &&
        loc.displaySubcategory !== selectedSubcategory
      ) {
        return false;
      }

      // Smart filter check
      if (activeFilter === 'priority' && !item.isPriority) return false;
      if (activeFilter === 'purchased' && !item.isPurchased) return false;
      if (activeFilter === 'remaining' && item.isPurchased) return false;
      if (
        activeFilter === 'installments' &&
        (Number(item.remainingAmount) || 0) <= 0
      ) {
        return false;
      }

      // Search query check (searches both English and Arabic fields!)
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
              }}
              className={`flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all ${
                isSelected
                  ? 'bg-bridal-rose text-white border-bridal-rose shadow-bridal'
                  : 'bg-bridal-surface text-bridal-charcoal border-bridal-border hover:border-bridal-rose/50'
              }`}
            >
              <CategoryIcon
                iconName={cat.icon}
                className="w-4 h-4"
                style={{ color: isSelected ? '#FFFFFF' : cat.color }}
              />
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

        {!isReadOnly && (
          <button
            type="button"
            onClick={onAddCategory}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-dashed border-bridal-rose bg-bridal-roseLight/40 text-bridal-roseDark text-xs sm:text-sm font-bold hover:bg-bridal-roseLight transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newCategoryPill}</span>
          </button>
        )}
      </div>

      {/* Category Hero Header Card */}
      <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 sm:p-6 shadow-bridal">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${rawCategory.color || '#D88C9A'}24`,
                color: rawCategory.color || '#D88C9A'
              }}
            >
              <CategoryIcon iconName={rawCategory.icon} className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-bridal-charcoal">
                  {currentCategory.displayName}
                </h2>
                {!isReadOnly && (
                  <>
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
                  </>
                )}
              </div>
              <p className="text-xs sm:text-sm text-bridal-mauve mt-0.5">
                {currentCategory.displayDescription}
              </p>

              {showPrices && (
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
              )}
            </div>
          </div>

          {/* Add New Item Button */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => onAddItem(rawCategory.id)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-sm font-bold shadow-bridal hover:opacity-95 transition flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewItemInCat}</span>
            </button>
          )}
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

      {/* Smart Filter Pills + Subcategory Pills */}
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

        {/* Subcategory Filter Pills */}
        {subcategories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold text-bridal-mauve flex-shrink-0">
              {t.subcategoryLabel}
            </span>
            {subcategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubcategory(sub)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedSubcategory === sub
                    ? 'bg-bridal-roseLight text-bridal-roseDark font-bold border border-bridal-rose/40'
                    : 'bg-bridal-cream text-bridal-mauve hover:bg-bridal-surface border border-bridal-border'
                }`}
              >
                {sub === 'all' ? t.allSubcategories : sub}
              </button>
            ))}
          </div>
        )}
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
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => onAddItem(rawCategory.id)}
                className="px-4 py-2 rounded-xl bg-bridal-rose text-white text-xs font-bold"
              >
                + {t.addItemBtn}
              </button>
            )}
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
                isReadOnly={isReadOnly}
                showPrices={showPrices}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
