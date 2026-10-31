/**
 * Compress an uploaded image file on the client using HTML5 Canvas
 * so multiple invoice photos, price quote photos, and category images
 * can be stored in IndexedDB smoothly and work 100% offline.
 */
export function compressImageFile(file, maxWidth = 1000, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          dataUrl,
          createdAt: new Date().toISOString()
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple files at once
 */
export async function compressMultipleImages(fileList, maxWidth = 1000, quality = 0.75) {
  const files = Array.from(fileList || []);
  const results = [];
  for (const file of files) {
    try {
      const compressed = await compressImageFile(file, maxWidth, quality);
      results.push(compressed);
    } catch (err) {
      console.warn('Skipped invalid image:', err);
    }
  }
  return results;
}
