import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageLightbox({
  isOpen,
  images = [],
  currentIndex = 0,
  title = '',
  onClose,
  onSelectIndex,
  onDeleteImage
}) {
  if (!isOpen || !images.length) return null;

  const currentImg = images[currentIndex] || images[0];
  const imgSrc = typeof currentImg === 'string' ? currentImg : currentImg?.dataUrl;

  const handleDownload = () => {
    if (!imgSrc) return;
    const a = document.createElement('a');
    a.href = imgSrc;
    a.download = currentImg?.name || `bridal-photo-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none"
          onClick={onClose}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-4xl flex items-center justify-between text-white py-2 px-3 rounded-2xl bg-white/10 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="truncate pr-2">
              <h3 className="text-sm font-bold truncate">{title || currentImg?.name || 'Photo Preview'}</h3>
              {images.length > 1 && (
                <p className="text-[11px] text-white/75">
                  {currentIndex + 1} / {images.length}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
                title="Download Photo"
              >
                <Download className="w-4 h-4" />
              </button>
              {onDeleteImage && currentImg?.id && (
                <button
                  type="button"
                  onClick={() => onDeleteImage(currentImg.id)}
                  className="p-2 rounded-xl bg-red-500/30 hover:bg-red-500/50 text-red-200 transition"
                  title="Delete Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Image Container */}
          <div
            className="relative flex-1 w-full max-w-4xl flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  onSelectIndex((currentIndex - 1 + images.length) % images.length)
                }
                className="absolute left-2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/75 text-white transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <motion.img
              key={imgSrc}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={imgSrc}
              alt={title}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/15"
            />

            {images.length > 1 && (
              <button
                type="button"
                onClick={() => onSelectIndex((currentIndex + 1) % images.length)}
                className="absolute right-2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/75 text-white transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {images.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto max-w-xl py-2 px-3 rounded-2xl bg-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => {
                const thumbSrc = typeof img === 'string' ? img : img?.dataUrl;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => onSelectIndex(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                      idx === currentIndex
                        ? 'border-bridal-rose scale-105'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={thumbSrc}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
