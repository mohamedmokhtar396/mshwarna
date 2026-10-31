import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Award,
  Search,
  Eye,
  Link2,
  FileJson,
  Printer,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db as firestoreDb } from '../firebaseConfig';
import { formatCurrency, exportBrideCloudPayload } from '../db';
import ShareShowcaseModal from './ShareShowcaseModal';

export default function AdminDashboard({
  currentUser,
  activeTargetUid,
  onImpersonateBride,
  onPrintBrideReport
}) {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lastActive'); // 'lastActive' | 'budget' | 'completion'
  const [toastMsg, setToastMsg] = useState('');
  const [exportingUid, setExportingUid] = useState(null);

  // Share Modal State
  const [shareTargetUser, setShareTargetUser] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestoreDb, 'users'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({
            uid: docSnap.id,
            ...docSnap.data()
          });
        });
        setUsersList(list);
        setLoading(false);
      },
      (err) => {
        console.error('Admin users snapshot error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Platform Executive KPIs
  const kpis = useMemo(() => {
    const totalBrides = usersList.length;
    const totalBudgets = usersList.reduce(
      (sum, u) => sum + (Number(u.totalBudget) || 0),
      0
    );
    const totalSpent = usersList.reduce(
      (sum, u) => sum + (Number(u.totalSpent) || 0),
      0
    );
    const totalRemainingDebt = usersList.reduce(
      (sum, u) => sum + (Number(u.totalRemainingDebt) || 0),
      0
    );
    const avgCompletion =
      totalBrides > 0
        ? Math.round(
            usersList.reduce(
              (sum, u) => sum + (Number(u.completionPercentage) || 0),
              0
            ) / totalBrides
          )
        : 0;

    return {
      totalBrides,
      totalBudgets,
      totalSpent,
      totalRemainingDebt,
      avgCompletion
    };
  }, [usersList]);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = usersList.filter((u) => {
      if (!q) return true;
      const nameMatch = (u.brideName || '').toLowerCase().includes(q);
      const emailMatch = (u.email || '').toLowerCase().includes(q);
      const phoneMatch = (u.phoneNumber || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || phoneMatch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'budget') {
        return (Number(b.totalBudget) || 0) - (Number(a.totalBudget) || 0);
      }
      if (sortBy === 'completion') {
        return (
          (Number(b.completionPercentage) || 0) -
          (Number(a.completionPercentage) || 0)
        );
      }
      // Default: lastActive descending
      const dateA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
      const dateB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [usersList, searchTerm, sortBy]);

  const handleExportUserJson = async (bride) => {
    setExportingUid(bride.uid);
    try {
      const payload = await exportBrideCloudPayload(bride.uid);
      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const safeName = (bride.brideName || bride.uid)
        .replace(/\s+/g, '_')
        .slice(0, 30);
      const fileName = `trousseau_template_${safeName}.json`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`تم تحميل بيانات وقالب جهاز «${bride.brideName || 'العروسة'}» بنجاح ✓`);
    } catch (err) {
      showToast(`تعذر تصدير البيانات: ${err.message}`);
    } finally {
      setExportingUid(null);
    }
  };

  const renderAuthBadge = (method) => {
    if (method === 'google') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-400/30 text-[11px] font-extrabold">
          Google 🌐
        </span>
      );
    }
    if (method === 'phone') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-bridal-sageLight text-bridal-sageDark border border-bridal-sage/40 text-[11px] font-extrabold">
          موبايل 📱
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-bridal-roseLight text-bridal-roseDark border border-bridal-rose/30 text-[11px] font-extrabold">
        إيميل ✉️
      </span>
    );
  };

  const formatDateAr = (isoStr) => {
    if (!isoStr) return 'غير محدد';
    try {
      return new Date(isoStr).toLocaleString('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div dir="rtl" className="space-y-6 pb-12">
      {/* Top Executive Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-l from-bridal-charcoal via-[#4A3540] to-[#36242E] text-white p-6 sm:p-7 shadow-bridal-lg border border-bridal-gold/30"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-bridal-gold/20 border border-bridal-gold/50 text-bridal-gold flex items-center justify-center flex-shrink-0 shadow-sm">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-bridal-gold/20 text-bridal-gold text-xs font-extrabold border border-bridal-gold/40 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>مركز القيادة والتحكم الكامل — Super Admin</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                لوحة الإدارة العليا ومتابعة حسابات العرائس 🛡️
              </h2>
              <p className="text-xs sm:text-sm text-white/75 mt-1">
                مرحباً بك ({currentUser?.email}) — يمكنك متابعة جميع الحسابات لحظياً، الدخول لأي حساب وتعديله، أو نسخ ومشاركة نماذج الجهاز.
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl px-4 py-3 border border-white/15 text-xs space-y-1 flex-shrink-0">
            <div className="text-white/70">حالة الاتصال بقاعدة البيانات:</div>
            <div className="flex items-center gap-1.5 font-extrabold text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>مزامنة لحظية مباشرة (Live Cloud Sync)</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Toast Notification */}
      {toastMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-bridal-sageLight border border-bridal-sage text-bridal-sageDark text-xs sm:text-sm font-extrabold flex items-center gap-2.5 shadow-bridal"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMsg}</span>
        </motion.div>
      )}

      {/* A. Platform Executive Overview (5 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Registered Brides */}
        <div className="bg-bridal-surface rounded-2xl border border-bridal-border p-4 shadow-bridal flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-bridal-mauve">
              إجمالي العرائس المسجلين
            </span>
            <div className="w-9 h-9 rounded-xl bg-bridal-roseLight text-bridal-roseDark flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-bridal-charcoal">
              {formatCurrency(kpis.totalBrides, 'ar')}
            </span>
            <span className="text-xs font-bold text-bridal-mauve">حساب عروسة</span>
          </div>
        </div>

        {/* 2. Total Budgets in EGP */}
        <div className="bg-bridal-surface rounded-2xl border border-bridal-border p-4 shadow-bridal flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-bridal-mauve">
              إجمالي الميزانيات المدارة
            </span>
            <div className="w-9 h-9 rounded-xl bg-bridal-cream text-bridal-charcoal flex items-center justify-center">
              <Wallet className="w-4 h-4 text-bridal-rose" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-bridal-charcoal">
              {formatCurrency(kpis.totalBudgets, 'ar')}
            </span>
            <span className="text-[11px] font-bold text-bridal-mauve">ج.م</span>
          </div>
        </div>

        {/* 3. Total Spent Across Platform */}
        <div className="bg-bridal-surface rounded-2xl border border-bridal-border p-4 shadow-bridal flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-bridal-mauve">
              إجمالي المشتريات الفعلية
            </span>
            <div className="w-9 h-9 rounded-xl bg-bridal-sageLight text-bridal-sageDark flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-bridal-sageDark">
              {formatCurrency(kpis.totalSpent, 'ar')}
            </span>
            <span className="text-[11px] font-bold text-bridal-mauve">ج.م</span>
          </div>
        </div>

        {/* 4. Total Remaining Installments */}
        <div className="bg-bridal-surface rounded-2xl border border-bridal-border p-4 shadow-bridal flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-bridal-mauve">
              إجمالي المتبقي والأقساط للتجار
            </span>
            <div className="w-9 h-9 rounded-xl bg-bridal-goldLight text-bridal-gold flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-bridal-gold">
              {formatCurrency(kpis.totalRemainingDebt, 'ar')}
            </span>
            <span className="text-[11px] font-bold text-bridal-mauve">ج.م</span>
          </div>
        </div>

        {/* 5. Average Completion % */}
        <div className="bg-bridal-surface rounded-2xl border border-bridal-border p-4 shadow-bridal flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-bridal-mauve">
              متوسط نسبة إنجاز الجهاز
            </span>
            <div className="w-9 h-9 rounded-xl bg-bridal-roseLight text-bridal-roseDark flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl font-extrabold text-bridal-roseDark">
              {kpis.avgCompletion}%
            </span>
            <div className="w-20 h-2 bg-bridal-cream rounded-full overflow-hidden">
              <div
                className="h-full bg-bridal-rose rounded-full"
                style={{ width: `${kpis.avgCompletion}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* B. Search & Sort Controls for Users Directory */}
      <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-4 sm:p-5 shadow-bridal space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
              دليل جميع حسابات العرائس بالتفصيل ({filteredUsers.length})
            </h3>
            <p className="text-xs text-bridal-mauve">
              ابحث بالاسم أو رقم الموبايل أو البريد الإلكتروني، أو اختر أي حساب للمعاينة والتعديل المباشر
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-bridal-mauve absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث باسم العروسة، الموبايل، الإيميل..."
                className="w-full pr-10 pl-3.5 py-2 rounded-xl bg-bridal-cream/70 border border-bridal-border focus:border-bridal-rose outline-none text-xs sm:text-sm font-bold text-bridal-charcoal"
              />
            </div>

            {/* Sort Selector */}
            <div className="inline-flex items-center gap-1.5 bg-bridal-cream px-3 py-1.5 rounded-xl border border-bridal-border text-xs font-bold text-bridal-charcoal">
              <ArrowUpDown className="w-3.5 h-3.5 text-bridal-rose" />
              <span>ترتيب حسب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent outline-none font-extrabold text-bridal-roseDark cursor-pointer"
              >
                <option value="lastActive">آخر ظهور ونشاط</option>
                <option value="budget">أعلى ميزانية</option>
                <option value="completion">أعلى نسبة إنجاز %</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Cards / Rows List */}
        {loading ? (
          <div className="py-12 text-center text-sm font-bold text-bridal-mauve">
            جاري تحميل بيانات جميع المستخدمين من السحابة...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-sm font-bold text-bridal-mauve">
            لا توجد حسابات مطابقة لبحثك حالياً.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((bride) => {
              const isCurrentlyImpersonating = activeTargetUid === bride.uid;
              const completion = Number(bride.completionPercentage) || 0;
              const purchasedCount = Number(bride.purchasedItemsCount) || 0;
              const totalCount = Number(bride.totalItemsCount) || 74;
              const displayEmail =
                bride.email && !bride.email.endsWith('@phone.gehaz-el3rosa.com')
                  ? bride.email
                  : '';

              return (
                <motion.div
                  key={bride.uid}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                    isCurrentlyImpersonating
                      ? 'bg-bridal-goldLight/40 border-2 border-bridal-gold shadow-bridal'
                      : 'bg-bridal-bg/70 border-bridal-border hover:border-bridal-rose/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Column: Bride Identity & Contact Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
                          {bride.brideName || 'عروسة بدون اسم'}
                        </h4>
                        {renderAuthBadge(bride.authMethod)}
                        {isCurrentlyImpersonating && (
                          <span className="px-2.5 py-0.5 rounded-full bg-bridal-gold text-white text-[11px] font-extrabold">
                            الحساب النشط حالياً ✓
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-bridal-mauve">
                        {bride.phoneNumber && (
                          <span className="inline-flex items-center gap-1 font-bold text-bridal-charcoal">
                            <Phone className="w-3.5 h-3.5 text-bridal-rose" />
                            <span dir="ltr">{bride.phoneNumber}</span>
                          </span>
                        )}
                        {displayEmail && (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Mail className="w-3.5 h-3.5 text-bridal-rose" />
                            <span dir="ltr">{displayEmail}</span>
                          </span>
                        )}
                        {bride.weddingDate && (
                          <span className="inline-flex items-center gap-1 font-bold text-bridal-roseDark">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>تاريخ الفرح: {bride.weddingDate}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>آخر ظهور: {formatDateAr(bride.lastActiveAt)}</span>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="pt-1 max-w-md">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-bridal-charcoal">
                            إنجاز الجهاز: {purchasedCount} من {totalCount} بند
                          </span>
                          <span className="text-bridal-roseDark font-extrabold">
                            {completion}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-bridal-cream rounded-full overflow-hidden border border-bridal-border">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-bridal-sage to-bridal-rose transition-all duration-500"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Middle Column: Financial Summary Pills */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-bridal-surface p-3 rounded-2xl border border-bridal-border text-center min-w-[270px]">
                      <div>
                        <div className="text-[11px] text-bridal-mauve font-medium">
                          الميزانية
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold text-bridal-charcoal mt-0.5">
                          {formatCurrency(bride.totalBudget || 0, 'ar')} ج.م
                        </div>
                      </div>
                      <div className="border-x border-bridal-border px-2">
                        <div className="text-[11px] text-bridal-mauve font-medium">
                          المدفوع / المشتريات
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold text-bridal-sageDark mt-0.5">
                          {formatCurrency(bride.totalSpent || 0, 'ar')} ج.م
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-bridal-mauve font-medium">
                          المتبقي للتجار
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold text-bridal-gold mt-0.5">
                          {formatCurrency(bride.totalRemainingDebt || 0, 'ar')} ج.م
                        </div>
                      </div>
                    </div>

                    {/* Right Column: 4 Super Admin Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-shrink-0">
                      {/* 1. Impersonate / Live Access */}
                      <button
                        type="button"
                        onClick={() => onImpersonateBride(bride)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white text-xs font-extrabold shadow-xs hover:opacity-95 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>دخول لحساب العروسة (تصفح وتعديل)</span>
                      </button>

                      {/* 2. Clone & Share Link */}
                      <button
                        type="button"
                        onClick={() => setShareTargetUser(bride)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-bridal-sage text-white text-xs font-extrabold shadow-xs hover:opacity-95 transition"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>نسخ البروفايل ومشاركته برابط عرض</span>
                      </button>

                      {/* 3. Export JSON Template */}
                      <button
                        type="button"
                        disabled={exportingUid === bride.uid}
                        onClick={() => handleExportUserJson(bride)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-surface hover:bg-bridal-cream text-bridal-charcoal border border-bridal-border text-xs font-bold transition"
                      >
                        <FileJson className="w-3.5 h-3.5 text-bridal-rose" />
                        <span>
                          {exportingUid === bride.uid
                            ? 'جاري النسخ...'
                            : 'نسخ بيانات الجهاز كملف أو قالب'}
                        </span>
                      </button>

                      {/* 4. Print Full Inventory Report */}
                      <button
                        type="button"
                        onClick={() => onPrintBrideReport(bride)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-goldLight hover:bg-bridal-gold/25 text-bridal-charcoal border border-bridal-gold/40 text-xs font-bold transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-bridal-gold" />
                        <span>طباعة كشف جهاز العروسة</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Showcase Modal for Selected Bride */}
      <ShareShowcaseModal
        isOpen={Boolean(shareTargetUser)}
        onClose={() => setShareTargetUser(null)}
        targetUid={shareTargetUser?.uid}
        defaultBrideName={shareTargetUser?.brideName || 'أحلى عروسة'}
        currentUser={currentUser}
      />
    </div>
  );
}
