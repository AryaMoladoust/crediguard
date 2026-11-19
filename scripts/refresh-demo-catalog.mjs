// به‌روزرسانی نام‌ها و متن محصولات نمونه بدون حذف اسناد، تغییر موجودی یا شکستن ارجاع سفارش‌ها
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
const groups = {
  mobile: { brands: ['اپل','سامسونگ','شیائومی','موتورولا','ناتینگ'], names: ['iPhone 15 Pro','Galaxy S24 FE','Redmi Note 13 Pro','Edge 50 Fusion','Phone 2a','iPhone 14','Galaxy A55','Poco X6 Pro','Galaxy S23 Ultra','iPhone 13','Redmi Note 12','Galaxy A35','iPhone 15','Poco F6','Galaxy Z Flip','Redmi 13C','iPhone 16','Galaxy A25','Xiaomi 14T','Nothing Phone 2'], label:'گوشی هوشمند' },
  laptop: { brands: ['ایسوس','لنوو','اچ‌پی','ایسر','اپل'], names: ['Vivobook 15','IdeaPad Slim 3','Pavilion 15','Aspire 5','MacBook Air M2','TUF Gaming F15','ThinkBook 14','Victus 16','Swift Go 14','MacBook Pro 14','Zenbook 14','Legion 5','ProBook 450','Nitro V 15','MacBook Air M3','ROG Strix G16','Yoga Slim 7','Envy x360','Aspire 3','MacBook Pro M3'], label:'لپ‌تاپ' },
  headphone: { brands: ['سونی','جی‌بی‌ال','انکر','ریزر','بیتس'], names: ['WH-1000XM5','Tune 770NC','Soundcore Q30','BlackShark V2','Studio Buds+','WF-1000XM4','Live 660NC','Space One','Barracuda X','Solo 4','WH-CH720N','Wave Beam','Life Q35','Kraken Kitty','Fit Pro','LinkBuds S','Tour One M2','Liberty 4 NC','Opus X','Flex'], label:'هدفون' },
  powerbank: { brands: ['اپل','سامسونگ','شیائومی','انکر','باسئوس'], names: ['Watch Series 9','Galaxy Watch 6','Smart Band 8','PowerCore 20K','Bip 5','Watch SE','Galaxy Fit 3','Redmi Watch 4','Nano Power 10K','Blade 20K','Watch Ultra','Watch 5 Pro','Mi Band 7','PowerCore 25K','Adaman 20K','Watch Series 8','Galaxy Watch 5','Smart Band 9','MagGo 10K','Airpow 20K'], label:'گجت و پاوربانک' },
  accessory: { brands: ['اپل','انکر','باسئوس','یوگرین','سامسونگ'], names: ['شارژر ۲۰ وات','کابل USB-C','قاب سیلیکونی','گلس پرایوسی','هاب ۶ پورت','شارژر ۶۵ وات','کابل لایتنینگ','پایه نگهدارنده','مبدل Type-C','شارژر بی‌سیم','قلم هوشمند','کابل ۱۰۰ وات','قاب مگ‌سیف','گلس سرامیکی','داک USB-C','آداپتور ۲۵ وات','کابل HDMI','هولدر مگنتی','رم‌ریدر','پایه لپ‌تاپ'], label:'لوازم جانبی' }
};
if (!process.env.MONGODB_URI) { console.error('MONGODB_URI در .env.local تنظیم نشده است'); process.exit(1); }
await mongoose.connect(process.env.MONGODB_URI, { dbName:'mobiler_db', serverSelectionTimeoutMS:8000 });
let changed=0;
for (const [category, group] of Object.entries(groups)) {
  for (let i=0;i<20;i++) {
    const brand=group.brands[i%5];
    const name=`${group.names[i]} ${brand}`;
    const result=await Product.updateOne({slug:`${category}-${i+1}`}, {$set:{name,brand,caption:`${group.names[i]} از برند ${brand}؛ انتخابی کاربردی با ضمانت اصالت کالا`,description:`${group.names[i]} از برند ${brand} با کیفیت ساخت مناسب، عملکرد قابل اعتماد و ضمانت اصالت کالا.`,image:`/img/${category}.svg`}});
    changed += result.modifiedCount;
  }
}
console.log(`✔ اطلاعات نمایشی ${changed} محصول به‌روزرسانی شد؛ شناسه‌ها، قیمت‌ها، موجودی، فروش و سفارش‌های قبلی حفظ شدند.`);
await mongoose.disconnect();
