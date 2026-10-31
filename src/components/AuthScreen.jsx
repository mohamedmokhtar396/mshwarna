import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Sparkles,
  Phone,
  Mail,
  Lock,
  User,
  Calendar,
  Wallet,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  ArrowLeft,
  Download
} from 'lucide-react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import {
  initializeUserCloudProfile,
  parseArabicNumber,
  detectGenderFromName,
  switchAccountGenderAndTemplate
} from '../db';

/**
 * Sanitize Egyptian / Arabic mobile phone input into clean digits (e.g. 01012345678)
 */
export function sanitizePhoneNumber(raw) {
  if (!raw) return '';
  let digits = String(raw)
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[^0-9]/g, '');

  if (digits.startsWith('0020')) {
    digits = '0' + digits.slice(4);
  } else if (digits.startsWith('20') && digits.length === 12) {
    digits = '0' + digits.slice(2);
  } else if (digits.length === 10 && digits.startsWith('1')) {
    digits = '0' + digits;
  }
  return digits;
}

function getFriendlyFirebaseError(error, method = 'email', isMale = false) {
  const code = error?.code || '';
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return method === 'phone'
      ? isMale
        ? 'رقم الموبايل أو كلمة المرور غير صحيحة. تأكد من البيانات أو أنشئ حساباً جديداً.'
        : 'رقم الموبايل أو كلمة المرور غير صحيحة. تأكدي من البيانات أو أنشئي حساباً جديداً.'
      : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (code === 'auth/email-already-in-use') {
    return method === 'phone'
      ? 'رقم الموبايل هذا مسجل بالفعل! انتقل إلى تبويب «تسجيل الدخول» واكتب كلمة المرور.'
      : 'هذا البريد الإلكتروني مسجل بالفعل! يمكنك تسجيل الدخول مباشرة.';
  }
  if (code === 'auth/weak-password') {
    return 'كلمة المرور ضعيفة، يرجى اختيار كلمة مرور لا تقل عن 6 أحرف أو أرقام.';
  }
  if (code === 'auth/invalid-email') {
    return method === 'phone'
      ? 'يرجى إدخال رقم موبايل صحيح (مثال: 01012345678).'
      : 'يرجى إدخال بريد إلكتروني صحيح.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'تم إغلاق نافذة تسجيل الدخول بحساب جوجل قبل الإكمال.';
  }
  if (code === 'auth/network-request-failed') {
    return 'تعذر الاتصال بالإنترنت، تأكد من الشبكة أو استخدم الدخول السريع بدون حساب.';
  }
  return error?.message || 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى.';
}

