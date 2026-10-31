import confetti from 'canvas-confetti';

/**
 * Trigger celebratory confetti in soft bridal colors (rose, gold, sage, cream)
 */
export function triggerCategoryCelebration() {
  try {
    const colors = ['#D88C9A', '#E5989B', '#D4AF37', '#84A98C', '#F4A261'];

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.65 },
      colors
    });

    setTimeout(() => {
      confetti({
        particleCount: 45,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.65 },
        colors
      });
      confetti({
        particleCount: 45,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.65 },
        colors
      });
    }, 220);
  } catch (err) {
    console.warn('Confetti celebration error:', err);
  }
}

export function triggerMiniSparkle() {
  try {
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.75 },
      colors: ['#D88C9A', '#D4AF37', '#84A98C'],
      scalar: 0.8
    });
  } catch {
    // ignore
  }
}
