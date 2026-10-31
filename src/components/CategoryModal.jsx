import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import {
  AVAILABLE_CATEGORY_ICONS,
  AVAILABLE_CATEGORY_COLORS,
  CategoryIcon
} from '../utils/categoryIcons';
import { translations, getLocalizedCategory } from '../i18n';

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialCategory,
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [color, setColor] = useState('#D88C9A');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCategory) {
      const loc = getLocalizedCategory(initialCategory, lang);
      setName(loc.displayName || '');
      setDescription(loc.displayDescription || '');
      setIcon(initialCategory.icon || 'Sparkles');
      setColor(initialCategory.color || '#D88C9A');
    } else {
      setName('');
      setDescription('');
      setIcon('Sparkles');
      setColor('#D88C9A');
    }
    setError('');
  }, [initialCategory, isOpen, lang]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.categoryNameRequiredError);
      return;
    }
    onSave({
      id: initialCategory?.id,
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      order: initialCategory?.order
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="w-full max-w-md bg-bridal-bg rounded-t-3xl sm:rounded-3xl border border-bridal-border shadow-bridal-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-l from-bridal-roseLight to-bridal-cream border-b border-bridal-border">
              <h2 className="text-lg font-bold text-bridal-charcoal">
                {initialCategory ? t.editCategoryModalTitle : t.addCategoryModalTitle}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-bridal-surface text-bridal-mauve hover:text-bridal-charcoal border border-bridal-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/40 text-red-500 text-xs font-bold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                  {t.categoryNameLabel}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.categoryNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border focus:border-bridal-rose outline-none text-sm font-medium text-bridal-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                  {t.categoryDescLabel}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.categoryDescPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border focus:border-bridal-rose outline-none text-sm text-bridal-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-bridal-charcoal mb-2">
                  {t.chooseCategoryIcon}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_CATEGORY_ICONS.map((ic) => (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setIcon(ic.name)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[11px] transition ${
                        icon === ic.name
                          ? 'bg-bridal-roseLight border-bridal-rose text-bridal-roseDark font-bold'
                          : 'bg-bridal-surface border-bridal-border text-bridal-mauve hover:border-bridal-rose/40'
                      }`}
                    >
                      <CategoryIcon iconName={ic.name} className="w-5 h-5" />
                      <span className="truncate w-full text-center">
                        {lang === 'en' ? ic.labelEn : ic.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-bridal-charcoal mb-2">
                  {t.chooseCategoryColor}
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {AVAILABLE_CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        color === c ? 'scale-110 border-bridal-charcoal' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-bridal-border bg-bridal-surface text-bridal-mauve text-sm font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-sm font-bold shadow-bridal"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.saveCategoryBtn}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
