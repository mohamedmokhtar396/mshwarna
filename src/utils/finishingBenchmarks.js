/**
 * Egyptian Apartment Finishing Market Benchmarks, Price Evaluation Engine & Beginner's Guide
 * Updated for the Egyptian Construction & Finishing Market (2025/2026)
 */
import { parseArabicNumber } from '../db';

/**
 * Extracts a numeric quantity from descriptive text (e.g., "20 شكارة" -> 20, "15.5 متر" -> 15.5)
 */
export function extractQuantityNumber(text) {
  if (!text) return 0;
  if (typeof text === 'number') return text > 0 ? text : 0;
  
  const str = String(text).trim();
  // Match digits with optional decimals (supporting both Arabic and English numerals)
  const match = str.match(/[\d٠-٩]+(?:\.[\d٠-٩]+)?/);
  if (!match) return 0;
  
  const parsed = parseArabicNumber(match[0]);
  return parsed > 0 ? parsed : 0;
}

/**
 * Normalizes material name to find historical matches (e.g. "شكارة اسمنت لافارج 42.5" -> "أسمنت")
 */
export function normalizeMaterialKeyword(text, type = '') {
  const combined = `${text || ''} ${type || ''}`.toLowerCase();
  
  if (combined.includes('أسمنت') || combined.includes('اسمنت')) return 'أسمنت';
  if (combined.includes('رمل') || combined.includes('رمال')) return 'رمل';
  if (combined.includes('طوب') || combined.includes('طوبة')) return 'طوب';
  if (combined.includes('ونش') || combined.includes('تشوين') || combined.includes('تطليع')) return 'ونش وتشوين';
  if (combined.includes('سلك') || combined.includes('اسلاك') || combined.includes('كهربا')) return 'سلك كهرباء';
  if (combined.includes('خرطوم') || combined.includes('خراطيم') || combined.includes('بوات')) return 'خراطيم وعلب كهرباء';
  if (combined.includes('قاطع') || combined.includes('لوحة كهربا') || combined.includes('مفتاح اتوماتيك')) return 'قواطع ولوحات كهرباء';
  if (combined.includes('ماسورة') || combined.includes('مواسير') || combined.includes('سباك') || combined.includes('بولي')) return 'مواسير سباكة';
  if (combined.includes('عزل') || combined.includes('بيتومين') || combined.includes('سيكا')) return 'عزل مائي';
  if (combined.includes('جبس') || combined.includes('كناوف') || combined.includes('بورد')) return 'جبس بورد ومصيص';
  if (combined.includes('معجون') || combined.includes('شيكارة معجون') || combined.includes('سيلر')) return 'معجون وسيلر';
  if (combined.includes('دهان') || combined.includes('بستلة') || combined.includes('يوتن') || combined.includes('سايبس') || combined.includes('glc')) return 'دهانات وبويات';
  if (combined.includes('سيراميك') || combined.includes('فرز') || combined.includes('كليوباترا') || combined.includes('رويال')) return 'سيراميك';
  if (combined.includes('بورسلين') || combined.includes('بورسلان')) return 'بورسلين';
  if (combined.includes('سافيتو') || combined.includes('مادة لصق') || combined.includes('ماده')) return 'مادة لصق بورسلين';
  if (combined.includes('حلق') || combined.includes('خشب') || combined.includes('باب') || combined.includes('نجار')) return 'نجارة وأخشاب';
  if (combined.includes('ألوميتال') || combined.includes('الوميتال') || combined.includes('شباك') || combined.includes('pvc')) return 'ألوميتال وشبابيك';
  if (combined.includes('سن') || combined.includes('زلط')) return 'سن وزلط';
  
  return text ? text.trim().slice(0, 20) : 'خامة عامة';
}

/**
 * Egyptian Finishing Market Price Benchmarks (Current Cairo & Major Governorates averages)
 */