export default function AuthScreen({
  onAuthSuccess,
  onContinueAsGuest,
  onTriggerInstall,
  isAppInstalled = false
}) {
  // Active Auth Method Tab: 'phone' | 'email'
  const [authTab, setAuthTab] = useState('phone');
  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('register');
  // Gender for Phone/Email registration ('female' default so women's UI is 100% untouched)
  const [gender, setGender] = useState('female');
  const [userManuallyPickedGender, setUserManuallyPickedGender] = useState(false);

  // Form Fields
  const [brideName, setBrideName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [totalBudget, setTotalBudget] = useState('300000');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isMale = gender === 'male';

  // Apply masculine theme & groom suit icon only when 'male' is selected; keep women's theme & bride icon 100% untouched when 'female'
  useEffect(() => {
    const root = document.documentElement;
    if (isMale) {
      root.classList.add('theme-male');
    } else {
      root.classList.remove('theme-male');
    }
    if (typeof window !== 'undefined' && window.syncGenderAppIcons) {
      window.syncGenderAppIcons(isMale ? 'male' : 'female');
    }
  }, [isMale]);

  // Auto-detect gender as user types their name in Phone/Email registration (if they haven't manually clicked a gender button)
  const handleNameChange = (val) => {
    setBrideName(val);
    if (!userManuallyPickedGender && val.trim().length >= 3) {
      const detected = detectGenderFromName(val, email);
      setGender(detected);
    }
  };

  // 1. 1-Click Google Sign-In (Auto-detects Male/Female from Google displayName/email)
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const detectedGender = userManuallyPickedGender
        ? gender
        : detectGenderFromName(result.user.displayName || '', result.user.email || '');
      const defaultDisplayName =
        detectedGender === 'male' ? 'أحلى عريس' : 'أحلى عروسة';

      const profile = await initializeUserCloudProfile(result.user, {
        authMethod: 'google',
        gender: detectedGender,
        brideName: result.user.displayName || defaultDisplayName,
        realEmail: result.user.email || ''
      });
      if (onAuthSuccess) onAuthSuccess(result.user, profile);
    } catch (err) {
      setErrorMsg(getFriendlyFirebaseError(err, 'google', isMale));
    } finally {
      setLoading(false);
    }
  };

  // 2. Instant Phone + Password Auth (Zero SMS Quota Synthetic Email)
  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = sanitizePhoneNumber(phoneNumber);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('يرجى إدخال رقم موبايل صحيح مكون من 11 رقماً (مثال: 01012345678).');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('يرجى إدخال كلمة مرور لا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (mode === 'register' && !brideName.trim()) {
      setErrorMsg(
        isMale
          ? 'يرجى كتابة اسم العريس لتخصيص قائمة جهازك.'
          : 'يرجى كتابة اسم العروسة لتخصيص قائمة جهازك.'
      );
      return;
    }

    const syntheticEmail = `${cleanPhone}@phone.gehaz-el3rosa.com`;
    setLoading(true);

    try {
      let userCredential;
      if (mode === 'register') {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          syntheticEmail,
          password
        );
        if (brideName.trim()) {
          await updateProfile(userCredential.user, {
            displayName: brideName.trim()
          });
        }
        const profile = await initializeUserCloudProfile(userCredential.user, {
          authMethod: 'phone',
          gender,
          brideName: brideName.trim(),
          phoneNumber: cleanPhone,
          weddingDate,
          totalBudget: parseArabicNumber(totalBudget) || 300000
        });
        if (onAuthSuccess) onAuthSuccess(userCredential.user, profile);
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          syntheticEmail,
          password
        );
        const profile = await initializeUserCloudProfile(userCredential.user, {
          authMethod: 'phone',
          phoneNumber: cleanPhone
        });
        if (onAuthSuccess) onAuthSuccess(userCredential.user, profile);
      }
    } catch (err) {
      setErrorMsg(getFriendlyFirebaseError(err, 'phone', isMale));
    } finally {
      setLoading(false);
    }
  };

  // 3. Email + Password Auth
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('يرجى إدخال كلمة مرور لا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (mode === 'register' && !brideName.trim()) {
      setErrorMsg(
        isMale
          ? 'يرجى كتابة اسم العريس لتخصيص قائمة جهازك.'
          : 'يرجى كتابة اسم العروسة لتخصيص قائمة جهازك.'
      );
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      const cleanPhone = sanitizePhoneNumber(phoneNumber);

      if (mode === 'register') {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );
        if (brideName.trim()) {
          await updateProfile(userCredential.user, {
            displayName: brideName.trim()
          });
        }
        const profile = await initializeUserCloudProfile(userCredential.user, {
          authMethod: 'email',
          gender,
          brideName: brideName.trim(),
          realEmail: cleanEmail,
          phoneNumber: cleanPhone,
          weddingDate,
          totalBudget: parseArabicNumber(totalBudget) || 300000
        });
        if (onAuthSuccess) onAuthSuccess(userCredential.user, profile);
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );
        const profile = await initializeUserCloudProfile(userCredential.user, {
          authMethod: 'email',
          realEmail: cleanEmail
        });
        if (onAuthSuccess) onAuthSuccess(userCredential.user, profile);
      }
    } catch (err) {
      setErrorMsg(getFriendlyFirebaseError(err, 'email', isMale));
    } finally {
      setLoading(false);
    }
  };

  // 4. Guest Mode Handler (Applies Groom or Bride template locally)
  const handleGuestClick = async () => {
    await switchAccountGenderAndTemplate(gender, true);
    if (onContinueAsGuest) onContinueAsGuest();
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-bridal-roseLight/70 via-bridal-bg to-bridal-cream flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300"
    >
      {/* Decorative Floating Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg bg-bridal-surface rounded-3xl border border-bridal-border shadow-bridal-lg overflow-hidden transition-colors duration-300"
      >
        {/* Top Hero Banner */}
        <div className="bg-gradient-to-l from-bridal-roseLight via-bridal-cream to-bridal-goldLight/60 px-6 pt-7 pb-5 border-b border-bridal-border text-center relative transition-colors duration-300">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-bridal-gold shadow-bridal-lg mx-auto mb-3 bg-bridal-surface">
            <img
              src={isMale ? '/groom-icon-192.png' : '/icon-192.png'}
              alt="م-شوارنا"
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bridal-surface/90 border border-bridal-rose/30 text-bridal-roseDark text-[11px] font-extrabold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-bridal-gold" />
            <span>سحابة آمنة + مشاركة مع شريك حياتك + يعمل بدون إنترنت</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-bridal-charcoal">
            {isMale ? 'م-شوارنا 🤵‍♂️💍' : 'م-شوارنا 🌸💍'}
          </h1>
          <p className="text-xs sm:text-sm text-bridal-mauve mt-1 max-w-sm mx-auto leading-relaxed">
            {isMale
              ? 'نظّم جهازك وتأسيس شقتك، تابع الميزانية والأقساط، وشارك عروستك كل اللي اشتريته خطوة بخطوة.'
              : 'نظّمي جهازك، تابعي الميزانية والأقساط، وشاركي عريسك قائمتك على حسابك السحابي في أي وقت.'}
          </p>

          {!isAppInstalled && onTriggerInstall && (
            <button
              type="button"
              onClick={() => onTriggerInstall(gender)}
              className="mt-3.5 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-l from-bridal-goldLight to-bridal-surface text-bridal-charcoal border border-bridal-gold/60 text-xs font-extrabold shadow-xs hover:bg-bridal-gold/25 transition"
            >
              <Download className="w-3.5 h-3.5 text-bridal-roseDark animate-bounce" />
              <span>تنزيل تطبيق «م-شوارنا» للموبايل بضغطة زر 📲</span>
            </button>
          )}
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          {/* 1. One-Click Google Sign-In Button */}
          <div className="space-y-1.5">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white hover:bg-bridal-cream text-gray-800 border-2 border-bridal-border hover:border-bridal-rose/60 font-extrabold text-sm shadow-sm transition-all disabled:opacity-60"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.8c-.2-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.6 6.4C.6 8.4 0 10.6 0 12s.6 3.6 1.6 5.6l3.7-2.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.4 7.4 23 12 23z"
                />
              </svg>
              <span>تسجيل الدخول السريع بحساب جوجل (Google)</span>
            </button>
            <p className="text-[11px] text-center text-bridal-mauve">
              يتعرف تلقائياً على الاسم لتجهيز واجهة العروسة 👰‍♀️ أو العريس 🤵‍♂️
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-bridal-border w-full"></div>
            <span className="bg-bridal-surface px-3 text-[11px] font-bold text-bridal-mauve whitespace-nowrap">
              أو باستخدام رقم الموبايل / الإيميل
            </span>
            <div className="border-t border-bridal-border w-full"></div>
          </div>

          {/* Method Switcher Tabs: Phone vs Email */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-bridal-cream border border-bridal-border">
            <button
              type="button"
              onClick={() => {
                setAuthTab('phone');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                authTab === 'phone'
                  ? 'bg-bridal-rose text-white shadow-bridal'
                  : 'text-bridal-mauve hover:text-bridal-charcoal'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>برقم الموبايل</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('email');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                authTab === 'email'
                  ? 'bg-bridal-rose text-white shadow-bridal'
                  : 'text-bridal-mauve hover:text-bridal-charcoal'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>بالبريد الإلكتروني</span>
            </button>
          </div>

          {/* Sub-Switch: Register vs Login */}
          <div className="flex items-center justify-center gap-4 text-xs font-bold border-b border-bridal-border pb-2.5">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`pb-1.5 transition border-b-2 ${
                mode === 'register'
                  ? 'border-bridal-rose text-bridal-roseDark font-extrabold'
                  : 'border-transparent text-bridal-mauve hover:text-bridal-charcoal'
              }`}
            >
              {isMale ? '✨ عريس جديد (إنشاء حساب)' : '✨ عروسة جديدة (إنشاء حساب)'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`pb-1.5 transition border-b-2 ${
                mode === 'login'
                  ? 'border-bridal-rose text-bridal-roseDark font-extrabold'
                  : 'border-transparent text-bridal-mauve hover:text-bridal-charcoal'
              }`}
            >
              🔑 عندي حساب بالفعل (دخول)
            </button>
          </div>

          {/* Gender Selection for Phone/Email Registration (Female = untouched bridal theme, Male = Groom Navy/Gold theme & Groom Categories) */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-bridal-charcoal">
                أنا أسجل كـ (لتخصيص الألوان وأقسام الجهاز) *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setGender('female');
                    setUserManuallyPickedGender(true);
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border-2 text-xs sm:text-sm font-extrabold transition-all ${
                    !isMale
                      ? 'bg-bridal-roseLight border-bridal-rose text-bridal-roseDark shadow-xs'
                      : 'bg-bridal-cream/50 border-bridal-border text-bridal-mauve hover:text-bridal-charcoal'
                  }`}
                >
                  <span className="text-base">👰‍♀️</span>
                  <span>أنا العروسة (أنثى)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGender('male');
                    setUserManuallyPickedGender(true);
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border-2 text-xs sm:text-sm font-extrabold transition-all ${
                    isMale
                      ? 'bg-bridal-roseLight border-bridal-rose text-bridal-roseDark shadow-xs'
                      : 'bg-bridal-cream/50 border-bridal-border text-bridal-mauve hover:text-bridal-charcoal'
                  }`}
                >
                  <span className="text-base">🤵‍♂️</span>
                  <span>أنا العريس (ذكر)</span>
                </button>
              </div>
              <p className="text-[11px] text-bridal-mauve">
                {isMale
                  ? '✨ تم تفعيل التصميم الرجالي وأقسام تأسيس العريس (الأثاث، التشطيبات، التكييفات، الذهب، البدلة، والفرح).'
                  : '🌸 تصميم العروسة الوردي الهادئ مع 8 أقسام كاملة لجهاز العروسة المصرية.'}
              </p>
            </div>
          )}

          {/* Error Alert */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="p-3.5 rounded-2xl bg-red-500/10 border border-red-400/40 text-red-600 text-xs font-bold flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form
            onSubmit={authTab === 'phone' ? handlePhoneAuth : handleEmailAuth}
            className="space-y-3.5"
          >
            {/* Name (Shown on Register) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                  {isMale ? 'اسم العريس *' : 'اسم العروسة *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-bridal-rose absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={brideName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={
                      isMale
                        ? 'مثال: محمد أحمد / تجهيزات العريس محمد'
                        : 'مثال: سارة أحمد / جهاز العروسة سارة'
                    }
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border focus:border-bridal-rose outline-none text-sm font-bold text-bridal-charcoal"
                  />
                </div>
              </div>
            )}

            {/* Phone Number Field */}
            {(authTab === 'phone' || mode === 'register') && (
              <div>
                <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                  {authTab === 'phone' ? 'رقم الموبايل المصري *' : 'رقم الموبايل (اختياري)'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-bridal-rose absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="01012345678"
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border focus:border-bridal-rose outline-none text-sm font-bold text-bridal-charcoal text-right"
                  />
                </div>
              </div>
            )}

            {/* Email Field (When in Email Tab) */}
            {authTab === 'email' && (
              <div>
                <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                  البريد الإلكتروني *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-bridal-rose absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isMale ? 'groom@example.com' : 'bride@example.com'}
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border focus:border-bridal-rose outline-none text-sm font-bold text-bridal-charcoal text-right"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-bridal-charcoal mb-1">
                كلمة المرور *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-bridal-rose absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف أو أرقام على الأقل"
                  className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border focus:border-bridal-rose outline-none text-sm font-bold text-bridal-charcoal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-bridal-mauve hover:text-bridal-charcoal"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Extra Optional Onboarding Fields on Register: Wedding Date & Total Budget */}
            {mode === 'register' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                    تاريخ الفرح (اختياري)
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-bridal-rose absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      className="w-full pr-9 pl-3 py-2 rounded-xl bg-bridal-cream/50 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-bridal-mauve mb-1">
                    الميزانية التقديرية (ج.م)
                  </label>
                  <div className="relative">
                    <Wallet className="w-3.5 h-3.5 text-bridal-rose absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(e.target.value)}
                      placeholder="300000"
                      className="w-full pr-9 pl-3 py-2 rounded-xl bg-bridal-cream/50 border border-bridal-border text-xs font-bold text-bridal-charcoal"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white font-extrabold text-sm shadow-bridal hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span>جاري تجهيز حسابك...</span>
              ) : mode === 'register' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isMale
                      ? 'إنشاء حسابي وتجهيز قائمة العريس (8 أقسام كاملة)'
                      : 'إنشاء حسابي وتجهيز قائمة العروسة (8 أقسام كاملة)'}
                  </span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول إلى مشوارنا</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 4. Guest / Local Preview Fallback */}
          <div className="pt-3 border-t border-bridal-border text-center">
            <button
              type="button"
              onClick={handleGuestClick}
              className="w-full py-2.5 px-4 rounded-xl bg-bridal-cream hover:bg-bridal-roseLight/50 text-bridal-mauve hover:text-bridal-charcoal border border-bridal-border text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-bridal-sage" />
              <span>
                {isMale
                  ? 'الدخول السريع كعريس بدون حساب (حفظ على هذا الجهاز فقط)'
                  : 'الدخول السريع بدون حساب (حفظ على هذا الجهاز فقط)'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
