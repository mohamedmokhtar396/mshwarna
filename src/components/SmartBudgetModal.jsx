import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calculator,
  Sparkles,
  Check,
  MapPin,
  Wallet
} from 'lucide-react';
import { formatCurrency, parseArabicNumber } from '../db';

const REGIONS = [
  {
    id: 'cairo_alex',
    name: 'القاهرة الكبرى والإسكندرية والمدن الجديدة',
    desc: 'توزيع متوازن يراعي ارتفاع تكلفة التشطيبات والأثاث المودرن والأجهزة الأساسية',
    brideWeights: [
      { title: 'الأجهزة الكهربائية الكبيرة والصغيرة', pct: 42, tip: 'ركزي على الفرز الأول بضمان معتمد للثلاجة والغسالة والبوتاجاز.' },
      { title: 'أطقم المطبخ والحلل والرفايع', pct: 20, tip: 'طقم جرانيت أو استانلس أصلي يغني عن شراء 5 أطقم غير مستخدمة.' },
      { title: 'المفروشات والبطاطين والفوط', pct: 16, tip: 'اشتري الأعداد العملية المناسبة لمساحة الدولاب.' },
      { title: 'الملابس واللانجيري والخروج', pct: 12, tip: 'نوعي في المقاسات والمواسم دون مبالغة.' },
      { title: 'مستحضرات التجميل والعناية والشنط', pct: 10, tip: 'اتركي شراء المكياج والكريمات لآخر 3 شهور قبل الفرح بسبب تاريخ الصلاحية.' }
    ],
    groomWeights: [
      { title: 'تشطيب الشقة (سباكة، كهرباء، سيراميك، دهانات)', pct: 35, tip: 'اهتم بتأسيس السباكة والكهرباء بأعلى جودة لأن تعديلها لاحقاً مكلف.' },
      { title: 'الأثاث والخشب والمراتب (نوم، سفرة، ركنة)', pct: 30, tip: 'الأثاث المودرن العملي يوفر المساحة والميزانية.' },
      { title: 'الشبكة والذهب والمهر والرسوم', pct: 15, tip: 'يفضل شراء سبائك أو مشغولات بمصنعية معتدلة.' },
      { title: 'التكييفات والنجف والستائر', pct: 10, tip: 'ابدأ بتكييف غرفة النوم أو المعيشة أولاً.' },
      { title: 'قاعة الفرح والبدلة والتصوير وشهر العسل', pct: 10, tip: 'الحجز المبكر للقاعة والفوتوغرافر يوفر حتى 25%.' }
    ]
  },
  {
    id: 'delta',
    name: 'محافظات الدلتا والوجه البحري',
    desc: 'يراعي العرف السائد في الاهتمام بالمفروشات وأطقم النيش والمطبخ والأخشاب العمولة',
    brideWeights: [
      { title: 'الأجهزة الكهربائية والرفايع', pct: 38, tip: 'قارني الأسعار بين التوكيلات الكبرى قبل الشراء.' },
      { title: 'أطقم النيش والمطبخ والحلل', pct: 24, tip: 'اختاري الأطقم العملية القابلة للاستخدام اليومي.' },
      { title: 'المفروشات والبطاطين واللحاف', pct: 20, tip: 'الأقطان المصرية الصافية تدوم أطول بكثير.' },
      { title: 'الملابس والعبايات والبيتي', pct: 10, tip: 'قسمي المشتريات بين الصيفي والشتوي.' },
      { title: 'العطور والعناية والأحذية', pct: 8, tip: 'اشتري الأساسيات أولاً.' }
    ],
    groomWeights: [
      { title: 'الأثاث والخشب العمولة والمراتب', pct: 34, tip: 'تأكد من جفاف الخشب الزان والكونتر جيداً قبل الدهان.' },
      { title: 'تشطيب الشقة والسيراميك والدهانات', pct: 32, tip: 'استخدم دفتر عهدة المهندس في التطبيق لضبط فواتير الرمل والأسمنت.' },
      { title: 'الشبكة والذهب والمهر', pct: 16, tip: 'حدد ميزانية الشبكة مسبقاً بالاتفاق.' },
      { title: 'التكييفات والنجف والسجاد', pct: 9, tip: 'إضاءة الليد الموفرة تعطي شكلاً فخماً وتوفر الكهرباء.' },
      { title: 'الفرح والبدلة وشهر العسل', pct: 9, tip: 'حدد أولويات يوم الفرح مبكراً.' }
    ]
  },
  {
    id: 'upper_egypt',
    name: 'محافظات الصعيد والوجه القبلي',
    desc: 'يراعي عرف الذهب والشبكة وتجهيزات الأثاث والتشطيبات والأجهزة الأساسية',
    brideWeights: [
      { title: 'الأجهزة الكهربائية الأساسية', pct: 40, tip: 'ركزي على الأجهزة ذات التبريد العالي المناسبة لأجواء الصعيد.' },
      { title: 'المفروشات وأطقم السرير والبطاطين', pct: 22, tip: 'اختاري الخامات القطنية المريحة.' },
      { title: 'أدوات المطبخ والحلل والرفايع', pct: 18, tip: 'الأطقم العملية أهم من الزينة.' },
      { title: 'الملابس والعباءات والخروج', pct: 12, tip: 'نوعي بين المناسبات والاستخدام اليومي.' },
      { title: 'العطور ومستحضرات العناية', pct: 8, tip: 'احفظي العطور في مكان بعيد عن الحرارة.' }
    ],
    groomWeights: [
      { title: 'تشطيب الشقة وتأسيسها', pct: 32, tip: 'اهتم بالعزل الحراري والتكييفات.' },
      { title: 'الأثاث والغرف الخشبية', pct: 28, tip: 'اختر الأخشاب المتينة التي تتحمل.' },
      { title: 'الشبكة والذهب والمهور', pct: 22, tip: 'الذهب استثمار وحفظ لقيمة المال.' },
      { title: 'التكييفات والنجف والستائر', pct: 10, tip: 'تكييف الانفرتر يوفر استهلاك الكهرباء في الصيف.' },
      { title: 'مراسم الفرح والبدلة والضيافة', pct: 8, tip: 'نظم حجوزات الفرح والضيافة مبكراً.' }
    ]
  }
];