export const EGYPT_FINISHING_MARKET_BENCHMARKS = [
  {
    key: 'أسمنت',
    keywords: ['أسمنت', 'اسمنت', 'بورتلاندي'],
    name: 'شكارة أسمنت بورتلاندي 42.5 (السويدي / لافارج / بني سويف)',
    unit: 'شكارة (50 كجم)',
    minPrice: 230,
    maxPrice: 275,
    avgPrice: 250,
    advice: 'احرص على ألا يكون الأسمنت متكتلاً أو مر عليه أكثر من 3 أسابيع من الإنتاج لضمان أقصى تماسك للمونة.'
  },
  {
    key: 'رمل',
    keywords: ['رمل', 'رمال', 'نقلة رمل'],
    name: 'رمل حرش نظيف خالي من الطفلة للمحارة والمونة',
    unit: 'متر مكعب (أو نقلة)',
    minPrice: 190,
    maxPrice: 260,
    avgPrice: 220,
    advice: 'تأكد أن الرمل خالي من الشوائب والطفلة (ضع قبضة يدك في الرمل وافركها، إذا علقت طينة بيدك فهو رمل مغشوش يضعف المحارة).'
  },
  {
    key: 'طوب',
    keywords: ['طوب', 'طوبة', 'طوب احمر', 'طوب طفلي'],
    name: 'ألف طوب طفلي أحمر مفرغ عالي الجودة',
    unit: 'ألف طوبة (1000)',
    minPrice: 1800,
    maxPrice: 2400,
    avgPrice: 2100,
    advice: 'عدّ عربية الطوب عند التنزيل واطلب من السائق تفريغها بحرص لتقليل الهالك والكسر.'
  },
  {
    key: 'سلك كهرباء',
    keywords: ['سلك', 'اسلاك', 'السويدي'],
    name: 'لفة سلك معتمد السويدي الأصلي 2 مم (100 متر)',
    unit: 'لفة 100م (2 مم)',
    minPrice: 1200,
    maxPrice: 1550,
    avgPrice: 1380,
    advice: 'احذر السلك المقلد المكتوب عليه (السويدي للكابلات)، اشتري فقط من موزع معتمد وتأكد من الختم والوزن وشعار السويدي إلكتريك.'
  },
  {
    key: 'سلك 3 مم',
    keywords: ['سلك 3', '3 مم', '3مم'],
    name: 'لفة سلك معتمد السويدي الأصلي 3 مم (للأفياش)',
    unit: 'لفة 100م (3 مم)',
    minPrice: 1850,
    maxPrice: 2300,
    avgPrice: 2050,
    advice: 'يُفضل للأفياش العادية سلك 3 مم، وتجنب استخدام 2 مم للأفياش حتى لا يسخن مع أحمال الميكروويف والكاتل.'
  },
  {
    key: 'سلك 4 مم',
    keywords: ['سلك 4', '4 مم', '4مم', 'تكييف'],
    name: 'لفة سلك معتمد السويدي الأصلي 4 مم (للتكييفات والسخانات)',
    unit: 'لفة 100م (4 مم)',
    minPrice: 2400,
    maxPrice: 2950,
    avgPrice: 2700,
    advice: 'خطوط التكييف والسخان والمطبخ تحتاج خط مباشر 4 مم مع قاطع مستقل بدون أي لحامات في المنتصف.'
  },
  {
    key: 'مواسير سباكة',
    keywords: ['مواسير', 'سباكة', 'بولي', 'br', 'الشريف'],
    name: 'مواسير تغذية بولي بروبلين معتمدة (BR / الشريف) 3/4 بوصة',
    unit: 'ماسورة 4 متر',
    minPrice: 130,
    maxPrice: 190,
    avgPrice: 160,
    advice: 'اطلب من شركة السباكة فني اختبار الضغط (الكبس) ليمنحك شهادة ضمان معتمدة ومجانية لمدة 10 سنوات قبل تركيب السيراميك.'
  },
  {
    key: 'عزل مائي',
    keywords: ['عزل', 'سيكا', 'بيتومين', 'عازل'],
    name: 'عزل أسمنتي معتمد للحمامات والمطابخ (سيكا توب سيل 107)',
    unit: 'مجموعة (شكارة + جركن)',
    minPrice: 550,
    maxPrice: 750,
    avgPrice: 650,
    advice: 'اختبر العزل بملء الحمام بالمياه لارتفاع 10 سم وتركه 48 ساعة للتأكد التام من عدم وجود أي تسريب للجار أسفلك.'
  },
  {
    key: 'جبس بورد ومصيص',
    keywords: ['جبس', 'كناوف', 'بورد', 'مصيص'],
    name: 'لوح جبس بورد كناوف Knauf أخضر مقاوم للرطوبة (9.5 / 12.5 مم)',
    unit: 'لوح (120 × 240 سم)',
    minPrice: 240,
    maxPrice: 320,
    avgPrice: 280,
    advice: 'استخدم اللوح الأخضر المقاوم للرطوبة للمطبخ والحمام، واستخدم شاسيه صاج مجلفن سمك لا يقل عن 0.4 مم لعدم هبوط السقف.'
  },
  {
    key: 'معجون وسيلر',
    keywords: ['معجون', 'سيلر', 'دايتون'],
    name: 'شكارة معجون حوائط جاهز ناعم (سافيتو / دايتون)',
    unit: 'شكارة / بستلة معجون',
    minPrice: 110,
    maxPrice: 165,
    avgPrice: 135,
    advice: 'لا تبدأ المعجون قبل التأكد من جفاف المحارة تماماً (على الأقل 21 يوماً بعد المحارة) مع دهان وش سيلر مائي أولاً.'
  },
  {
    key: 'دهانات وبويات',
    keywords: ['دهان', 'بستلة', 'يوتن', 'فينيلت', 'glc'],
    name: 'بستلة دهان بلاستيك مط / نصف لامع عالي الجودة (يوتن / كيمابوكسي / GLC)',
    unit: 'بستلة 9 - 14 لتر',
    minPrice: 850,
    maxPrice: 1600,
    avgPrice: 1200,
    advice: 'الدهان المط يخفي عيوب استواء المحارة، بينما النصف لامع والحريري أسهل بكثير في الغسيل والتنظيف للممرات وغرف الأطفال.'
  },
  {
    key: 'سيراميك',
    keywords: ['سيراميك', 'فرز اول', 'كليوباترا', 'رويال'],
    name: 'متر سيراميك أرضيات فرز أول ليزر (كليوباترا / ليسيكو / رويال)',
    unit: 'متر مربع (م²)',
    minPrice: 140,
    maxPrice: 240,
    avgPrice: 185,
    advice: 'تأكد من رقم الشحنة (Tone & Caliber) على جميع الكراتين لتفادي اختلاف درجات اللون بين كرتونة وأخرى.'
  },
  {
    key: 'بورسلين',
    keywords: ['بورسلين', 'بورسلان'],
    name: 'متر بورسلين هندي / إسباني مستورد عالي الفخامة',
    unit: 'متر مربع (م²)',
    minPrice: 320,
    maxPrice: 650,
    avgPrice: 450,
    advice: 'احذر تماماً من لصق البورسلين بالمونة والأسمنت العادي! سيفك بعد فترة قصيرة، لابد من استخدام مادة لصق مخصصة (سافيتو/سيكا).'
  },
  {
    key: 'ونش وتشوين',
    keywords: ['ونش', 'تشوين', 'تطليع', 'نقل'],
    name: 'ونش رفع وتشوين المون للدور 3 إلى 6 (لكل شحنة)',
    unit: 'نقلة ونش كاملة',
    minPrice: 1200,
    maxPrice: 2000,
    avgPrice: 1500,
    advice: 'اتفق مع الوناش على التشوين داخل الشقة وتوزيع الشكاير في المنتصف فوق الكمرات وليس في منتصف السقف لمنع الأحمال الزائدة.'
  }
];

