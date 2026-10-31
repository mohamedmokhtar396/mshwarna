import React, { useState } from 'react';
import {
  Printer,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { formatCurrency } from '../db';
import {
  translations,
  getLocalizedCategory,
  getLocalizedItem
} from '../i18n';

export default function PrintReport({
  lang = 'en',
  categories,
  items,
  settings,
  onClose
}) {
  const t = translations[lang] || translations.en;
  const isRtl = lang === 'ar';

  const hasPurchased = items.some((i) => i.isPurchased);
  const [printMode, setPrintMode] = useState(hasPurchased ? 'purchased' : 'all'); // 'purchased' | 'all'
  const [showPrices, setShowPrices] = useState(true);

  const filteredItems =
    printMode === 'purchased' ? items.filter((i) => i.isPurchased) : items;

  const totalCost = filteredItems.reduce(
    (sum, i) =>
      sum +
      (Number(i.actualPrice) > 0
        ? Number(i.actualPrice)
        : Number(i.estimatedPrice) || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  const displayBrideName =
    !settings?.brideName ||
    settings.brideName === 'Lovely Bride' ||
    settings.brideName === 'أحلى عروسة'
      ? t.defaultBrideName
      : settings.brideName;

  return (
    <div className="min-h-screen bg-bridal-bg pb-12">
      {/* Screen-Only Control Bar (Hidden during print) */}
      <div className="no-print sticky top-0 z-30 bg-bridal-surface/95 backdrop-blur-md border-b border-bridal-border px-4 py-3.5 shadow-bridal mb-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridal-cream hover:bg-bridal-roseLight text-bridal-charcoal text-xs sm:text-sm font-bold border border-bridal-border transition"
            >
              {isRtl ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              <span>{t.backToAppBtn}</span>
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-bridal-charcoal">
                {t.printPreviewTitle}
              </h2>
              <p className="text-[11px] text-bridal-mauve">
                {t.printPreviewSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switcher: Purchased Only vs All Items */}
            <div className="inline-flex rounded-xl bg-bridal-cream p-1 border border-bridal-border text-xs">
              <button
                type="button"
                onClick={() => setPrintMode('purchased')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition ${
                  printMode === 'purchased'
                    ? 'bg-bridal-surface text-bridal-sageDark shadow-2xs'
                    : 'text-bridal-mauve'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.purchasedOnlyTab(items.filter((i) => i.isPurchased).length)}</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('all')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition ${
                  printMode === 'all'
                    ? 'bg-bridal-surface text-bridal-rose shadow-2xs'
                    : 'text-bridal-mauve'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t.allItemsTab(items.length)}</span>
              </button>
            </div>

            {/* Toggle Prices */}
            <button
              type="button"
              onClick={() => setShowPrices(!showPrices)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                showPrices
                  ? 'bg-bridal-roseLight/60 text-bridal-roseDark border-bridal-rose/40'
                  : 'bg-bridal-surface text-bridal-mauve border-bridal-border'
              }`}
            >
              {showPrices ? t.hidePricesBtn : t.showPricesBtn}
            </button>

            {/* Print Action Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-bridal-rose to-bridal-blush text-white text-xs sm:text-sm font-bold shadow-bridal hover:opacity-95 transition"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printPdfBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Document Sheet */}
      <div className="max-w-5xl mx-auto bg-bridal-surface print:bg-white rounded-3xl print:rounded-none border border-bridal-border print:border-none shadow-bridal print:shadow-none p-6 sm:p-10 print:p-2">
        {/* Document Header */}
        <div className="border-b-2 border-bridal-rose pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-bridal-charcoal print:text-black">
              {t.reportMainHeading}
            </h1>
            <p className="text-sm text-bridal-mauve print:text-gray-700 mt-1 font-medium">
              {t.brideLabel}{' '}
              <span className="font-bold text-bridal-charcoal print:text-black">
                {displayBrideName}
              </span>
              {settings?.weddingDate && (
                <span className="mx-3">
                  | {t.weddingDatePrintLabel}{' '}
                  <span className="font-bold">{settings.weddingDate}</span>
                </span>
              )}
            </p>
          </div>

          <div className="text-xs sm:text-sm bg-bridal-cream print:bg-transparent p-3.5 rounded-2xl border border-bridal-border space-y-1">
            <div>
              <span className="text-bridal-mauve">{t.reportDateLabel} </span>
              <span className="font-bold text-bridal-charcoal print:text-black">
                {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div>
              <span className="text-bridal-mauve">{t.totalItemsInReportLabel} </span>
              <span className="font-bold text-bridal-charcoal print:text-black">
                {filteredItems.length}
              </span>
            </div>
            {showPrices && (
              <div>
                <span className="text-bridal-mauve">{t.totalReportCostLabel} </span>
                <span className="font-extrabold text-bridal-roseDark">
                  {formatCurrency(totalCost, lang)} {t.currency}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Empty State if Purchased Only selected and 0 purchased */}
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-base font-bold text-bridal-charcoal">
              {t.noPurchasedYetMsg}
            </p>
            <button
              type="button"
              onClick={() => setPrintMode('all')}
              className="no-print px-4 py-2 rounded-xl bg-bridal-rose text-white text-xs font-bold"
            >
              {t.showAllForPrintBtn(items.length)}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat, catIndex) => {
              const locCat = getLocalizedCategory(cat, lang);
              const catItems = filteredItems.filter((i) => i.categoryId === cat.id);
              if (catItems.length === 0) return null;

              const catSubtotal = catItems.reduce(
                (sum, i) =>
                  sum +
                  (Number(i.actualPrice) > 0
                    ? Number(i.actualPrice)
                    : Number(i.estimatedPrice) || 0),
                0
              );

              return (
                <div key={cat.id} className="break-inside-avoid space-y-2.5">
                  <div className="flex items-center justify-between bg-bridal-roseLight/70 px-4 py-2.5 rounded-xl border border-bridal-border">
                    <h3 className="text-base font-extrabold text-bridal-charcoal print:text-black">
                      {catIndex + 1}. {locCat.displayName} ({catItems.length})
                    </h3>
                    {showPrices && (
                      <span className="text-xs sm:text-sm font-extrabold text-bridal-roseDark">
                        {formatCurrency(catSubtotal, lang)} {t.currency}
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table
                      className={`w-full ${
                        isRtl ? 'text-right' : 'text-left'
                      } border-collapse border border-bridal-border text-xs sm:text-sm`}
                    >
                      <thead>
                        <tr className="bg-bridal-cream text-bridal-charcoal print:text-black">
                          <th className="border border-bridal-border px-3 py-2 w-10 text-center">
                            {t.tableColNum}
                          </th>
                          <th className="border border-bridal-border px-3 py-2">
                            {t.tableColItem}
                          </th>
                          <th className="border border-bridal-border px-3 py-2 w-32 text-center">
                            {t.tableColSubcat}
                          </th>
                          <th className="border border-bridal-border px-3 py-2 w-24 text-center">
                            {t.tableColQty}
                          </th>
                          <th className="border border-bridal-border px-3 py-2">
                            {t.tableColNotes}
                          </th>
                          {showPrices && (
                            <th className="border border-bridal-border px-3 py-2 w-32 text-center">
                              {t.tableColPrice}
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {catItems.map((item, idx) => {
                          const locItem = getLocalizedItem(item, lang);
                          const priceToShow =
                            Number(item.actualPrice) > 0
                              ? Number(item.actualPrice)
                              : Number(item.estimatedPrice) || 0;
                          const qtyToShow =
                            printMode === 'purchased' && item.purchasedQty > 0
                              ? item.purchasedQty
                              : `${item.purchasedQty || 0} / ${item.requiredQty || 1}`;

                          return (
                            <tr
                              key={item.id}
                              className="odd:bg-bridal-surface even:bg-bridal-bg/60 print:odd:bg-white print:even:bg-gray-50"
                            >
                              <td className="border border-bridal-border px-3 py-2 text-center font-bold text-bridal-mauve">
                                {idx + 1}
                              </td>
                              <td className="border border-bridal-border px-3 py-2 font-bold text-bridal-charcoal print:text-black">
                                {locItem.displayName}
                                {item.isPurchased && printMode === 'all' && (
                                  <span className="mx-1.5 text-[10px] text-bridal-sageDark font-extrabold">
                                    ({t.purchasedBadge})
                                  </span>
                                )}
                              </td>
                              <td className="border border-bridal-border px-3 py-2 text-center text-bridal-mauve">
                                {locItem.displaySubcategory || '-'}
                              </td>
                              <td className="border border-bridal-border px-3 py-2 text-center font-bold text-bridal-charcoal print:text-black">
                                {qtyToShow}
                              </td>
                              <td className="border border-bridal-border px-3 py-2 text-bridal-mauve">
                                {locItem.displayNotes || '-'}
                              </td>
                              {showPrices && (
                                <td className="border border-bridal-border px-3 py-2 text-center font-bold text-bridal-charcoal print:text-black">
                                  {priceToShow > 0
                                    ? `${formatCurrency(priceToShow, lang)} ${t.currency}`
                                    : '-'}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Final Grand Total Footer */}
            {showPrices && (
              <div className="mt-8 p-5 rounded-2xl bg-bridal-cream border-2 border-bridal-rose flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-base sm:text-lg font-extrabold text-bridal-charcoal print:text-black">
                  {t.grandTotalFooter(filteredItems.length)}
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-bridal-roseDark">
                  {formatCurrency(totalCost, lang)} {t.currency}
                </div>
              </div>
            )}

            {/* Signature / Notes Footer for Print */}
            <div className="pt-8 mt-8 border-t border-bridal-border grid grid-cols-2 gap-8 text-xs sm:text-sm text-bridal-mauve">
              <div>
                <p className="font-bold text-bridal-charcoal print:text-black mb-6">
                  {t.additionalNotesPrint}
                </p>
                <div className="border-b border-dashed border-bridal-border h-6"></div>
              </div>
              <div className={isRtl ? 'text-left' : 'text-right'}>
                <p className="font-bold text-bridal-charcoal print:text-black mb-6">
                  {t.signaturePrint}
                </p>
                <div className="border-b border-dashed border-bridal-border h-6 w-48 inline-block"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
