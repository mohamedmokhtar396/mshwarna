/**
 * Lightweight helper to detect mobile platform & standalone PWA mode without loading heavy modals
 */
export function detectMobilePlatform() {
  if (typeof window === 'undefined') {
    return { isIOS: false, isAndroid: false, isInAppBrowser: false, isStandalone: false };
  }
  const ua = window.navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isInAppBrowser = /FBAN|FBAV|Instagram|Messenger|Line/i.test(ua);
  const isStandalone =
    Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches) ||
    window.navigator.standalone === true;

  return { isIOS, isAndroid, isInAppBrowser, isStandalone };
}
