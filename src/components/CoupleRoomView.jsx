import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Link2,
  Copy,
  Check,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  FileText,
  Unlink
} from 'lucide-react';
import {
  formatCurrency,
  calculateTrousseauMetrics,
  linkWithPartnerByCodeOrPhone,
  subscribeToLinkedPartnerData,
  DEFAULT_COUPLE_AGREEMENTS
} from '../db';

export default function CoupleRoomView({
  settings,
  items,
  onUpdateSettings,
  onOpenPrintQayma,
  isReadOnly = false
}) {
  const isMale = settings?.gender === 'male';
  const myPartnerCode =
    settings?.partnerCode ||
    `MSH-${String(settings?.brideName || '2026').slice(0, 2).toUpperCase()}89`;

  const [partnerInput, setPartnerInput] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Live Partner Cloud Data
  const [partnerCloud, setPartnerCloud] = useState(null);

  // Shared Agreements
  const agreements = Array.isArray(settings?.coupleAgreements)
    ? settings.coupleAgreements
    : DEFAULT_COUPLE_AGREEMENTS;

  const [newAgrTitle, setNewAgrTitle] = useState('');
  const [newAgrAssigned, setNewAgrAssigned] = useState('shared');
  const [newAgrNote, setNewAgrNote] = useState('');

  useEffect(() => {
    if (!settings?.linkedPartnerUid) {
      setPartnerCloud(null);
      return undefined;
    }
    const unsub = subscribeToLinkedPartnerData(settings.linkedPartnerUid, (data) => {
      setPartnerCloud(data);
    });
    return () => unsub();
  }, [settings?.linkedPartnerUid]);

  const myMetrics = calculateTrousseauMetrics(items, settings);
  const partnerProfile = partnerCloud?.profile || null;
  const partnerItems = partnerCloud?.trousseau?.items || [];
  const partnerSettings = partnerCloud?.trousseau?.settings || {};
  const partnerMetrics = partnerProfile
    ? {
        totalBudget: partnerProfile.totalBudget || partnerSettings.totalBudget || 300000,
        totalSpent: partnerProfile.totalSpent || 0,
        completionPercentage: partnerProfile.completionPercentage || 0,
        purchasedItemsCount: partnerProfile.purchasedItemsCount || 0,
        totalItemsCount: partnerProfile.totalItemsCount || partnerItems.length || 0
      }
    : null;

  const handleCopyMyCode = async () => {
    try {
      await navigator.clipboard.writeText(myPartnerCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleLinkPartner = async (e) => {
    e.preventDefault();
    setLinkError('');
    if (!partnerInput.trim()) return;
    setLinking(true);
    try {
      await linkWithPartnerByCodeOrPhone(partnerInput);
      setPartnerInput('');
    } catch (err) {
      setLinkError(err?.message || 'تعذر ربط الحساب، تأكد من كود الشريك أو رقم الموبايل.');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkPartner = async () => {
    if (window.confirm('هل تريد إلغاء ربط الحساب الحالي بالشريك؟')) {
      await onUpdateSettings({
        linkedPartnerUid: '',
        linkedPartnerName: ''
      });
    }
  };

  const saveAgreements = async (nextList) => {
    if (isReadOnly) return;
    await onUpdateSettings({ coupleAgreements: nextList });
  };

  const handleAddAgreement = async (e) => {
    e.preventDefault();
    if (!newAgrTitle.trim()) return;
    const item = {
      id: `agr-${Date.now()}`,
      title: newAgrTitle.trim(),
      assignedTo: newAgrAssigned,
      status: 'pending',
      budgetNote: newAgrNote.trim()
    };
    await saveAgreements([...agreements, item]);
    setNewAgrTitle('');
    setNewAgrNote('');
  };

  const handleToggleAgreementStatus = async (id) => {
    if (isReadOnly) return;
    const next = agreements.map((a) =>
      a.id === id
        ? { ...a, status: a.status === 'done' ? 'in_progress' : 'done' }
        : a
    );
    await saveAgreements(next);
  };

  const handleChangeAssigned = async (id, nextAssigned) => {
    if (isReadOnly) return;
    const next = agreements.map((a) =>
      a.id === id ? { ...a, assignedTo: nextAssigned } : a
    );
    await saveAgreements(next);
  };

  const handleDeleteAgreement = async (id) => {
    if (isReadOnly) return;
    await saveAgreements(agreements.filter((a) => a.id !== id));
  };

  return (
    <div dir="rtl" className="space-y-6 pb-12">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-l from-bridal-roseLight/70 via-bridal-surface to-bridal-cream rounded-3xl border border-bridal-border p-5 sm:p-7 shadow-bridal">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bridal-roseLight text-bridal-roseDark text-xs font-extrabold border border-bridal-rose/30">
              <Heart className="w-3.5 h-3.5 fill-bridal-rose" />
              <span>غرفة «مشوارنا المشتركة» للعريس والعروسة 🏡💍</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-bridal-charcoal">
              ربط حساب العريس بحساب العروسة وتنسيق الجهاز المشترك
            </h2>
            <p className="text-xs sm:text-sm text-bridal-mauve max-w-2xl leading-relaxed">
              اربط حسابك بحساب شريك حياتك بكود الربط أو رقم الموبايل لمتابعة نسبة إنجاز الشقة والجهاز معاً، وتحديد الاتفاقات المشتركة، وتوليد قائمة المنقولات الزوجية بضغطة زر!
            </p>
          </div>

          {/* Partner Code Box */}
          <div className="bg-bridal-surface p-4 rounded-2xl border border-bridal-border shadow-xs flex flex-col gap-2 min-w-[260px]">
            <span className="text-[11px] font-bold text-bridal-mauve">
              كود الربط الخاص بحسابك (أرسله لشريكك):
            </span>
            <div className="flex items-center justify-between gap-2 bg-bridal-cream px-3.5 py-2 rounded-xl border border-bridal-border">
              <span
                dir="ltr"
                className="font-mono text-base font-extrabold text-bridal-roseDark tracking-wider"
              >
                {myPartnerCode}
              </span>
              <button
                type="button"
                onClick={handleCopyMyCode}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bridal-rose text-white text-xs font-bold"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Link Input Form if not linked */}
        {!settings?.linkedPartnerUid ? (
          <form
            onSubmit={handleLinkPartner}
            className="mt-5 pt-4 border-t border-bridal-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="flex-1 relative">
              <Link2 className="w-4 h-4 text-bridal-rose absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={partnerInput}
                onChange={(e) => setPartnerInput(e.target.value)}
                placeholder="أدخل كود شريكك (مثال: MSH-1A2B) أو رقم موبايله لربط الحسابين فوراً..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-bridal-surface border border-bridal-border text-xs sm:text-sm font-bold text-bridal-charcoal outline-none focus:border-bridal-rose"
              />
            </div>
            <button
              type="submit"
              disabled={linking}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white text-xs sm:text-sm font-extrabold shadow-bridal"
            >
              {linking ? 'جاري البحث والربط...' : 'ربط الحسابين الآن 🔗'}
            </button>
          </form>
        ) : (
          <div className="mt-4 pt-3 border-t border-bridal-border flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-bridal-sageDark">
              <CheckCircle2 className="w-4 h-4 text-bridal-sage" />
              <span>
                حسابك مرتبط الآن لحظياً مع:{' '}
                <strong className="underline">
                  {partnerProfile?.brideName || settings?.linkedPartnerName || 'شريك حياتك'}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleUnlinkPartner}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>إلغاء الربط</span>
            </button>
          </div>
        )}

        {linkError && (
          <p className="mt-2 text-xs font-bold text-red-600">{linkError}</p>
        )}
      </div>

      {/* Side-by-Side Progress Comparison: My Progress vs Partner's Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Current User */}
        <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 shadow-bridal space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{isMale ? '🤵‍♂️' : '👰‍♀️'}</span>
              <div>
                <h3 className="text-base font-extrabold text-bridal-charcoal">
                  {settings?.brideName || (isMale ? 'جهاز العريس' : 'جهاز العروسة')} (أنت)
                </h3>
                <p className="text-xs text-bridal-mauve">
                  تم شراء {myMetrics.purchasedItemsCount} من {myMetrics.totalItemsCount} صنف
                </p>
              </div>
            </div>
            <span className="text-xl font-extrabold text-bridal-roseDark">
              {myMetrics.completionPercentage}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-bridal-cream rounded-full overflow-hidden">
            <div
              className="h-full bg-bridal-rose rounded-full transition-all"
              style={{ width: `${myMetrics.completionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
            <div className="p-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border">
              <span className="text-bridal-mauve block">الميزانية المحددة</span>
              <span className="font-extrabold text-bridal-charcoal">
                {formatCurrency(myMetrics.totalBudget, 'ar')} ج.م
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border">
              <span className="text-bridal-mauve block">إجمالي المشتريات</span>
              <span className="font-extrabold text-bridal-sageDark">
                {formatCurrency(myMetrics.totalSpent, 'ar')} ج.م
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Partner */}
        <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 shadow-bridal space-y-3 flex flex-col justify-between">
          {partnerMetrics ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">
                    {partnerProfile?.gender === 'male' ? '🤵‍♂️' : '👰‍♀️'}
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-bridal-charcoal">
                      {partnerProfile?.brideName || 'شريك حياتك'}
                    </h3>
                    <p className="text-xs text-bridal-mauve">
                      تم شراء {partnerMetrics.purchasedItemsCount} من{' '}
                      {partnerMetrics.totalItemsCount} صنف
                    </p>
                  </div>
                </div>
                <span className="text-xl font-extrabold text-bridal-sageDark">
                  {partnerMetrics.completionPercentage}%
                </span>
              </div>

              <div className="w-full h-2.5 bg-bridal-cream rounded-full overflow-hidden">
                <div
                  className="h-full bg-bridal-sage rounded-full transition-all"
                  style={{ width: `${partnerMetrics.completionPercentage}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="p-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border">
                  <span className="text-bridal-mauve block">الميزانية المحددة</span>
                  <span className="font-extrabold text-bridal-charcoal">
                    {formatCurrency(partnerMetrics.totalBudget, 'ar')} ج.م
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-bridal-cream/60 border border-bridal-border">
                  <span className="text-bridal-mauve block">إجمالي المشتريات</span>
                  <span className="font-extrabold text-bridal-sageDark">
                    {formatCurrency(partnerMetrics.totalSpent, 'ar')} ج.م
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-2">
              <Users className="w-8 h-8 text-bridal-rose mx-auto opacity-80" />
              <h4 className="text-sm font-extrabold text-bridal-charcoal">
                لم يتم ربط حساب الطرف الآخر بعد
              </h4>
              <p className="text-xs text-bridal-mauve max-w-xs mx-auto">
                انسخ كود الربط الخاص بك ({myPartnerCode}) وأرسله لشريك حياتك أو أدخل كوده في الأعلى لتظهر نسبة إنجازه هنا لحظياً!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Banner for Official Marriage Furniture List ("قايمة المنقولات الزوجية") */}
      {onOpenPrintQayma && (
        <div className="bg-gradient-to-l from-bridal-goldLight/80 via-bridal-surface to-bridal-cream rounded-3xl border border-bridal-gold/50 p-5 shadow-bridal flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-bridal-charcoal flex items-center gap-2">
              <FileText className="w-5 h-5 text-bridal-gold" />
              <span>مُولّد وثيقة «قائمة المنقولات الزوجية (قايمة العفش)» التلقائي 📜</span>
            </h3>
            <p className="text-xs text-bridal-mauve">
              يجمع تلقائياً الأصناف والماركات والأسعار المسجلة في وثيقة قائمة منقولات زوجية رسمية منسقة وجاهزة للطباعة والتوقيع!
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPrintQayma}
            className="px-5 py-2.5 rounded-2xl bg-bridal-charcoal text-bridal-gold text-xs sm:text-sm font-extrabold shadow-xs hover:opacity-95 transition flex-shrink-0"
          >
            فتح وطباعة قايمة المنقولات 📜
          </button>
        </div>
      )}

      {/* Shared Agreements Table: Who Buys What? */}
      <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 sm:p-6 shadow-bridal space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-bridal-charcoal flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-bridal-rose" />
            <span>جدول اتفاقات الجهاز والشقة (مين هيجيب إيه؟ 🤝)</span>
          </h3>
          <p className="text-xs text-bridal-mauve mt-0.5">
            نظّما اتفاقاتكما حول البنود المشتركة لمنع تكرار شراء نفس البند أو نسيان أي تفصيلة في الشقة.
          </p>
        </div>

        {/* Add New Agreement Item */}
        {!isReadOnly && (
          <form
            onSubmit={handleAddAgreement}
            className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-bridal-cream/60 border border-bridal-border"
          >
            <input
              type="text"
              value={newAgrTitle}
              onChange={(e) => setNewAgrTitle(e.target.value)}
              placeholder="أضف بند اتفاق جديد (مثال: الميكروويف / تكييف الغرفة / السجاد)..."
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-xs font-bold text-bridal-charcoal"
            />
            <select
              value={newAgrAssigned}
              onChange={(e) => setNewAgrAssigned(e.target.value)}
              className="px-3 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-xs font-bold text-bridal-charcoal"
            >
              <option value="groom">🤵‍♂️ على العريس</option>
              <option value="bride">👰‍♀️ على العروسة</option>
              <option value="shared">🤝 مناصفة / مشترك</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-bridal-rose text-white text-xs font-extrabold"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة للاتفاقات</span>
            </button>
          </form>
        )}

        <div className="space-y-2.5">
          {agreements.map((agr) => (
            <div
              key={agr.id}
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                agr.status === 'done'
                  ? 'bg-bridal-sageLight/30 border-bridal-sage/50'
                  : 'bg-bridal-cream/40 border-bridal-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleAgreementStatus(agr.id)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${
                    agr.status === 'done'
                      ? 'bg-bridal-sage border-bridal-sage text-white'
                      : 'border-bridal-border bg-bridal-surface'
                  }`}
                >
                  {agr.status === 'done' && <Check className="w-4 h-4" />}
                </button>
                <div>
                  <h4
                    className={`text-xs sm:text-sm font-extrabold ${
                      agr.status === 'done'
                        ? 'line-through text-bridal-mauve'
                        : 'text-bridal-charcoal'
                    }`}
                  >
                    {agr.title}
                  </h4>
                  {agr.budgetNote && (
                    <span className="text-[11px] text-bridal-mauve">{agr.budgetNote}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <select
                  disabled={isReadOnly}
                  value={agr.assignedTo}
                  onChange={(e) => handleChangeAssigned(agr.id, e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-bridal-surface border border-bridal-border text-xs font-extrabold text-bridal-charcoal"
                >
                  <option value="groom">🤵‍♂️ على العريس</option>
                  <option value="bride">👰‍♀️ على العروسة</option>
                  <option value="shared">🤝 مشترك (50/50)</option>
                </select>

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAgreement(agr.id)}
                    className="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
