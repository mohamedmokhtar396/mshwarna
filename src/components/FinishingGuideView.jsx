import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ListChecks,
  Check,
  Search,
  BookOpen
} from 'lucide-react';
import { FINISHING_STAGES_GUIDE } from '../utils/finishingBenchmarks';

export default function FinishingGuideView({
  settings,
  onUpdateSettings
}) {
  const [openStageId, setOpenStageId] = useState('demolition-prep');
  const [searchQuery, setSearchQuery] = useState('');

  // Checklist state stored in settings or local
  const checkedChecklist = settings?.finishingChecklistState || {};

  const handleToggleCheck = async (stageId, itemIndex) => {
    const key = `${stageId}_${itemIndex}`;
    const nextState = {
      ...checkedChecklist,
      [key]: !checkedChecklist[key]
    };
    if (onUpdateSettings) {
      await onUpdateSettings({ finishingChecklistState: nextState });
    }
  };

  const filteredStages = FINISHING_STAGES_GUIDE.filter((stage) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      stage.title.toLowerCase().includes(q) ||
      stage.shortDesc.toLowerCase().includes(q) ||
      stage.essentialTips.some((t) => t.toLowerCase().includes(q)) ||
      stage.contractorTraps.some((t) => t.toLowerCase().includes(q))
    );
  });

  // Calculate overall checklist progress
  let totalChecklistItems = 0;
  let completedChecklistItems = 0;
  FINISHING_STAGES_GUIDE.forEach((stage) => {
    stage.inspectionChecklist.forEach((_, idx) => {
      totalChecklistItems++;
      if (checkedChecklist[`${stage.id}_${idx}`]) {
        completedChecklistItems++;
      }
    });
  });

  const progressPercent =
    totalChecklistItems > 0
      ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Hero Guide Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-l from-bridal-roseLight/70 via-bridal-surface to-bridal-cream border border-bridal-border shadow-bridal">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-bridal-rose text-white flex items-center justify-center p-3 shadow-bridal flex-shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bridal-roseLight text-bridal-roseDark text-xs font-extrabold mb-1.5">
                <span>دليل تشطيب شقة العمر خطوة بخطوة 📐</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-bridal-charcoal">
                دليل المبتدئين الشامل وتفادي غش المقاولين والصنايعية
              </h2>
              <p className="text-xs sm:text-sm text-bridal-mauve mt-1 max-w-2xl">
                إذا كنت لا تفهم في بنود التشطيب ومصطلحات المون، هذا الدليل أعده خبراء ومهندسون مصريون ليرافقك من أول تكسير وتعديل وحتى المفتاح، مع كشف ألاعيب السوق وكيفية استلام كل مرحلة بدون أن يتم خداعك.
              </p>
            </div>
          </div>

          {/* Progress Badge */}
          <div className="p-4 rounded-2xl bg-bridal-surface border border-bridal-border text-center flex-shrink-0 min-w-[170px] shadow-2xs">
            <span className="text-[11px] font-bold text-bridal-mauve block mb-1">
              إنجاز استلام مراحل الشقة
            </span>
            <div className="text-2xl font-black text-bridal-roseDark">
              {progressPercent}%
            </div>
            <span className="text-[10px] text-bridal-charcoal font-bold mt-1 block">
              {completedChecklistItems} من أصل {totalChecklistItems} بند استلام
            </span>
          </div>
        </div>
      </div>

      {/* Search Input for Guide */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-bridal-surface border border-bridal-border shadow-2xs">
        <Search className="w-4 h-4 text-bridal-mauve flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في نصائح التشطيب (سباكة، محارة، سلك السويدي، عزل، كناوف، سيراميك...)"
          className="w-full bg-transparent text-xs sm:text-sm font-bold text-bridal-charcoal outline-none placeholder:text-bridal-mauve/70"
        />
      </div>

      {/* 10 Stages Accordion List */}
      <div className="space-y-3.5">
        {filteredStages.map((stage) => {
          const isOpen = openStageId === stage.id;
          const stageChecksCount = stage.inspectionChecklist.length;
          const stageCompletedChecks = stage.inspectionChecklist.filter(
            (_, i) => checkedChecklist[`${stage.id}_${i}`]
          ).length;
          const isStageFinished =
            stageChecksCount > 0 && stageCompletedChecks === stageChecksCount;

          return (
            <div
              key={stage.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-bridal-surface border-bridal-rose/50 shadow-bridal'
                  : 'bg-bridal-surface/90 border-bridal-border hover:border-bridal-rose/30 shadow-2xs'
              }`}
            >
              {/* Stage Header Button */}
              <button
                type="button"
                onClick={() => setOpenStageId(isOpen ? null : stage.id)}
                className="w-full text-right p-4 sm:p-5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      isStageFinished
                        ? 'bg-bridal-sage text-white'
                        : isOpen
                        ? 'bg-bridal-rose text-white'
                        : 'bg-bridal-cream text-bridal-charcoal border border-bridal-border'
                    }`}
                  >
                    {isStageFinished ? '✓' : stage.stageNumber}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-extrabold text-bridal-charcoal">
                        {stage.title}
                      </h3>
                      {stage.estimatedDuration && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-bridal-cream text-bridal-mauve border border-bridal-border">
                          <Clock className="w-3 h-3 text-bridal-rose" />
                          <span>{stage.estimatedDuration}</span>
                        </span>
                      )}
                      {stageCompletedChecks > 0 && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-bridal-sageLight text-bridal-sageDark border border-bridal-sage/30">
                          استلمت {stageCompletedChecks}/{stageChecksCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-bridal-mauve mt-1 line-clamp-1">
                      {stage.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="p-1 rounded-xl text-bridal-mauve hover:text-bridal-charcoal">
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-bridal-rose" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>

              {/* Stage Content Details */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-bridal-border p-4 sm:p-6 space-y-5 bg-bridal-cream/30"
                  >
                    {/* 1. Essential Golden Tips */}
                    <div className="space-y-2.5">
                      <h4 className="text-sm font-extrabold text-bridal-charcoal flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-bridal-gold flex-shrink-0" />
                        <span>نصائح وخطوات ذهبية للمرحلة:</span>
                      </h4>
                      <div className="space-y-2">
                        {stage.essentialTips.map((tip, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-bridal-surface border border-bridal-border text-xs sm:text-sm text-bridal-charcoal leading-relaxed flex items-start gap-2.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-bridal-goldLight text-bridal-gold flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Contractor Traps to Avoid */}
                    {stage.contractorTraps?.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-sm font-extrabold text-red-600 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span>احذر أشهر حيل وغش الصنايعية في هذه المرحلة:</span>
                        </h4>
                        <div className="space-y-2">
                          {stage.contractorTraps.map((trap, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-red-50/70 border border-red-200/80 text-xs sm:text-sm text-red-900 leading-relaxed flex items-start gap-2.5"
                            >
                              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <span>{trap}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Interactive Inspection Checklist */}
                    {stage.inspectionChecklist?.length > 0 && (
                      <div className="space-y-2.5 pt-2 border-t border-bridal-border/70">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-bridal-sageDark flex items-center gap-2">
                            <ListChecks className="w-4 h-4 text-bridal-sage flex-shrink-0" />
                            <span>قائمة استلام المرحلة (علّم عليها قبل دفع باقي الحساب):</span>
                          </h4>
                          <span className="text-[11px] font-bold text-bridal-mauve">
                            {stageCompletedChecks} من {stageChecksCount} مستلم
                          </span>
                        </div>

                        <div className="space-y-2">
                          {stage.inspectionChecklist.map((checkItem, idx) => {
                            const isChecked = Boolean(
                              checkedChecklist[`${stage.id}_${idx}`]
                            );
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleToggleCheck(stage.id, idx)}
                                className={`w-full text-right p-3 rounded-xl border flex items-center justify-between gap-3 transition text-xs sm:text-sm ${
                                  isChecked
                                    ? 'bg-bridal-sageLight text-bridal-sageDark border-bridal-sage/40 font-bold'
                                    : 'bg-bridal-surface text-bridal-charcoal border-bridal-border hover:border-bridal-sage/50'
                                }`}
                              >
                                <span className={isChecked ? 'line-through opacity-85' : ''}>
                                  {checkItem}
                                </span>
                                <div
                                  className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                                    isChecked
                                      ? 'bg-bridal-sage border-bridal-sage text-white'
                                      : 'border-bridal-border bg-bridal-cream'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
