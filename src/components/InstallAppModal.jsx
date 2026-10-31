import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { detectMobilePlatform } from '../utils/mobilePlatform';

export { detectMobilePlatform };

export default function InstallAppModal({
  isOpen,
  onClose,
  installPromptEvent,
  onTriggerNativeInstall,
  lang = 'ar',
  gender = 'female',
  onChangeGenderIcon
}) {
  const { isIOS, isInAppBrowser } = detectMobilePlatform();
  const [selectedOs, setSelectedOs] = useState(isIOS ? 'ios' : 'android');
  const [selectedIconGender, setSelectedIconGender] = useState(gender || 'female');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const detected = detectMobilePlatform();
      setSelectedOs(detected.isIOS ? 'ios' : 'android');
      setSelectedIconGender(gender || 'female');
    }
  }, [isOpen, gender]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const isMale = selectedIconGender === 'male';
  const iconSrc = isMale ? '/groom-icon-192.png' : '/icon-192.png';

  const handleSelectIconGender = (nextGender) => {
    setSelectedIconGender(nextGender);
    if (typeof window !== 'undefined' && window.syncGenderAppIcons) {
      window.syncGenderAppIcons(nextGender);
    }
    if (onChangeGenderIcon) {
      onChangeGenderIcon(nextGender);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-bridal-surface rounded-3xl border border-bridal-border shadow-bridal-lg overflow-hidden my-auto"
        >
          {/* Top Header with Dynamic Bride / Groom Portrait Icon Preview */}
          <div className="relative bg-gradient-to-l from-bridal-roseLight via-bridal-cream to-bridal-goldLight/60 px-6 pt-6 pb-5 border-b border-bridal-border text-center">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-bridal-surface/80 hover:bg-bridal-surface text-bridal-mauve hover:text-bridal-charcoal border border-bridal-border transition"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Home Screen App Icon Preview */}
            <div className="inline-flex flex-col items-center mb-2">
              <div className="relative group">
                <div className="w-20 h-20 rounded-[22px] overflow-hidden border-2 border-bridal-gold shadow-bridal-lg bg-bridal-surface mx-auto">
                  <img
                    src={iconSrc}
                    alt="أيقونة تطبيق م-شوارنا"
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-bridal-rose text-white flex items-center justify-center shadow-md border-2 border-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="mt-1.5 text-[11px] font-extrabold text-bridal-charcoal bg-white/80 px-2.5 py-0.5 rounded-full border border-bridal-border shadow-2xs">
                {isMale ? 'م-شوارنا 🤵‍♂️' : 'م-شوارنا 🌸'}
              </span>
            </div>

            {/* Switcher between Bride Portrait Icon & Groom Suit Portrait Icon */}
            <div className="flex items-center justify-center gap-2 mt-1 mb-2">
              <button
                type="button"
                onClick={() => handleSelectIconGender('female')}
                className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border transition ${
                  !isMale
                    ? 'bg-bridal-rose text-white border-bridal-rose shadow-2xs'
                    : 'bg-bridal-surface/80 text-bridal-mauve border-bridal-border hover:text-bridal-charcoal'
                }`}
              >
                👰‍♀️ أيقونة العروسة
              </button>
              <button
                type="button"
                onClick={() => handleSelectIconGender('male')}
                className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border transition ${
                  isMale
                    ? 'bg-bridal-rose text-white border-bridal-rose shadow-2xs'
                    : 'bg-bridal-surface/80 text-bridal-mauve border-bridal-border hover:text-bridal-charcoal'
                }`}
              >
                🤵‍♂️ أيقونة العريس (بالبدلة)
              </button>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-bridal-charcoal mt-1">
              {isAr
                ? 'تنزيل تطبيق «م-شوارنا» على موبايلك 📲'
                : 'Install "Meshwarna" App on Your Phone 📲'}
            </h3>
            <p className="text-xs text-bridal-mauve mt-1 max-w-md mx-auto">
              {isAr
                ? isMale
                  ? 'احفظ التطبيق بأيقونة العريس على شاشة موبايلك الرئيسية ليفتح بضغطة واحدة ويعمل معك في أي وقت حتى بدون إنترنت!'
                  : 'احفظي التطبيق بأيقونة العروسة على شاشة موبايلك الرئيسية ليفتح بضغطة واحدة ويعمل معكِ في أي وقت حتى بدون إنترنت!'
                : 'Add the portrait app icon to your phone home screen for instant 1-tap access anytime, even offline!'}
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Direct 1-Click Install Button if Browser Supports It right now */}
            {installPromptEvent && (
              <div className="p-4 rounded-2xl bg-gradient-to-l from-bridal-rose/15 to-bridal-goldLight/50 border-2 border-bridal-rose space-y-2.5 text-center">
                <div className="text-xs font-extrabold text-bridal-roseDark">
                  {isAr
                    ? '✨ متصفحك يدعم التثبيت المباشر بضغطة واحدة الآن!'
                    : '✨ Your browser supports instant 1-click installation!'}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onTriggerNativeInstall();
                    onClose();
                  }}
                  className="w-full py-3 px-5 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white font-extrabold text-sm shadow-bridal hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>
                    {isAr
                      ? 'تثبيت التطبيق الآن بضغطة زر واحدة ⚡'
                      : 'Install App Now with 1 Tap ⚡'}
                  </span>
                </button>
              </div>
            )}

            {/* Warning if inside Facebook / Instagram / Messenger in-app browser */}
            {isInAppBrowser && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                <div className="font-extrabold flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    {isAr
                      ? 'تنبيه هام: الرابط مفتوح من داخل فيسبوك أو انستجرام'
                      : 'Note: You are inside an in-app browser'}
                  </span>
                </div>
                <p className="leading-relaxed">
                  {isAr
                    ? 'لتنزيل التطبيق بضغطة زر، اضغط على الثلاث نقاط (⋮) في أعلى الشاشة واختر «فتح في المتصفح Chrome أو Safari»، أو انسخ الرابط وافتحه في متصفح موبايلك.'
                    : 'Tap the menu (⋮) at the top and choose "Open in Chrome / Safari" to install the app.'}
                </p>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-bridal-charcoal border border-amber-500/40 font-extrabold text-xs shadow-2xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-bridal-sage" />
                      <span>تم نسخ الرابط! افتحه في Chrome أو Safari ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-bridal-rose" />
                      <span>نسخ رابط التطبيق</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* OS Selector Tabs: Android vs iPhone */}
            <div>
              <div className="text-xs font-extrabold text-bridal-charcoal mb-2 text-center">
                {isAr
                  ? isMale
                    ? 'اختر نوع موبايلك لمعرفة خطوات التنزيل السريعة:'
                    : 'اختاري نوع موبايلك لمعرفة خطوات التنزيل السريعة:'
                  : 'Select your phone type for quick install steps:'}
              </div>
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-bridal-cream border border-bridal-border">
                <button
                  type="button"
                  onClick={() => setSelectedOs('android')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    selectedOs === 'android'
                      ? 'bg-bridal-rose text-white shadow-bridal'
                      : 'text-bridal-mauve hover:text-bridal-charcoal'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{isAr ? 'موبايل أندرويد (Android)' : 'Android Phone'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOs('ios')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    selectedOs === 'ios'
                      ? 'bg-bridal-rose text-white shadow-bridal'
                      : 'text-bridal-mauve hover:text-bridal-charcoal'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{isAr ? 'موبايل آيفون (iPhone)' : 'iPhone / iPad'}</span>
                </button>
              </div>
            </div>

            {/* Steps Content Based on Selected OS */}
            {selectedOs === 'android' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-bridal-cream/60 border border-bridal-border flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-bridal-rose text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    1
                  </div>
                  <div className="text-xs sm:text-sm text-bridal-charcoal leading-relaxed">
                    <span className="font-extrabold block mb-0.5">
                      {isAr
                        ? isMale
                          ? 'افتح القائمة العلوية في متصفح Chrome'
                          : 'افتحي القائمة العلوية في متصفح Chrome'
                        : 'Open the browser menu in Chrome'}
                    </span>
                    <span className="text-bridal-mauve">
                      {isAr
                        ? isMale
                          ? 'اضغط على علامة الثلاث نقاط الرأسية '
                          : 'اضغطي على علامة الثلاث نقاط الرأسية '
                        : 'Tap the three dots icon '}
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-bridal-surface border border-bridal-border text-bridal-charcoal font-bold mx-0.5">
                        <MoreVertical className="w-3.5 h-3.5 inline" />
                      </span>
                      {isAr
                        ? ' الموجودة في أعلى يسار أو يمين المتصفح.'
                        : ' at the top corner of your browser.'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-bridal-cream/60 border border-bridal-border flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-bridal-rose text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    2
                  </div>
                  <div className="text-xs sm:text-sm text-bridal-charcoal leading-relaxed">
                    <span className="font-extrabold block mb-0.5">
                      {isAr
                        ? isMale
                          ? 'اختر «تثبيت التطبيق» أو «الإضافة إلى الشاشة الرئيسية»'
                          : 'اختاري «تثبيت التطبيق» أو «الإضافة إلى الشاشة الرئيسية»'
                        : 'Select "Install app" or "Add to Home screen"'}
                    </span>
                    <span className="text-bridal-mauve">
                      {isAr ? (isMale ? 'ستجد خيار ' : 'ستجدين خيار ') : 'Tap on '}
                      <strong className="text-bridal-roseDark">
                        «تثبيت التطبيق / Install app»
                      </strong>{' '}
                      {isAr ? 'أو ' : 'or '}
                      <strong className="text-bridal-roseDark">
                        «الإضافة إلى الشاشة الرئيسية»
                      </strong>
                      .
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-bridal-sageLight/60 border border-bridal-sage/40 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-bridal-sage text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    3
                  </div>
                  <div className="text-xs sm:text-sm text-bridal-charcoal leading-relaxed">
                    <span className="font-extrabold block mb-0.5 text-bridal-sageDark">
                      {isAr
                        ? isMale
                          ? 'اضغط «تثبيت» ومبروك عليك التطبيق! 🎉'
                          : 'اضغطي «تثبيت» ومبروك عليكِ التطبيق! 🎉'
                        : 'Tap "Install" and enjoy! 🎉'}
                    </span>
                    <span className="text-bridal-mauve">
                      {isAr
                        ? isMale
                          ? 'سينزل تطبيق «م-شوارنا» فوراً على شاشة موبايلك ببورتريه العريس بالبدلة، ويفتح معك بضغطة واحدة!'
                          : 'سينزل تطبيق «م-شوارنا» فوراً على شاشة موبايلك ببورتريه العروسة، ويفتح معكِ بضغطة واحدة!'
                        : 'The app will be added to your home screen.'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="px-3.5 py-2.5 rounded-xl bg-bridal-roseLight/50 border border-bridal-rose/30 text-[11px] font-bold text-bridal-roseDark">
                  {isAr
                    ? isMale
                      ? '💡 في أجهزة الآيفون (iPhone)، نظام Apple يتطلب الضغط على زر المشاركة في متصفح Safari لإضافة التطبيق في ثوانٍ:'
                      : '💡 في أجهزة الآيفون (iPhone)، نظام Apple يتطلب منكِ الضغط على زر المشاركة في متصفح Safari لإضافة التطبيق في ثوانٍ:'
                    : '💡 On iPhone, iOS requires tapping Share in Safari to add the app to your Home Screen:'}
                </div>

                <div className="p-3.5 rounded-2xl bg-bridal-cream/60 border border-bridal-border flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-bridal-rose text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    1
                  </div>
                  <div className="text-xs sm:text-sm text-bridal-charcoal leading-relaxed">
                    <span className="font-extrabold block mb-0.5">
                      {isAr
                        ? isMale
                          ? 'اضغط على زرار المشاركة (Share) في متصفح Safari'
                          : 'اضغطي على زرار المشاركة (Share) في متصفح Safari'
                        : 'Tap the Share button in Safari'}
                    </span>
                    <span className="text-bridal-mauve">
                      {isAr
                        ? isMale
                          ? 'اضغط على أيقونة المشاركة '
                          : 'اضغطي على أيقونة المشاركة '
                        : 'Tap the Share icon '}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-bridal-surface border border-bridal-border text-bridal-roseDark font-bold mx-0.5">
                        <Share className="w-3.5 h-3.5 inline" />
                        <span>Share</span>
                      </span>
                      {isAr
                        ? ' الموجودة في منتصف الشريط السفلي لمتصفح سفاري.'
                        : ' at the bottom bar of Safari.'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-bridal-cream/60 border border-bridal-border flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-bridal-rose text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    2
                  </div>
                  <div className="text-xs sm:text-sm text-bridal-charcoal leading-relaxed">
                    <span className="font-extrabold block mb-0.5">
                      {isAr
                        ? isMale
                          ? 'اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen)'
                          : 'اختاري «إضافة إلى الشاشة الرئيسية» (Add to Home Screen)'
                        : 'Choose "Add to Home Screen"'}
                    </span>
                    <span className="text-bridal-mauve">
                      {isAr
                        ? isMale
                          ? 'مرر القائمة للأعلى قليلاً واضغط على '
                          : 'مرري القائمة للأعلى قليلاً واضغطي على '
                        : 'Scroll down the share sheet and tap '}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-bridal-surface border border-bridal-border text-bridal-roseDark font-bold mx-0.5">
                        <PlusSquare className="w-3.5 h-3.5 inline" />
                        <span>Add to Home Screen</span>
                      </span>
                      .
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-bridal-sageLight/60 border border-bridal-sage/40 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-bridal-sage text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    3
                  </div>
                  <div className="text-xs sm:text-sm text-bridal-charcoal leading-relaxed">
                    <span className="font-extrabold block mb-0.5 text-bridal-sageDark">
                      {isAr
                        ? isMale
                          ? 'اضغط على «إضافة» (Add) في أعلى الشاشة 🎉'
                          : 'اضغطي على «إضافة» (Add) في أعلى الشاشة 🎉'
                        : 'Tap "Add" at the top right corner 🎉'}
                    </span>
                    <span className="text-bridal-mauve">
                      {isAr
                        ? isMale
                          ? 'ستظهر أيقونة بورتريه العريس بالبدلة باسم «م-شوارنا» على شاشة الآيفون الرئيسية فوراً كأنها تطبيق كامل!'
                          : 'ستظهر أيقونة بورتريه العروسة باسم «م-شوارنا» على شاشة الآيفون الرئيسية فوراً كأنها تطبيق كامل!'
                        : 'The portrait icon will immediately appear on your iPhone Home Screen!'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Action */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-bridal-charcoal text-white text-xs sm:text-sm font-extrabold hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-bridal-gold" />
                <span>{isAr ? 'تمام، فهمت الخطوات' : 'Got It'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
