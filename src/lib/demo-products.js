// کاتالوگ نمایشی ۱۰۰ محصول موبایلر؛ مستقل از دیتابیس و قابل نمایش پیش از اتصال MongoDB.
const groups = {
  mobile: { label: "گوشی هوشمند", brands: ["اپل", "سامسونگ", "شیائومی", "موتورولا", "ناتینگ"], names: ["iPhone 15 Pro", "Galaxy S24 FE", "Redmi Note 13 Pro", "Edge 50 Fusion", "Phone 2a", "iPhone 14", "Galaxy A55", "Poco X6 Pro", "Galaxy S23 Ultra", "iPhone 13", "Redmi Note 12", "Galaxy A35", "iPhone 15", "Poco F6", "Galaxy Z Flip", "Redmi 13C", "iPhone 16", "Galaxy A25", "Xiaomi 14T", "Nothing Phone 2"], base: 9000000, step: 2200000 },
  laptop: { label: "لپ‌تاپ", brands: ["ایسوس", "لنوو", "اچ‌پی", "ایسر", "اپل"], names: ["Vivobook 15", "IdeaPad Slim 3", "Pavilion 15", "Aspire 5", "MacBook Air M2", "TUF Gaming F15", "ThinkBook 14", "Victus 16", "Swift Go 14", "MacBook Pro 14", "Zenbook 14", "Legion 5", "ProBook 450", "Nitro V 15", "MacBook Air M3", "ROG Strix G16", "Yoga Slim 7", "Envy x360", "Aspire 3", "MacBook Pro M3"], base: 25000000, step: 4000000 },
  headphone: { label: "هدفون", brands: ["سونی", "جی‌بی‌ال", "انکر", "ریزر", "بیتس"], names: ["WH-1000XM5", "Tune 770NC", "Soundcore Q30", "BlackShark V2", "Studio Buds+", "WF-1000XM4", "Live 660NC", "Space One", "Barracuda X", "Solo 4", "WH-CH720N", "Wave Beam", "Life Q35", "Kraken Kitty", "Fit Pro", "LinkBuds S", "Tour One M2", "Liberty 4 NC", "Opus X", "Flex"], base: 800000, step: 350000 },
  powerbank: { label: "گجت و ساعت هوشمند", brands: ["اپل", "سامسونگ", "شیائومی", "انکر", "باسئوس"], names: ["Watch Series 9", "Galaxy Watch 6", "Smart Band 8", "PowerCore 20K", "Bip 5", "Watch SE", "Galaxy Fit 3", "Redmi Watch 4", "Nano Power 10K", "Blade 20K", "Watch Ultra", "Watch 5 Pro", "Mi Band 7", "PowerCore 25K", "Adaman 20K", "Watch Series 8", "Galaxy Watch 5", "Smart Band 9", "MagGo 10K", "Airpow 20K"], base: 600000, step: 180000 },
  accessory: { label: "لوازم جانبی", brands: ["اپل", "انکر", "باسئوس", "یوگرین", "سامسونگ"], names: ["شارژر ۲۰ وات", "کابل USB-C", "قاب سیلیکونی", "گلس پرایوسی", "هاب ۶ پورت", "شارژر ۶۵ وات", "کابل لایتنینگ", "پایه نگهدارنده", "مبدل Type-C", "شارژر بی‌سیم", "قلم هوشمند", "کابل ۱۰۰ وات", "قاب مگ‌سیف", "گلس سرامیکی", "داک USB-C", "آداپتور ۲۵ وات", "کابل HDMI", "هولدر مگنتی", "رم‌ریدر", "پایه لپ‌تاپ"], base: 200000, step: 90000 },
};
const colors = ['مشکی', 'سفید', 'آبی', 'نقره‌ای', 'طلایی', 'سبز'];
const specs = {
  mobile: [{"k": "حافظه داخلی", "values": ["۱۲۸ گیگابایت", "۲۵۶ گیگابایت", "۵۱۲ گیگابایت"]}, {"k": "نمایشگر", "values": ["۶٫۱ اینچ", "۶٫۴ اینچ", "۶٫۷ اینچ"]}, {"k": "شبکه", "values": ["4G", "5G"]}],
  laptop: [{"k": "حافظه رم", "values": ["۸ گیگابایت", "۱۶ گیگابایت", "۳۲ گیگابایت"]}, {"k": "حافظه ذخیره‌سازی", "values": ["۲۵۶ گیگابایت SSD", "۵۱۲ گیگابایت SSD", "۱ ترابایت SSD"]}, {"k": "کاربری", "values": ["دانشجویی و روزمره", "طراحی و مهندسی", "بازی و پردازش"]}],
  headphone: [{"k": "نوع اتصال", "values": ["بی‌سیم بلوتوث", "سیمی", "بلوتوث ۵٫۳"]}, {"k": "ویژگی صوتی", "values": ["حذف نویز فعال", "صدای استریو", "میکروفون داخلی"]}, {"k": "کاربری", "values": ["موسیقی و مکالمه", "گیمینگ", "استفاده روزمره"]}],
  powerbank: [{"k": "نوع محصول", "values": ["ساعت هوشمند", "مچ‌بند هوشمند", "پاوربانک"]}, {"k": "ظرفیت / اندازه", "values": ["۱۰۰۰۰ میلی‌آمپر", "۲۰۰۰۰ میلی‌آمپر", "نمایشگر AMOLED"]}, {"k": "اتصال", "values": ["بلوتوث", "USB-C", "شارژ بی‌سیم"]}],
  accessory: [{"k": "نوع محصول", "values": ["کابل شارژ", "قاب محافظ", "شارژر دیواری", "گلس صفحه"]}, {"k": "سازگاری", "values": ["گوشی‌های USB-C", "دستگاه‌های سازگار اپل", "گوشی و تبلت"]}, {"k": "ویژگی", "values": ["طراحی مقاوم", "شارژ سریع", "نصب آسان"]}],
};
const descriptions = {
  mobile: 'برای ارتباط روزمره، عکاسی، سرگرمی و اجرای برنامه‌های کاربردی طراحی شده است. هنگام انتخاب، ظرفیت حافظه، کیفیت نمایشگر، عمر باتری و سازگاری شبکه را با نیاز خود مقایسه کنید.',
  laptop: 'گزینه‌ای برای کار، تحصیل و اجرای نرم‌افزارهای روزمره یا تخصصی. پیش از خرید، نوع پردازنده، ظرفیت رم و حافظه، وزن دستگاه و نیاز نرم‌افزاری خود را بررسی کنید.',
  headphone: 'برای گوش‌دادن به موسیقی، تماشای فیلم و مکالمه کاربرد دارد. نوع اتصال، راحتی قرارگیری روی گوش، کیفیت میکروفون و قابلیت حذف نویز از معیارهای مهم انتخاب هستند.',
  powerbank: 'گجت کاربردی برای مدیریت و تأمین انرژی یا پایش فعالیت‌های روزانه. ظرفیت، روش شارژ، سازگاری با دستگاه و امکانات ارتباطی را پیش از خرید بررسی کنید.',
  accessory: 'لوازم جانبی کاربردی برای محافظت، اتصال یا شارژ دستگاه‌های دیجیتال. پیش از سفارش، نوع درگاه، توان خروجی و سازگاری محصول با مدل دستگاه خود را کنترل کنید.'
};
const products = [];
let sequence = 0;
for (const [category, group] of Object.entries(groups)) {
  for (let i = 0; i < 20; i++) {
    sequence++;
    const brand = group.brands[i % group.brands.length];
    const model = group.names[i];
    const price = Math.round((group.base + group.step * (i % 7)) / 1000) * 1000;
    const selectedSpecs = specs[category].map(item => ({ k: item.k, v: item.values[i % item.values.length] }));
    products.push({
      _id: `demo-${category}-${i + 1}`,
      name: `${model} ${brand}`,
      slug: `${category}-${i + 1}`,
      sku: `${category}-${String(i + 1).padStart(3, '0')}`.toUpperCase(),
      brand,
      category,
      price,
      oldPrice: i % 3 === 0 ? Math.round(price * 1.15 / 1000) * 1000 : null,
      colors: [colors[i % colors.length], colors[(i + 2) % colors.length]],
      caption: `${group.label} ${brand}؛ مناسب استفاده روزمره و حرفه‌ای`,
      description: `${model} از برند ${brand}. ${descriptions[category]} این کالا به‌صورت پیش‌فرض در کاتالوگ نمایشی موبایلر قرار گرفته و مشخصات آن برای ویرایش و تکمیل توسط مدیر فروشگاه آماده است.`,
      specs: [{ k: 'برند', v: brand }, ...selectedSpecs, { k: 'وضعیت اطلاعات', v: 'اطلاعات نمونه؛ قابل ویرایش' }],
      stock: 5 + ((sequence * 7) % 40),
      minStock: 5,
      sold: (sequence * 13) % 90,
      image: '/img/product-placeholder.svg',
      isOffer: category === 'mobile' && i < 4
    });
  }
}
export const DEMO_PRODUCTS = products;
