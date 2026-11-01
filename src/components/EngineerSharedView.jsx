import React, { useState } from 'react';
import {
  Wrench,
  Wallet,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ArrowRight,
  Calendar,
  MessageCircle
} from 'lucide-react';
import { formatCurrency } from '../db';
import ImageLightbox from './ImageLightbox';

export default function EngineerSharedView({
  ledgerData,
  onExitPreview
}) {
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
    title: ''
  });

  if (!ledgerData) return null;

  const advances = Array.isArray(ledgerData.advances) ? ledgerData.advances : [];
  const expenses = Array.isArray(ledgerData.expenses) ? ledgerData.expenses : [];
  const supervisionFeePercent = Number(ledgerData.supervisionFeePercent) || 0;

  const totalAdvances = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const supervisionFeeAmount =
    supervisionFeePercent > 0 ? Math.round((totalExpenses * supervisionFeePercent) / 100) : 0;
  const totalSpentWithFee = totalExpenses + supervisionFeeAmount;
  const netBalance = totalAdvances - totalSpentWithFee;

  const handleConfirmWhatsApp = () => {
    const statusText =
      netBalance >= 0
        ? `الرصيد المتبقي في العهدة: ${formatCurrency(netBalance, 'ar')} ج.م`
        : `المبلغ المستحق للمهندس: ${formatCurrency(Math.abs(netBalance), 'ar')} ج.م`;
    const msg = `👷‍♂️ تم مراجعة كشف حساب عهدة ومصروفات (${
      ledgerData.apartmentTitle || 'تشطيب الشقة'
    }):\n• إجمالي الدفعات المستلمة: ${formatCurrency(
      totalAdvances,
      'ar'
    )} ج.م\n• إجمالي الفواتير والمصروفات: ${formatCurrency(
      totalSpentWithFee,
      'ar'
    )} ج.م\n• ${statusText}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-bridal-bg pb-12">
      {/* Top Sticky Bar */}
      <div className="no-print sticky top-0 z-30 bg-bridal-surface/95 backdrop-blur-md border-b border-bridal-border px-4 py-3.5 shadow-bridal">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onExitPreview && (
              <button
                type="button"
                onClick={onExitPreview}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-cream hover:bg-bridal-roseLight text-bridal-charcoal text-xs font-extrabold border border-bridal-border transition"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للتطبيق</span>
              </button>
            )}
            <div>
              <h1 className="text-sm sm:text-lg font-extrabold text-bridal-charcoal">
                👷‍♂️ كشف حساب عهدة ومصروفات التشطيب — م-شوارنا
              </h1>
              <p className="text-[11px] text-bridal-mauve">
                {ledgerData.apartmentTitle || 'تشطيب شقة الزوجية'} •{' '}
                {ledgerData.engineerName
                  ? `المهندس المشرف: م. ${ledgerData.engineerName}`
                  : 'نسخة مشاركة للمراجعة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bridal-sage text-white text-xs font-extrabold shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تأكيد الحساب عبر واتساب 💬</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bridal-rose text-white text-xs font-extrabold shadow-bridal"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الحساب PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Sheet */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header Card */}
        <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-6 shadow-bridal">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bridal-border pb-4 mb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bridal-roseLight text-bridal-roseDark text-xs font-extrabold mb-2">
                <Wrench className="w-3.5 h-3.5" />
                <span>كشف حساب عهدة ومصروفات تشطيب معتمد</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-bridal-charcoal">
                {ledgerData.apartmentTitle || 'تشطيب شقة الزوجية'}
              </h2>
              <p className="text-xs sm:text-sm text-bridal-mauve mt-1">
                المالك: <strong>{ledgerData.ownerName || 'صاحب الشقة'}</strong> | المهندس المشرف:{' '}
                <strong>{ledgerData.engineerName || 'المهندس المشرف'}</strong>
              </p>
            </div>
            <div className="text-xs text-bridal-mauve bg-bridal-cream p-3 rounded-2xl border border-bridal-border">
              <div>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</div>
              {supervisionFeePercent > 0 && (
                <div className="font-bold text-bridal-charcoal mt-1">
                  نسبة الإشراف المتفق عليها: {supervisionFeePercent}%
                </div>
              )}
            </div>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-bridal-cream/60 border border-bridal-border">
              <span className="text-xs font-bold text-bridal-mauve">
                إجمالي الدفعات المستلمة (العُهدة)
              </span>
              <div className="text-xl font-extrabold text-bridal-charcoal mt-1">
                {formatCurrency(totalAdvances, 'ar')} ج.م
              </div>
              <div className="text-[11px] text-bridal-mauve mt-1">
                عدد الدفعات: {advances.length} دفعة
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-bridal-cream/60 border border-bridal-border">
              <span className="text-xs font-bold text-bridal-mauve">
                إجمالي المصروفات والفواتير
              </span>
              <div className="text-xl font-extrabold text-bridal-roseDark mt-1">
                {formatCurrency(totalSpentWithFee, 'ar')} ج.م
              </div>
              <div className="text-[11px] text-bridal-mauve mt-1">
                عدد البنود والفواتير: {expenses.length} بند
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                netBalance >= 0
                  ? 'bg-bridal-sageLight/40 border-bridal-sage'
                  : 'bg-red-500/10 border-red-400/50'
              }`}
            >
              <span className="text-xs font-extrabold text-bridal-charcoal">
                {netBalance >= 0
                  ? 'الرصيد المتبقي في عهدة المهندس'
                  : 'الرصيد المستحق للمهندس'}
              </span>
              <div
                className={`text-xl font-extrabold mt-1 ${
                  netBalance >= 0 ? 'text-bridal-sageDark' : 'text-red-600'
                }`}
              >
                {formatCurrency(Math.abs(netBalance), 'ar')} ج.م
              </div>
              <div className="text-[11px] font-bold mt-1">
                {netBalance >= 0
                  ? 'رصيد متبقٍ تحت حساب التشطيب'
                  : 'صرف بالزيادة عن إجمالي العهدة'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Advances Table */}
        <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 sm:p-6 shadow-bridal space-y-3">
          <h3 className="text-base font-extrabold text-bridal-charcoal flex items-center gap-2">
            <Wallet className="w-5 h-5 text-bridal-sage" />
            <span>أولاً: بيان الدفعات المسلمة للمهندس كعُهدة ({advances.length})</span>
          </h3>

          {advances.length === 0 ? (
            <p className="text-xs text-bridal-mauve py-3">لا توجد دفعات مسجلة.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse border border-bridal-border text-xs sm:text-sm">
                <thead>
                  <tr className="bg-bridal-cream text-bridal-charcoal">
                    <th className="border border-bridal-border px-3 py-2 w-12 text-center">#</th>
                    <th className="border border-bridal-border px-3 py-2">بيان الدفعة</th>
                    <th className="border border-bridal-border px-3 py-2">طريقة الدفع</th>
                    <th className="border border-bridal-border px-3 py-2">التاريخ</th>
                    <th className="border border-bridal-border px-3 py-2">المبلغ</th>
                    <th className="border border-bridal-border px-3 py-2 no-print">الإيصال</th>
                  </tr>
                </thead>
                <tbody>
                  {advances.map((adv, i) => (
                    <tr key={adv.id || i} className="border-b border-bridal-border">
                      <td className="border border-bridal-border px-3 py-2 text-center font-bold">
                        {i + 1}
                      </td>
                      <td className="border border-bridal-border px-3 py-2 font-bold">
                        {adv.title}
                        {adv.notes && (
                          <div className="text-[11px] text-bridal-mauve font-normal">
                            {adv.notes}
                          </div>
                        )}
                      </td>
                      <td className="border border-bridal-border px-3 py-2">
                        {adv.paymentMethod}
                      </td>
                      <td className="border border-bridal-border px-3 py-2">{adv.date}</td>
                      <td className="border border-bridal-border px-3 py-2 font-extrabold text-bridal-sageDark">
                        {formatCurrency(adv.amount, 'ar')} ج.م
                      </td>
                      <td className="border border-bridal-border px-3 py-2 no-print">
                        {adv.receiptImages?.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setLightbox({
                                isOpen: true,
                                images: adv.receiptImages,
                                currentIndex: 0,
                                title: adv.title
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-bridal-roseLight text-bridal-roseDark text-xs font-bold"
                          >
                            عرض الإيصال ({adv.receiptImages.length})
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Expenses & Invoices Table */}
        <div className="bg-bridal-surface rounded-3xl border border-bridal-border p-5 sm:p-6 shadow-bridal space-y-3">
          <h3 className="text-base font-extrabold text-bridal-charcoal flex items-center gap-2">
            <Receipt className="w-5 h-5 text-bridal-rose" />
            <span>ثانياً: بيان بنود ومصروفات التشطيب والفواتير ({expenses.length})</span>
          </h3>

          {expenses.length === 0 ? (
            <p className="text-xs text-bridal-mauve py-3">لا توجد مصروفات مسجلة.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse border border-bridal-border text-xs sm:text-sm">
                <thead>
                  <tr className="bg-bridal-cream text-bridal-charcoal">
                    <th className="border border-bridal-border px-3 py-2 w-12 text-center">#</th>
                    <th className="border border-bridal-border px-3 py-2">البند</th>
                    <th className="border border-bridal-border px-3 py-2">التفاصيل والكمية</th>
                    <th className="border border-bridal-border px-3 py-2">المورد / الصنايعي</th>
                    <th className="border border-bridal-border px-3 py-2">التاريخ</th>
                    <th className="border border-bridal-border px-3 py-2">المبلغ</th>
                    <th className="border border-bridal-border px-3 py-2 no-print">الفاتورة</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((ex, i) => (
                    <tr key={ex.id || i} className="border-b border-bridal-border">
                      <td className="border border-bridal-border px-3 py-2 text-center font-bold">
                        {i + 1}
                      </td>
                      <td className="border border-bridal-border px-3 py-2 font-extrabold text-bridal-roseDark">
                        {ex.itemType}
                      </td>
                      <td className="border border-bridal-border px-3 py-2 font-bold">
                        <div>{ex.title}</div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-bridal-mauve mt-0.5">
                          {ex.quantityText && <span>الكمية: {ex.quantityText}</span>}
                          {Number(ex.unitPrice) > 0 && (
                            <span>• سعر المفرد: {formatCurrency(ex.unitPrice, 'ar')} ج.م</span>
                          )}
                        </div>
                      </td>
                      <td className="border border-bridal-border px-3 py-2">
                        {ex.supplierName || '—'}
                      </td>
                      <td className="border border-bridal-border px-3 py-2">{ex.date}</td>
                      <td className="border border-bridal-border px-3 py-2 font-extrabold text-bridal-charcoal">
                        {formatCurrency(ex.amount, 'ar')} ج.م
                      </td>
                      <td className="border border-bridal-border px-3 py-2 no-print">
                        {ex.invoiceImages?.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setLightbox({
                                isOpen: true,
                                images: ex.invoiceImages,
                                currentIndex: 0,
                                title: ex.title
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-bridal-goldLight text-bridal-gold text-xs font-bold"
                          >
                            عرض الفاتورة ({ex.invoiceImages.length}) 📸
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ImageLightbox
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        currentIndex={lightbox.currentIndex}
        title={lightbox.title}
        onClose={() => setLightbox((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
