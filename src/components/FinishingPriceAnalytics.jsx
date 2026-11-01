import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  DollarSign,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../db';
import {
  normalizeMaterialKeyword,
  evaluateMarketPrice,
  extractQuantityNumber
} from '../utils/finishingBenchmarks';

export default function FinishingPriceAnalytics({
  expenses = [],
  onSelectMaterial
}) {
  // Group expenses by normalized material keyword
  const analysisData = useMemo(() => {
    const groups = {};

    expenses.forEach((ex) => {
      const keyword = normalizeMaterialKeyword(ex.title, ex.itemType);
      if (!groups[keyword]) {
        groups[keyword] = [];
      }
      // Calculate unitPrice if missing
      const parsedQty = extractQuantityNumber(ex.quantityText) || 1;
      const unitPrice =
        Number(ex.unitPrice) > 0
          ? Number(ex.unitPrice)
          : parsedQty > 0 && Number(ex.amount) > 0
          ? Math.round((Number(ex.amount) / parsedQty) * 100) / 100
          : Number(ex.amount) || 0;

      groups[keyword].push({
        ...ex,
        effectiveUnitPrice: unitPrice,
        effectiveQty: parsedQty
      });
    });

    const results = [];
    let totalHikeAmount = 0;
    let itemsWithHikesCount = 0;

    Object.entries(groups).forEach(([materialName, itemsList]) => {
      // Sort items by date ascending
      const sorted = [...itemsList].sort(
        (a, b) => new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0)
      );

      const firstPurchase = sorted[0];
      const latestPurchase = sorted[sorted.length - 1];
      const count = sorted.length;

      const firstPrice = firstPurchase?.effectiveUnitPrice || 0;
      const latestPrice = latestPurchase?.effectiveUnitPrice || 0;
      const priceDiff = latestPrice - firstPrice;
      const percentChange =
        firstPrice > 0 ? Math.round((priceDiff / firstPrice) * 100) : 0;

      const totalQuantity = sorted.reduce((sum, item) => sum + (item.effectiveQty || 1), 0);
      const totalSpentOnMaterial = sorted.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      // Best supplier (lowest unit price)
      const validPriceItems = sorted.filter((i) => i.effectiveUnitPrice > 0);
      const bestSupplierItem = validPriceItems.reduce(
        (best, curr) => (!best || curr.effectiveUnitPrice < best.effectiveUnitPrice ? curr : best),
        null
      );

      // AI Market evaluation for latest price
      const aiEval = evaluateMarketPrice(
        latestPurchase.title,
        latestPurchase.itemType,
        latestPrice
      );

      let trend = 'stable';
      if (percentChange >= 4) {
        trend = 'up';
        itemsWithHikesCount++;
        totalHikeAmount += Math.max(0, priceDiff * (latestPurchase.effectiveQty || 1));
      } else if (percentChange <= -4) {
        trend = 'down';
      }

      results.push({
        materialName,
        count,
        sortedHistory: sorted,
        firstPurchase,
        latestPurchase,
        firstPrice,
        latestPrice,
        priceDiff,
        percentChange,
        trend,
        totalQuantity,
        totalSpentOnMaterial,
        bestSupplier: bestSupplierItem?.supplierName || null,
        bestSupplierPrice: bestSupplierItem?.effectiveUnitPrice || 0,
        aiEval
      });
    });

    // Sort: items with multiple purchases first, then by highest price increase
    results.sort((a, b) => {
      if (a.count > 1 && b.count <= 1) return -1;
      if (b.count > 1 && a.count <= 1) return 1;
      return b.percentChange - a.percentChange;
    });

    return {
      materialItems: results,
      totalMaterials: results.length,
      repeatedMaterialsCount: results.filter((r) => r.count > 1).length,
      itemsWithHikesCount,
      totalHikeAmount
    };
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="p-8 text-center bg-bridal-surface rounded-3xl border border-bridal-border space-y-2">
        <TrendingUp className="w-10 h-10 text-bridal-rose mx-auto opacity-70" />
        <h4 className="text-base font-extrabold text-bridal-charcoal">
          لا توجد بيانات مصروفات كافية للتحليل
        </h4>
        <p className="text-xs text-bridal-mauve max-w-md mx-auto">
          عند إضافة فواتير تشطيب جديدة وبنود خامات (أسمنت، رمل، طوب، سلك...)، سيقوم النظام تلقائياً بتتبع تطور الأسعار ورصد أي زيادات بين الموردين.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-bridal-surface border border-bridal-border shadow-2xs">
          <span className="text-[11px] font-bold text-bridal-mauve block mb-1">
            إجمالي أنواع الخامات المسجلة
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-bridal-charcoal">
            {analysisData.totalMaterials} خامة
          </div>
          <span className="text-[10px] text-bridal-mauve mt-1 block">
            تم شراؤها عبر {expenses.length} فاتورة وبند
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-bridal-surface border border-bridal-border shadow-2xs">
          <span className="text-[11px] font-bold text-bridal-mauve block mb-1">
            خامات تم شراؤها أكثر من مرة
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-bridal-roseDark">
            {analysisData.repeatedMaterialsCount} خامة متكررة
          </div>
          <span className="text-[10px] text-bridal-mauve mt-1 block">
            مفيدة لمقارنة فروق أسعار السوق
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-bridal-surface border border-bridal-border shadow-2xs">
          <span className="text-[11px] font-bold text-bridal-mauve block mb-1">
            خامات ارتفع سعرها بعد أول شراء
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-red-600 flex items-center gap-1.5">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <span>{analysisData.itemsWithHikesCount} خامات</span>
          </div>
          <span className="text-[10px] text-red-600/80 mt-1 block">
            شهدت تضخماً أو اختلاف تسعير مورد
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-l from-bridal-roseLight/80 to-bridal-surface border border-bridal-rose/40 shadow-2xs">
          <span className="text-[11px] font-bold text-bridal-roseDark block mb-1">
            مستشار الذكاء الاصطناعي للسوق
          </span>
          <div className="text-sm font-extrabold text-bridal-charcoal flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-bridal-gold flex-shrink-0" />
            <span>متوسطات السوق المصري 2026</span>
          </div>
          <span className="text-[10px] text-bridal-mauve mt-1 block">
            يقيّم السعر الحالي هل هو عادل أو مرتفع
          </span>
        </div>
      </div>

      {/* 2. Detailed Material Price Progression Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-bridal-charcoal flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-bridal-rose" />
            <span>تحليل تطور أسعار الخامات ومقارنة الزيادة 📈</span>
          </h3>
          <span className="text-xs text-bridal-mauve font-bold">
            مرتبة حسب الخامات الأكثر تكراراً وتغيراً
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisData.materialItems.map((item, idx) => {
            const hasMultiple = item.count > 1;

            return (
              <motion.div
                key={item.materialName || idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="p-5 rounded-2xl bg-bridal-surface border border-bridal-border shadow-bridal flex flex-col justify-between gap-3 hover:border-bridal-rose/50 transition"
              >
                <div>
                  {/* Top Row: Material Name + Trend Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-bridal-cream text-bridal-charcoal border border-bridal-border">
                        {item.count > 1 ? `تم شراؤها ${item.count} مرات` : 'شراء لمرة واحدة'}
                      </span>
                      <h4 className="text-base font-extrabold text-bridal-charcoal mt-1">
                        {item.materialName}
                      </h4>
                      <p className="text-[11px] text-bridal-mauve mt-0.5">
                        آخر صنف: {item.latestPurchase.title}
                      </p>
                    </div>

                    {/* Price Hike / Reduction Badge */}
                    {hasMultiple ? (
                      item.trend === 'up' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">
                          <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                          <span>ارتفع +{item.percentChange}%</span>
                        </span>
                      ) : item.trend === 'down' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-extrabold">
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                          <span>وفّرت {item.percentChange}%</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-bridal-cream text-bridal-mauve border border-bridal-border text-xs font-bold">
                          <Minus className="w-3.5 h-3.5" />
                          <span>سعر مستقر</span>
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-bridal-cream text-bridal-mauve text-xs font-medium border border-bridal-border">
                        أول شراء
                      </span>
                    )}
                  </div>

                  {/* Price Comparison Blocks */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-bridal-cream/60 border border-bridal-border my-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-bridal-mauve block">
                        {hasMultiple ? 'سعر أول شراء (القديم)' : 'سعر الشراء'}
                      </span>
                      <div className="text-sm font-extrabold text-bridal-charcoal mt-0.5">
                        {item.firstPrice > 0 ? `${formatCurrency(item.firstPrice, 'ar')} ج.م` : '—'}
                      </div>
                      <span className="text-[9px] text-bridal-mauve">
                        {item.firstPurchase?.date || 'سابق'}
                      </span>
                    </div>

                    <div className="border-r border-bridal-border pr-2.5">
                      <span className="text-[10px] font-bold text-bridal-mauve block">
                        {hasMultiple ? 'سعر آخر شراء (الجديد)' : 'الإجمالي المدفوع'}
                      </span>
                      <div
                        className={`text-sm font-extrabold mt-0.5 ${
                          item.trend === 'up'
                            ? 'text-red-600'
                            : item.trend === 'down'
                            ? 'text-emerald-600'
                            : 'text-bridal-charcoal'
                        }`}
                      >
                        {item.latestPrice > 0
                          ? `${formatCurrency(item.latestPrice, 'ar')} ج.م`
                          : `${formatCurrency(item.totalSpentOnMaterial, 'ar')} ج.م`}
                      </div>
                      <span className="text-[9px] text-bridal-mauve">
                        {item.latestPurchase?.date || 'حديث'}
                      </span>
                    </div>
                  </div>

                  {/* Price Diff Note */}
                  {hasMultiple && item.priceDiff !== 0 && (
                    <div className="text-xs font-bold mb-2 flex items-center justify-between text-bridal-charcoal">
                      <span className="text-bridal-mauve text-[11px]">فرق سعر الوحدة:</span>
                      <span
                        className={
                          item.priceDiff > 0 ? 'text-red-600 font-extrabold' : 'text-emerald-600 font-extrabold'
                        }
                      >
                        {item.priceDiff > 0 ? `+${item.priceDiff} ج.م للوحدة` : `${item.priceDiff} ج.م توفير`}
                      </span>
                    </div>
                  )}

                  {/* Best Supplier Hint */}
                  {item.bestSupplier && (
                    <div className="text-[11px] text-bridal-mauve flex items-center gap-1.5 pt-1">
                      <Building2 className="w-3.5 h-3.5 text-bridal-rose flex-shrink-0" />
                      <span>
                        أرخص سعر حصلت عليه كان من: <strong>{item.bestSupplier}</strong> (
                        {formatCurrency(item.bestSupplierPrice, 'ar')} ج.م)
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Market Advice for this material */}
                <div
                  className={`p-2.5 rounded-xl border text-xs ${
                    item.aiEval?.status === 'good'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : item.aiEval?.status === 'high' || item.aiEval?.status === 'alert_high'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-bridal-cream/80 border-bridal-border text-bridal-charcoal'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-extrabold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-bridal-gold flex-shrink-0" />
                    <span>تقييم الذكاء الاصطناعي: {item.aiEval?.badgeText || 'متوسط السوق'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {item.aiEval?.tipText || 'قارن بين عروض أسعار الموردين للحصول على أفضل سعر خامات.'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