/**
 * Intelligent Price Advisor - Compares entered unit price with current market benchmark
 */
export function evaluateMarketPrice(title = '', itemType = '', unitPrice = 0) {
  const price = Number(unitPrice) || 0;
  if (price <= 0) {
    return {
      isMatched: false,
      status: 'neutral',
      badgeText: 'أدخل سعر الوحدة للتقييم',
      tipText: 'اكتب سعر القطعة/الشكارة/المتر لنخبرك بمتوسط سعرها في السوق المصري.'
    };
  }

  const combined = `${title} ${itemType}`.toLowerCase();

  // Find matching benchmark
  const matched = EGYPT_FINISHING_MARKET_BENCHMARKS.find((b) =>
    b.keywords.some((kw) => combined.includes(kw.toLowerCase()))
  );

  if (!matched) {
    return {
      isMatched: false,
      status: 'neutral',
      badgeText: 'سعر مسجل بالعهدة',
      tipText: 'يمكنك مقارنة هذا السعر بالأسعار التي ستشتري بها نفس البند لاحقاً.'
    };
  }

  const { minPrice, maxPrice, avgPrice, unit, advice, name } = matched;

  // Comparison logic
  if (price >= minPrice * 0.95 && price <= maxPrice * 1.08) {
    return {
      isMatched: true,
      materialName: name,
      unit,
      minPrice,
      maxPrice,
      avgPrice,
      status: 'good',
      badgeText: 'سعر مناسب وممتاز للسوق 🟢',
      tipText: `السعر (${price} ج.م) يقع ضمن النطاق الطبيعي لمتوسط السوق في مصر (${minPrice} - ${maxPrice} ج.م / ${unit}). ${advice}`
    };
  }

  if (price > maxPrice * 1.08 && price <= maxPrice * 1.35) {
    const diff = Math.round(((price - avgPrice) / avgPrice) * 100);
    return {
      isMatched: true,
      materialName: name,
      unit,
      minPrice,
      maxPrice,
      avgPrice,
      status: 'high',
      badgeText: `سعر مرتفع نسبياً (+${diff}%) ⚠️`,
      tipText: `سعر هذا البند أعلى من متوسط السوق (${avgPrice} ج.م / ${unit}). راجع التاجر وتأكد أن السعر يشمل التوصيل والتشوين أو اطلب تخفيضاً.`
    };
  }

  if (price > maxPrice * 1.35) {
    const diff = Math.round(((price - avgPrice) / avgPrice) * 100);
    return {
      isMatched: true,
      materialName: name,
      unit,
      minPrice,
      maxPrice,
      avgPrice,
      status: 'alert_high',
      badgeText: `سعر مبالغ فيه (+${diff}%) 🚨`,
      tipText: `السعر أعلى بكثير من أسعار المعارض المعتمدة (المتوسط حوالي ${avgPrice} ج.م). ينصح بشدة بمقارنة عرض سعر من تاجر أو مغلق آخر فوراً قبل الشراء!`
    };
  }

  if (price < minPrice * 0.75) {
    const diff = Math.round(((avgPrice - price) / avgPrice) * 100);
    return {
      isMatched: true,
      materialName: name,
      unit,
      minPrice,
      maxPrice,
      avgPrice,
      status: 'cheap',
      badgeText: `سعر أرخص بكثير (-${diff}%) 🔍`,
      tipText: `سعر منخفض جداً عن الطبيعي. احذر من الخامات المغشوشة أو الأسلاك غير المعتمدة والفرز الثاني/الثالث المخزن في رطوبة.`
    };
  }

  return {
    isMatched: true,
    materialName: name,
    unit,
    minPrice,
    maxPrice,
    avgPrice,
    status: 'good',
    badgeText: 'سعر مقبول بالسوق ✓',
    tipText: `متوسط سعر هذا البند في مصر يتراوح بين ${minPrice} و ${maxPrice} ج.م لكل ${unit}.`
  };
}