export default function SmartBudgetModal({
  isOpen,
  onClose,
  settings,
  onApplyBudget
}) {
  const [role, setRole] = useState(settings?.gender === 'male' ? 'male' : 'female');
  const [regionId, setRegionId] = useState('cairo_alex');
  const [budgetStr, setBudgetStr] = useState(String(settings?.totalBudget || 300000));
  const [applied, setApplied] = useState(false);

  const totalBudget = parseArabicNumber(budgetStr) || 300000;
  const activeRegion = REGIONS.find((r) => r.id === regionId) || REGIONS[0];
  const weights = role === 'male' ? activeRegion.groomWeights : activeRegion.brideWeights;

  const handleApply = () => {
    if (onApplyBudget) {
      onApplyBudget(totalBudget);
      setApplied(true);
      setTimeout(() => {
        setApplied(false);
        onClose();
      }, 900);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="w-full max-w-2xl bg-bridal-bg rounded-t-3xl sm:rounded-3xl border border-bridal-border shadow-bridal-lg overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-l from-bridal-roseLight to-bridal-cream border-b border-bridal-border">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-bridal-rose text-white flex items-center justify-center shadow-xs">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
                    حاسبة تقسيم الميزانية الذكية (حسب عرف المحافظة) 🧮✨
                  </h2>
                  <p className="text-[11px] sm:text-xs text-bridal-mauve">
                    توزيع استرشادي ذكي للميزانية على الأقسام لمنع نفاد السيولة قبل اكتمال الجهاز
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-bridal-surface text-bridal-mauve hover:text-bridal-charcoal border border-bridal-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Role & Total Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-bridal-charcoal mb-1.5">
                    نوع الميزانية
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('female')}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                        role === 'female'
                          ? 'bg-bridal-rose text-white border-bridal-rose'
                          : 'bg-bridal-surface text-bridal-charcoal border-bridal-border'
                      }`}
                    >
                      👰‍♀️ ميزانية العروسة
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('male')}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                        role === 'male'
                          ? 'bg-bridal-rose text-white border-bridal-rose'
                          : 'bg-bridal-surface text-bridal-charcoal border-bridal-border'
                      }`}
                    >
                      🤵‍♂️ ميزانية العريس
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-bridal-charcoal mb-1.5">
                    إجمالي الميزانية المتاحة (ج.م)
                  </label>
                  <div className="relative">
                    <Wallet className="w-4 h-4 text-bridal-rose absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={budgetStr}
                      onChange={(e) => setBudgetStr(e.target.value)}
                      className="w-full pr-10 pl-3.5 py-2 rounded-xl bg-bridal-surface border border-bridal-border text-sm font-extrabold text-bridal-charcoal outline-none focus:border-bridal-rose"
                    />
                  </div>
                </div>
              </div>

              {/* Governorate / Region Selector */}
              <div>
                <label className="block text-xs font-extrabold text-bridal-charcoal mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-bridal-rose" />
                  <span>اختر الإقليم / عرف المحافظة:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {REGIONS.map((reg) => (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => setRegionId(reg.id)}
                      className={`p-3 rounded-2xl border text-right transition ${
                        regionId === reg.id
                          ? 'bg-bridal-roseLight/70 border-bridal-rose text-bridal-charcoal'
                          : 'bg-bridal-surface border-bridal-border text-bridal-mauve hover:text-bridal-charcoal'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{reg.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Breakdown List */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-extrabold text-bridal-charcoal flex items-center justify-between">
                  <span>التقسيم المقترح لمبلغ {formatCurrency(totalBudget, 'ar')} ج.م:</span>
                  <span className="text-bridal-roseDark">100%</span>
                </div>

                {weights.map((w, i) => {
                  const amount = Math.round((totalBudget * w.pct) / 100);
                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-bridal-surface border border-bridal-border space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-bridal-charcoal">
                          {w.title} ({w.pct}%)
                        </span>
                        <span className="text-sm font-extrabold text-bridal-roseDark">
                          {formatCurrency(amount, 'ar')} ج.م
                        </span>
                      </div>
                      <div className="w-full h-2 bg-bridal-cream rounded-full overflow-hidden">
                        <div
                          className="h-full bg-bridal-rose rounded-full"
                          style={{ width: `${w.pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-bridal-mauve flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-bridal-gold flex-shrink-0" />
                        <span>{w.tip}</span>
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-bridal-cream text-bridal-mauve text-xs font-bold"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-l from-bridal-rose to-bridal-roseDark text-white text-xs sm:text-sm font-extrabold shadow-bridal"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {applied
                      ? 'تم اعتماد الميزانية! ✓'
                      : `اعتماد الميزانية (${formatCurrency(totalBudget, 'ar')} ج.م)`}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
