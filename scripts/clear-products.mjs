// حذف همه‌ی کالاهای دیتابیس (مثلاً ۱۰۰ کالای نمونه‌ی seed) تا فقط کالاهای واقعی خودتان بماند.
// استفاده: npm run products:clear -- --yes
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
if (!process.argv.includes('--yes')) { console.error('برای تأیید، --yes را اضافه کنید: npm run products:clear -- --yes'); process.exit(1); }
await mongoose.connect(process.env.MONGODB_URI, { dbName: 'mobiler_db' });
const r = await Product.deleteMany({});
console.log(`✔ ${r.deletedCount} کالا حذف شد`);
await mongoose.disconnect();