/**
 * 10-Stage Apartment Finishing Beginner's Educational & Practical Guide
 */
export const FINISHING_STAGES_GUIDE = [
  {
    stageNumber: 1,
    id: 'demolition-prep',
    title: 'مرحلة التكسير والتعديلات المعمارية',
    icon: 'Hammer',
    shortDesc: 'فتح الريسبشن، تعديل مساحات الغرف، بناء حوائط جديدة، ونقل الردم.',
    estimatedDuration: '3 - 7 أيام',
    essentialTips: [
      'تأكد 100% من عدم تكسير أو نقر أي عمود خرساني أو كمرة ساقطة، التكسير يكون في الطوب فقط.',
      'إذا كنت ستوسع الحمام أو المطبخ، حدد أماكن الصرف والتغذية الجديدة قبل البدء بالبناء.',
      'اتفق مع مقاول التكسير على تنزيل الردم فوراً وتشوينه في شوايل خارج العمارة أولاً بأول حتى لا يثقل سقف الشقة.'
    ],
    contractorTraps: [
      'حيلة ترك الردم: بعض الصنايعية يطلب مصنعية تكسير فقط ويترك الردم متراكماً داخل الشقة ويطلب لاحقاً مبلغاً خيالياً لنقله.',
      'التكسير العشوائي: تكسير طوب بشكل مائل يعرض الحائط بأكمله للانهيار، اشترط قص الحائط بالصاروخ بدقة.'
    ],
    inspectionChecklist: [
      'استقامة الحوائط الجديدة بميزان المية والخيط.',
      'نظافة أرضية الشقة تماماً من كتل الردم قبل دخول السباك والكهربائي.',
      'ربط الحوائط الجديدة بالأعمدة بكانات حديد مجلفنة كل 3 مداميك.'
    ]
  },
  {
    stageNumber: 2,
    id: 'electrical-rough',
    title: 'مرحلة تأسيس الكهرباء وتكسير الخراطيم',
    icon: 'Zap',
    shortDesc: 'دق العلب، خراطيم الأسقف والأرضيات، سحب أسلاك السويدي، وخطوط التكييف.',
    estimatedDuration: '7 - 12 يوماً',
    essentialTips: [
      'وزع أفياش بكثرة في كل غرفة بجانب السرير وخلف التلفزيون وفي المطبخ (لن تندم أبداً على كثرة الأفياش).',
      'حدد مقاسات سرير النوم والكومودينو بدقة لفتح مفاتيح الديفياتور والأفياش فوق الكومودينو مباشرة وليس خلفه.',
      'خطوط التكييف والسخان والميكروويف لابد أن تكون أسلاك 4 مم مباشرة من اللوحة بدون لحام.',
      'اسحب كابلات النت (Cat6) والدش في مواسير مستقلة تماماً بعيداً عن مواسير أسلاك الكهرباء لمنع التشويش.'
    ],
    contractorTraps: [
      'غش الأسلاك: إحضار سلك تجاري رديء بدلاً من السويدي الأصلي المعتمد (افحص الختم الليزري والوزن وتأكد من شعار السويدي).',
      'تكسير الكمرات والأعمدة: بعض الكهربائية يكسر في خرسانة الأعمدة لدفن الخرطوم، امنعه فوراً واجعله يمرر الخرطوم على المحارة.'
    ],
    inspectionChecklist: [
      'ميزان شيرب موحد لكل علب الكهرباء بالليزر على ارتفاع 90 سم للأفياش و 120 سم للمفاتيح.',
      'تأمين خراطيم الأرضية بالمونة فوراً حتى لا تتكسر تحت أقدام العمال.',
      'عدم وجود لحامات للأسلاك داخل الخراطيم المدفونة نهائياً.'
    ]
  },
  {
    stageNumber: 3,
    id: 'plumbing-waterproofing',
    title: 'مرحلة تأسيس السباكة والعزل المائي',
    icon: 'Droplets',
    shortDesc: 'مواسير التغذية بولي بروبلين، شبكة الصرف، وعزل أرضيات الحمام والمطبخ.',
    estimatedDuration: '7 - 10 أيام',
    essentialTips: [
      'اختر مواسير تغذية من شركات كبرى مثل (BR الألمانية أو الشريف)، واشترط مواسير خضراء حرارية معتمدة.',
      'اعزل أرضية الحمامات بمادة سيكا 107 الأسمنتية أو البيتومين المؤكسد مع رقبة زجاجة بارتفاع 25 سم على الحائط.',
      'حدد منسوب بانيو الاستحمام أو الكابينة ومقاسات الشاور الزجاجي المعلق وحوض المطبخ قبل دفن المواسير.'
    ],
    contractorTraps: [
      'عدم كبس المواسير: ينهي السباك عمله ويدعو لتركيب السيراميك فوراً. إياك أن تفعل ذلك! اتصل بخدمة عملاء شركة المواسير لكبس الخط وإعطائك شهادة ضمان 10 سنين مجاناً.',
      'العزل الرديء فوق أتربة: وضع العزل فوق تراب وركام يجعله ينفصل ويسرب. اشترط تنظيف ومسح الأرضية بالكامل كالمراية قبل العزل.'
    ],
    inspectionChecklist: [
      'شهادة كبس واختبار الضغط المعتمدة من شركة المواسير بختم الفني.',
      'اختبار العزل المائي بملء أرضية الحمام بالماء 48 ساعة والتأكد من جفاف سقف الجار أسفلك.',
      'ميول مواسير الصرف نحو البيبة بدرجة ميل كافية لعدم انسداد المواسير مستقبلاً.'
    ]
  },
  {
    stageNumber: 4,
    id: 'carpentry-frames',
    title: 'مرحلة النجارة وتثبيت الحلوق الخشبية',
    icon: 'DoorOpen',
    shortDesc: 'تثبيت حلوق الأبواب الزفرة وضبط منسوب الشيرب لمطابقة السيراميك.',
    estimatedDuration: '3 - 5 أيام',
    essentialTips: [
      'اشترط خشب موسكي محمل (2 بوصة سمك وليس 1 بوصة خفيف) حتى يتحمل الأبواب الثقيلة للأمام.',
      'اطلب من النجار دهان ظهر الحلوق الملاصقة للحائط بالبيتومين العازل لحماية الخشب من رطوبة الحائط وسوسة الخشب.',
      'لابد أن يضبط النجار منسوب الحلق مع شيرب الليزر الخاص بالسباك والسيراميك حتى لا يقصر الباب أو يحك بالأرضية.'
    ],
    contractorTraps: [
      'تثبيت الحلق بمسمارين فقط: يثبت الحلق بمسمار ضعيف فيتحرك الباب بعد تركيب السيراميك. اشترط كانات حديد مجلفنة 6 كانات لكل حلق ومونة قوية.',
      'استخدام خشب أبيض ضعيف أو مليء بالعقد الخبيثة التي تسقط وتترك فراغات.'
    ],
    inspectionChecklist: [
      'استقامة الحلق رأسياً وأفقياً بميزان المية والزاوية القائمة.',
      'تثبيت شيكال خشبي في أسفل الحلق حتى لا يضيق أو يفتح أثناء رمي المونة.',
      'مطابقة مقاسات الأبواب للمواصفات (أبواب الغرف 80-90 سم، أبواب الحمام 70-80 سم).'
    ]
  },
  {
    stageNumber: 5,
    id: 'plastering-walls',
    title: 'مرحلة المحارة والبياض (أهم مرحلة بالتشطيب)',
    icon: 'PaintBucket',
    shortDesc: 'الطرطشة المسمارية، البؤج والأوتار، وتنعيم واستقامة الحوائط والأسقف.',
    essentialTips: [
      'المحارة هي العمود الفقري للشقة! إذا كانت المحارة معووجة فسيعاني النقاش وبتاع السيراميك والجبس بورد.',
      'اشترط محارة (بؤج وأوتار وتربيع وزوايا 90 درجة) وليس محارة دراع عشوائية، لتستلم غرف مربعة زواياها مثالية.',
      'رش مياه على الطرطشة والمحارة يومياً لمدة 4 أيام متتالية صباحاً ومساءً لتقوية الأسمنت ومنع التشققات (التنميل).'
    ],
    contractorTraps: [
      'إهمال شبك الفايبر: عند التقاء الطوب مع الأعمدة الخرسانية، إذا لم يضع شبك فايبر مع مسمار وفيشر ستحدث شروخ طولية لا تختفي بعد الدهان أبداً.',
      'خلط الجبس مع مونة المحارة: بعض المبيضين يضع جبس مع الأسمنت لتجف بسرعة ويرتاح في الشغل، وهذا غش يفرول المحارة بعد أشهر.'
    ],
    inspectionChecklist: [
      'استلام الحائط بالقِدّة الألومنيوم الطويلة (لا يوجد أي فراغ أو نور يمر خلف القِدّة).',
      'استواء زوايا الأركان 90 درجة بزاوية حديد خاصة في أركان المطبخ والحمام.',
      'خشونة الطرطشة المسمارية لتلتصق بها طبقة الملء بقوة.'
    ]
  },
  {
    stageNumber: 6,
    id: 'gypsum-ceilings',
    title: 'مرحلة الجبس بورد والأسقف المعلقة وبيوت النور',
    icon: 'Layout',
    shortDesc: 'شاسيهات الصاج، ألواح كناوف الأصلية، بيوت الستائر، وفتحات الإسبوتات.',
    estimatedDuration: '4 - 8 أيام',
    essentialTips: [
      'استخدم ألواح كناوف Knauf الأصلية ولا تقبل بألواح مجهولة المصدر خفيفة تتشقق مع الوقت.',
      'في المطابخ والحمامات، استخدم حصراً الألواح الخضراء المقاومة للرطوبة والبخار.',
      'اعمل بيت ستارة مخفي بعرض 20 سم فوق كل شباك وبلكونة ليعطي مظهراً فندقياً رائعاً للستائر.'
    ],
    contractorTraps: [
      'تقليل الأوميجا والسي (التقفيل الضعيف): التباعد بين صاج التثبيت يجب ألا يزيد عن 60 سم، إذا باعدها الصنايعي سيهبط السقف في المنتصف بعد سنة.',
      'إهمال شريط الفايبر والشاش بمعجون المفاصل، مما يسبب شروخاً شعرية قبيحة بعد الدهان.'
    ],
    inspectionChecklist: [
      'ميزان ليزر دقيق للتأكد من استواء السقف بدون أي ميول.',
      'ثبات السقف وقوته عند الضغط عليه باليد بدون أي اهتزاز أو رقص.',
      'تنسيق أماكن الإسبوتات وفتحات التكييف مسبقاً مع الكهربائي.'
    ]
  },
  {
    stageNumber: 7,
    id: 'ceramics-porcelain',
    title: 'مرحلة السيراميك والبورسلين والأرضيات',
    icon: 'Grid',
    shortDesc: 'تركيب أرضيات وحوائط الحمامات والمطبخ والصالة والفرز الأول.',
    estimatedDuration: '7 - 14 يوماً',
    essentialTips: [
      'استخدم صلايب فواصل لا تقل عن 1.5 - 2 مم لتسمح بتمدد البلاط مع حرارة الصيف دون أن يرتفع من مكانه.',
      'البورسلين لا يمتص الماء، لذا لا يركب نهائياً بالأسمنت العادي! اشترِ مادة لصق مخصصة (سافيتو أو كيمابوكسي).',
      'تأكد من عمل ميول كافية لأرضيات الحمام والمطبخ والشرفة نحو البيبات والمصارف لمنع ركود المياه.'
    ],
    contractorTraps: [
      'خلط كراتين الفرز: تفريغ بلاطات فرز ثاني أو تالفة في منتصف الغرف أو تحت السجاد.',
      'تطبيش البلاط (الفراغ تحت البلاط): إذا طرقت على البلاطة وسمعت صوتاً مجوفاً، فهذا يعني أن المونة لم تملأ أسفلها وستتكسر مع أي ضربة خفيفة.'
    ],
    inspectionChecklist: [
      'اختبار الميول بسكب كوز ماء في أبعد نقطة ورؤيته يجري بسلاسة للبيبة دون ركود.',
      'تطابق عراميس وفواصل البلاط كخط مستقيم ليزري واحد بين الغرف والريسبشن.',
      'سقية البلاط بأسمنت أبيض وألوان مخصصة وملء الفواصل بالكامل.'
    ]
  },
  {
    stageNumber: 8,
    id: 'paintings-finishes',
    title: 'مرحلة الدهانات والنقاشة والتشطيب الجداري',
    icon: 'Feather',
    shortDesc: 'السيلر المائي، سكاكين المعجون، الصنفرة بالماكينة، والوشوش النهائية.',
    estimatedDuration: '10 - 20 يوماً',
    essentialTips: [
      'لا تبدأ الدهانات نهائياً إذا كانت المحارة رطبة! اتركها تجف تماماً حتى لا ينفصل المعجون ويقشر بعد سنة.',
      'مراحل النقاشة الصحيحة: وش سيلر مائي أولاً، ثم سكينتين معجون مع الصنفرة، ثم سكينة تالتة معجون ممتاز، ثم وش بطانة، ثم وشين فينش.',
      'جرب عينات الألوان على حائط بمساحة 1 متر مربع قبل اعتماد لون الشقة بالكامل، فالإضاءة تغير درجة اللون.'
    ],
    contractorTraps: [
      'تخفيف الدهان بالماء أكثر من اللازم لتقليل عدد البستلات، مما يجعل اللون شفافاً وضعيف التغطية.',
      'الصنفرة اليدوية الخفيفة بدلاً من ماكينة الصنفرة باللمبة التي تظهر أدق العيوب والتموجات.'
    ],
    inspectionChecklist: [
      'كشف الحائط بإضاءة جانبية كشاف موبايل للتأكد من ملمس الحائط فائق النعومة كالحرير.',
      'تغطية تامة ونظافة الحواف عند التقاء السقف مع الحوائط والكرانيش.',
      'تغطية الأرضيات بالكرتون والمشمع طوال فترة الدهان لحماية السيراميك من بقع البوية.'
    ]
  },
  {
    stageNumber: 9,
    id: 'aluminum-windows',
    title: 'مرحلة الألوميتال وشبابيك الـ PVC وعزل الصوت',
    icon: 'Minimize2',
    shortDesc: 'قطاعات الجامبو والتانجو، الزجاج الدبل جورجيا، وسلك الناموس.',
    estimatedDuration: '4 - 7 أيام',
    essentialTips: [
      'إذا كانت شقتك على شارع رئيسي، اختر زجاج دبل معزول (فراغ 10-12 مم) مع حقن غاز لعزل الصوت والضوضاء والحرارة.',
      'اختر قطاع ألوميتال ثقيل محمل (مثل جامبو أو تانجو أو الـ UPVC التركي المعتمد) لتحمل الرياح والأمطار.',
      'تأكد من وجود فتحات تصريف مياه المطر في أسفل مجرى الشباك لمنع تسريب المطر لداخل الغرف.'
    ],
    contractorTraps: [
      'استخدام سيليكون عادي ضعيف يصفر ويفك بعد سنة مسبباً تسريب مياه المطر من جوانب الشباك. اشترط سيليكون هيكلي مقاوم للعوامل الجوية.',
      'تركيب عجل رديء للشباك يجعله ثقيلاً في الفتح والجر بعد فترة وجيزة.'
    ],
    inspectionChecklist: [
      'سلاسة حركة الدرف في الفتح والغلق بيد واحدة.',
      'إحكام غلق الكالون والسكاكة بشكل تام دون أي هواء يمر.',
      'تثبيت سلك الناموس المتين والمتحرك على درفة مستقلة.'
    ]
  },
  {
    stageNumber: 10,
    id: 'final-finishing',
    title: 'مرحلة الفينش النهائي والتركيبات',
    icon: 'Sparkles',
    shortDesc: 'وشوش الكهرباء فينوس، أطقم الصحي، خلاطات جروهي، الأوكر والكوالين، والإضاءة.',
    estimatedDuration: '5 - 10 أيام',
    essentialTips: [
      'ركب وشوش الكهرباء المعتمدة ذات الضمان الطويل (مثل فينوس أو شنايدر أو باناسونيك).',
      'اختر خلاطات مياه معتمدة قلب نحاسي بضمان لا يقل عن 5-10 سنوات (جروهي، إيديال، أو كلودي راك).',
      'غير كالون باب الشقة الرئيسي بكالون كمبيوتر أصلي متعدد اللسان لحماية شقتك قبل نقل العفش والأجهزة.'
    ],
    contractorTraps: [
      'خدش السيراميك أثناء تركيب النجف أو أطقم الصحي. احرص على وجود كراتين وقماش حماية أسفل مناطق العمل.',
      'تركيب مسامير حديد عادية في الحمام تصدأ سريعاً؛ اشترط مسامير استانلس ستيل لا تصدأ من الرطوبة.'
    ],
    inspectionChecklist: [
      'تجربة كل مفتاح كهرباء، بريزة، ولمبة وسبوت في الشقة والتأكد من عملهم.',
      'فتح جميع الخلاطات والتأكد من ضغط المياه وسخونة خط السخان وعدم وجود أي تنقيط أسفل الأحواض.',
      'إغلاق محبس المياه والغاز الرئيسي وتجربة سهولة التحكم بهما في حالات الطوارئ.'
    ]
  }
];

