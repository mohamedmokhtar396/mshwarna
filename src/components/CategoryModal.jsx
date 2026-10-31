import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Camera, Trash2 } from 'lucide-react';
import {
  AVAILABLE_CATEGORY_ICONS,
  AVAILABLE_CATEGORY_COLORS,
  CategoryIcon
} from '../utils/categoryIcons';
import { translations, getLocalizedCategory } from '../i18n';
import { compressImageFile } from '../utils/imageUtils';

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialCategory,
  lang = 'en',
  onFormDirtyChange
}) {
  const t = translations[lang] || translations.en;
  const fileRef = useRef(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [color, setColor] = useState('#D88C9A');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCategory) {
      const loc = getLocalizedCategory(initialCategory, lang);
      setName(loc.displayName || '');
      setDescription(loc.displayDescription || '');
      setIcon(initialCategory.icon || 'Sparkles');
      setColor(initialCategory.color || '#D88C9A');
      setImage(initialCategory.image || null);
    } else {
      setName('');
      setDescription('');
      setIcon('Sparkles');
      setColor('#D88C9A');
      setImage(null);
    }
    setError('');
    if (onFormDirtyChange) onFormDirtyChange(false);
  }, [initialCategory, isOpen, lang]);

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setImage(compressed);
      if (onFormDirtyChange) onFormDirtyChange(true);
    } catch (err) {
      console.warn(err);
    }
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.categoryNameRequiredError);
      return;
    }
    if (onFormDirtyChange) onFormDirtyChange(false);
    onSave({
      id: initialCategory?.id,
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      image,
      order: initialCategory?.order
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="w-full max-w-md bg-bridal-bg rounded-t-3xl sm:rounded-3xl border border-bridal-border shadow-bridal-lg overflow-hidden max-h-[92vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-l from-bridal-roseLight to-bridal-cream border-b border-bridal-border">
              <h2 className="text-lg font-bold text-bridal-charcoal">
                {initialCategory ? t.editCategoryModalTitle : t.addCategoryModalTitle}
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (onFormDirtyChange) onFormDirtyChange(false);
                  onClose();
                }}
                className="p-2 rounded-full bg-bridal-surface text-bridal-mauve hover:text-bridal-charcoal border border-bridal-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
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
                  onChange={(e) => {
                    setName(e.target.value);
                    if (onFormDirtyChange) onFormDirtyChange(true);
                  }}
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
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (onFormDirtyChange) onFormDirtyChange(true);
                  }}
                  placeholder={t.categoryDescPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border focus:border-bridal-rose outline-none text-sm text-bridal-charcoal"
                />
              </div>

              {/* Category Cover Photo Upload */}
              <div className="bg-bridal-surface p-3.5 rounded-2xl border border-bridal-border space-y-2">
                <label className="block text-xs font-bold text-bridal-charcoal">
                  {t.categoryCoverPhotoLabel}
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="hidden"
                />
                {image ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={image.dataUrl || image}
                      alt={name}
                      className="w-16 h-16 rounded-2xl object-cover border border-bridal-border"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-bridal-cream text-bridal-charcoal text-xs font-bold border border-bridal-border"
                      >
                        {t.uploadCategoryPhotoBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null);
                          if (onFormDirtyChange) onFormDirtyChange(true);
                        }}
                        className="p-1.5 rounded-xl bg-red-500/10 text-red-500 border border-red-400/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-bridal-cream hover:bg-bridal-roseLight/60 text-bridal-charcoal border border-dashed border-bridal-rose/50 text-xs font-bold transition"
                  >
                    <Camera className="w-4 h-4 text-bridal-rose" />
                    <span>{t.uploadCategoryPhotoBtn}</span>
                  </button>
                )}
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
                      onClick={() => {
                        setIcon(ic.name);
                        if (onFormDirtyChange) onFormDirtyChange(true);
                      }}
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
                      onClick={() => {
                        setColor(c);
                        if (onFormDirtyChange) onFormDirtyChange(true);
                      }}
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
                  onClick={() => {
                    if (onFormDirtyChange) onFormDirtyChange(false);
                    onClose();
                  }}
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
