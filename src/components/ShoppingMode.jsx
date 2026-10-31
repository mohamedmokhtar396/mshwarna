import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Star,
  Plus,
  Sparkles
} from 'lucide-react';
import ItemCard from './ItemCard';
import { formatCurrency } from '../db';
import { getSmartFilters } from './CategoryView';
import {
  translations,
  getLocalizedCategory,
  getLocalizedItem
} from '../i18n';

export default function ShoppingMode({
  lang = 'ar',
  categories,
  items,
  activeFilter,
  onFilterChange,
  searchQuery,
  onTogglePurchased,
  onTogglePriority,
  onUpdateQty,
  onEditItem,
  onDeleteItem,
  onAddItem,
  isReadOnly = false,
  showPrices = true
}) {
  const t = translations[lang] || translations.ar;
  const smartFilters = useMemo(() => getSmartFilters(t), [t]);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = getLocalizedCategory(c, lang).displayName;
    });
    return map;
  }, [categories, lang]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const loc = getLocalizedItem(item, lang);

      if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) {
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
        const matchCat = categoryMap[item.categoryId]?.toLowerCase().includes(q);
        if (!matchName && !matchNotes && !matchSub && !matchCat) return false;
      }

      return true;
    });
  }, [items, categoryFilter, activeFilter, searchQuery, categoryMap, lang]);

  const listEstimatedTotal = filteredItems.reduce(
    (sum, i) =>
      sum +
      (Number(i.actualPrice) > 0
        ? Number(i.actualPrice)
        : Number(i.estimatedPrice) || 0),
    0
  );
  const listRemainingInstallments = filteredItems.reduce(
    (sum, i) => sum + (Number(i.remainingAmount) || 0),
    0
  );
  const unpurchasedPrioritiesCount = items.filter(
    (i) => i.isPriority && !i.isPurchased
  ).length;

  return (
    <div className="space-y-5 pb-10">
      {/* Shopping Mode Banner */}
      <div className="bg-gradient-to-l from-bridal-goldLight/70 via-bridal-surface to-bridal-roseLight/70 rounded-3xl border border-bridal-border p-5 sm:p-6 shadow-bridal">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-bridal-goldLight text-bridal-gold border border-bridal-gold/30 flex items-center justify-center flex-shrink-0 p-3">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-bridal-goldLight text-bridal-gold border border-bridal-gold/30 text-[11px] font-bold mb-1">
                <Sparkles className="w-3 h-3" />
                <span>{t.shoppingModeBadge}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-bridal-charcoal">
                {t.shoppingModeTitle}
              </h2>
              <p className="text-xs sm:text-sm text-bridal-mauve mt-0.5">
                {t.shoppingModeSubtitle}
              </p>
            </div>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() =>
                onAddItem(categoryFilter !== 'all' ? categoryFilter : categories[0]?.id)
              }
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-xs sm:text-sm font-bold shadow-bridal hover:opacity-95 transition flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.quickAddItemBtn}</span>
            </button>
          )}
        </div>

        {/* Summary Strip */}
        <div className="mt-4 pt-3.5 border-t border-bridal-border/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-bridal-surface border border-bridal-border font-bold text-bridal-charcoal">
              {t.displayedItemsCount(filteredItems.length)}
            </span>
            <span className="px-3 py-1 rounded-xl bg-bridal-goldLight border border-bridal-gold/40 font-bold text-bridal-gold">
              {t.remainingPrioritiesCount(unpurchasedPrioritiesCount)}
            </span>
          </div>

          {showPrices && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-bridal-surface border border-bridal-border font-bold text-bridal-sageDark">
                {t.listEstimatedActualTotal} {formatCurrency(listEstimatedTotal, lang)}{' '}
                {t.currency}
              </span>
              {listRemainingInstallments > 0 && (
                <span className="px-3 py-1 rounded-xl bg-bridal-goldLight border border-bridal-gold/40 font-bold text-bridal-gold">
                  {t.totalRemainingToMerchants}{' '}
                  {formatCurrency(listRemainingInstallments, lang)} {t.currency}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Pills Row */}
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
                    : 'bg-bridal-surface text-bridal-charcoal border-bridal-border hover:border-bridal-rose'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              categoryFilter === 'all'
                ? 'bg-bridal-roseLight text-bridal-roseDark border-bridal-rose'
                : 'bg-bridal-surface text-bridal-mauve border-bridal-border'
            }`}
          >
            {t.allCategories}
          </button>
          {categories.map((cat) => {
            const locCat = getLocalizedCategory(cat, lang);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  categoryFilter === cat.id
                    ? 'bg-bridal-roseLight text-bridal-roseDark border-bridal-rose'
                    : 'bg-bridal-surface text-bridal-mauve border-bridal-border hover:text-bridal-charcoal'
                }`}
              >
                {locCat.displayName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtered Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-10 text-center space-y-3 shadow-bridal">
          <Star className="w-10 h-10 text-bridal-gold mx-auto" />
          <h3 className="text-base font-bold text-bridal-charcoal">
            {t.emptyShoppingTitle}
          </h3>
          <p className="text-xs text-bridal-mauve max-w-md mx-auto">
            {t.emptyShoppingSubtitle}
          </p>
          <button
            type="button"
            onClick={() => {
              onFilterChange('all');
              setCategoryFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-bridal-rose text-white text-xs font-bold"
          >
            {t.showAllTrousseauBtn}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                lang={lang}
                categoryName={categoryMap[item.categoryId]}
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
