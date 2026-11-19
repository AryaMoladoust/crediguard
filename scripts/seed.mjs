import mongoose from 'mongoose';
import Product from '../src/models/Product.js';

const COLORS = ['مشکی', 'سفید', 'آبی', 'نقره‌ای', 'طلایی', 'سبز'];
const CATS = {
  mobile: { label: 'گوشی هوشمند', brands: ['اپل', 'سامسونگ', 'شیائومی', 'موتورولا', 'ناتینگ'], names: ['iPhone 15 Pro', 'Galaxy S24 FE', 'Redmi Note 13 Pro', 'Edge 50 Fusion', 'Phone 2a', 'iPhone 14', 'Galaxy A55', 'Poco X6 Pro', 'Galaxy S23 Ultra', 'iPhone 13', 'Redmi Note 12', 'Galaxy A35', 'iPhone 15', 'Poco F6', 'Galaxy Z Flip', 'Redmi 13C', 'iPhone 16', 'Galaxy A25', 'Xiaomi 14T', 'Nothing Phone 2'], base: 9e6, step: 2.2e6, spec: ['حافظه', ['۱۲۸ گیگابایت', '۲۵۶ گیگابایت', '۵۱۲ گیگابایت']] },
  laptop: { label: 'لپ‌تاپ', brands: ['ایسوس', 'لنوو', 'اچ‌پی', 'ایسر', 'اپل'], names: ['Vivobook 15', 'IdeaPad Slim 3', 'Pavilion 15', 'Aspire 5', 'MacBook Air M2', 'TUF Gaming F15', 'ThinkBook 14', 'Victus 16', 'Swift Go 14', 'MacBook Pro 14', 'Zenbook 14', 'Legion 5', 'ProBook 450', 'Nitro V 15', 'MacBook Air M3', 'ROG Strix G16', 'Yoga Slim 7', 'Envy x360', 'Aspire 3', 'MacBook Pro M3'], base: 25e6, step: 4e6, spec: ['رم', ['۸ گیگابایت', '۱۶ گیگابایت', '۳۲ گیگابایت']] },
  headphone: { label: 'هدفون', brands: ['سونی', 'جی‌بی‌ال', 'انکر', 'ریزر', 'بیتس'], names: ['WH-1000XM5', 'Tune 770NC', 'Soundcore Q30', 'BlackShark V2', 'Studio Buds+', 'WF-1000XM4', 'Live 660NC', 'Space One', 'Barracuda X', 'Solo 4', 'WH-CH720N', 'Wave Beam', 'Life Q35', 'Kraken Kitty', 'Fit Pro', 'LinkBuds S', 'Tour One M2', 'Liberty 4 NC', 'Opus X', 'Flex'], base: 8e5, step: 3.5e5, spec: ['نوع اتصال', ['بی‌سیم', 'سیمی', 'بلوتوث ۵.۳']] },
  powerbank: { label: 'گجت و پاوربانک', brands: ['اپل', 'سامسونگ', 'شیائومی', 'انکر', 'باسئوس'], names: ['Watch Series 9', 'Galaxy Watch 6', 'Smart Band 8', 'PowerCore 20K', 'Bip 5', 'Watch SE', 'Galaxy Fit 3', 'Redmi Watch 4', 'Nano Power 10K', 'Blade 20K', 'Watch Ultra', 'Watch 5 Pro', 'Mi Band 7', 'PowerCore 25K', 'Adaman 20K', 'Watch Series 8', 'Galaxy Watch 5', 'Smart Band 9', 'MagGo 10K', 'Airpow 20K'], base: 6e5, step: 1.8e5, spec: ['ظرفیت / ویژگی', ['۱۰۰۰۰ میلی‌آمپر', '۲۰۰۰۰ میلی‌آمپر', '۳۰۰۰۰ میلی‌آمپر']] },
  accessory: { label: 'لوازم جانبی', brands: ['اپل', 'انکر', 'باسئوس', 'یوگرین', 'سامسونگ'], names: ['شارژر ۲۰ وات', 'کابل USB-C', 'قاب سیلیکونی', 'گلس پرایوسی', 'هاب ۶ پورت', 'شارژر ۶۵ وات', 'کابل لایتنینگ', 'پایه نگهدارنده', 'مبدل Type-C', 'شارژر بی‌سیم', 'قلم هوشمند', 'کابل ۱۰۰ وات', 'قاب مگ‌سیف', 'گلس سرامیکی', 'داک USB-C', 'آداپتور ۲۵ وات', 'کابل HDMI', 'هولدر مگنتی', 'رم‌ریدر', 'پایه لپ‌تاپ'], base: 2e5, step: 9e4, spec: ['نوع', ['کابل شارژ', 'قاب محافظ', 'شارژر دیواری', 'گلس صفحه']] }
};

let n = 0;
const docs = [];
for (const [cat, c] of Object.entries(CATS)) {
  for (let i = 0; i < 20; i++) {
    n++;
    const brand = c.brands[i % 5];
    const price = Math.round((c.base + c.step * (i % 7)) / 1000) * 1000;
    docs.push({
      name: `${c.names[i]} ${brand}`, 
      slug: `${cat}-${i + 1}`,
      sku: `${cat}-${i + 1}`.toUpperCase(),
      minStock: 5,
      brand,
      category: cat,
      price,
      oldPrice: i % 3 === 0 ? Math.round((price * 1.15) / 1000) * 1000 : undefined,
      colors: [COLORS[i % 6], COLORS[(i + 2) % 6]],
      caption: `${c.names[i]} از برند ${brand}؛ انتخابی کاربردی با ضمانت اصالت کالا`,
      description: `${c.names[i]} از برند ${brand} با کیفیت ساخت مناسب، عملکرد قابل اعتماد و ضمانت اصالت کالا. انتخابی هوشمند برای استفاده روزمره و حرفه‌ای.`,
      specs: [{ k: 'برند', v: brand }, { k: c.spec[0], v: c.spec[1][i % c.spec[1].length] }, { k: 'گارانتی', v: '۱۸ ماه' }],
      stock: 5 + ((n * 7) % 40),
      sold: (n * 13) % 90,
      image: `/img/${cat}.svg`,
      isOffer: cat === 'mobile' && i < 4
    });
  }
}
if (!process.env.MONGODB_URI) { console.error('MONGODB_URI در .env.local تنظیم نشده است'); process.exit(1); }
await mongoose.connect(process.env.MONGODB_URI, { dbName: 'mobiler_db', serverSelectionTimeoutMS: 8000 });
// ورود امن و تکرارپذیر: فقط کالاهای نمونه‌ای که وجود ندارند اضافه می‌شوند.
// محصولات واقعی، قیمت‌ها، موجودی‌ها و ارجاع سفارش‌های قبلی دست‌نخورده می‌مانند.
const operations = docs.map((doc) => ({
  updateOne: {
    filter: { slug: doc.slug },
    update: { $setOnInsert: doc },
    upsert: true
  }
}));
const result = await Product.bulkWrite(operations, { ordered: false });
const total = await Product.countDocuments();
console.log(`✔ ${result.upsertedCount} محصول نمونه جدید اضافه شد؛ اکنون ${total} محصول در دیتابیس وجود دارد.`);
await mongoose.disconnect();