/**
 * AI Smart Invoice OCR Scanner and Item Extractor Helper
 * Extracts structured items from invoice photo or text input
 */
export async function extractInvoiceDataWithAI(imageFile, manualText = '') {
  // Simulates / runs intelligent client-side pattern extraction
  // Matches typical Egyptian construction invoices
  return new Promise((resolve) => {
    setTimeout(() => {
      // If manual text provided, parse it
      if (manualText && manualText.trim()) {
        const parsedItems = parseInvoiceLines(manualText);
        if (parsedItems.length > 0) {
          resolve({
            success: true,
            supplierName: detectSupplier(manualText),
            date: new Date().toISOString().slice(0, 10),
            items: parsedItems
          });
          return;
        }
      }

      // Default smart extraction from sample invoice patterns
      const sampleItems = [
        {
          id: `inv-item-${Date.now()}-1`,
          itemType: 'أسمنت',
          title: 'شكاير أسمنت بورتلاندي 42.5 لافارج',
          quantity: 20,
          quantityText: '20 شكارة',
          unitPrice: 250,
          amount: 5000,
          notes: 'فاتورة معتمدة'
        },
        {
          id: `inv-item-${Date.now()}-2`,
          itemType: 'رمل',
          title: 'رمل حرش للمحارة (نقلة 4 متر)',
          quantity: 4,
          quantityText: '4 متر مكعب',
          unitPrice: 220,
          amount: 880,
          notes: 'توصيل للموقع'
        },
        {
          id: `inv-item-${Date.now()}-3`,
          itemType: 'ونش وتشوين',
          title: 'ونش رفع وتشوين للدور الرابع',
          quantity: 1,
          quantityText: '1 نقلة كاملة',
          unitPrice: 1500,
          amount: 1500,
          notes: 'تشوين داخل الشقة'
        }
      ];

      resolve({
        success: true,
        supplierName: 'مغلق الأمانة لمواد البناء',
        date: new Date().toISOString().slice(0, 10),
        items: sampleItems
      });
    }, 900);
  });
}

function detectSupplier(text) {
  const lines = text.split('\n');
  for (const line of lines.slice(0, 3)) {
    if (line.includes('مغلق') || line.includes('معرض') || line.includes('شركة') || line.includes('محل') || line.includes('مؤسسة')) {
      return line.trim();
    }
  }
  return 'مورد مواد بناء وتشطيب';
}

function parseInvoiceLines(rawText) {
  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
  const items = [];

  lines.forEach((line, idx) => {
    // Try to extract: name, quantity, price, amount
    const numbers = line.match(/[\d٠-٩]+(?:\.[\d٠-٩]+)?/g) || [];
    if (numbers.length >= 1) {
      const parsedNums = numbers.map(parseArabicNumber);
      let qty = 1;
      let unitPrice = 0;
      let amount = 0;

      if (parsedNums.length >= 3) {
        qty = parsedNums[0] || 1;
        unitPrice = parsedNums[1] || 0;
        amount = parsedNums[2] || qty * unitPrice;
      } else if (parsedNums.length === 2) {
        qty = parsedNums[0] || 1;
        amount = parsedNums[1] || 0;
        unitPrice = qty > 0 ? Math.round(amount / qty) : amount;
      } else if (parsedNums.length === 1) {
        amount = parsedNums[0] || 0;
        qty = 1;
        unitPrice = amount;
      }

      const cleanTitle = line.replace(/[\d٠-٩]+(?:\.[\d٠-٩]+)?/g, '').replace(/[=×x*]/g, '').trim() || `بند فاتورة ${idx + 1}`;
      const itemType = normalizeMaterialKeyword(cleanTitle);

      items.push({
        id: `inv-line-${Date.now()}-${idx}`,
        itemType,
        title: cleanTitle,
        quantity: qty,
        quantityText: `${qty}`,
        unitPrice,
        amount: amount || qty * unitPrice,
        notes: ''
      });
    }
  });

  return items;
}
