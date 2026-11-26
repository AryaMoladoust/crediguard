// واردسازی فقط داده‌های کاملاً مصنوعی؛ هیچ رکوردی از مجموعه حذف نمی‌شود.
// اجرا: npm run import:bureau -- [مسیر فایل JSON]
import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';

const file = process.argv[2] || 'data/credit-bureau-10000.json';
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI در .env.local تنظیم نشده است');
const docs = JSON.parse(readFileSync(file, 'utf8'));
if (!Array.isArray(docs) || docs.length === 0) throw new Error('فایل باید آرایه‌ای غیرخالی از رکوردها باشد');
for (const [i, doc] of docs.entries()) {
  if (doc?.synthetic !== true || !/^\d{10}$/.test(String(doc.nationalId || '')) || !/^09\d{9}$/.test(String(doc.mobile || ''))) {
    throw new Error(`رکورد ${i + 1} معتبر نیست یا برچسب synthetic:true ندارد؛ هیچ داده‌ای وارد نشد`);
  }
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'mobiler_db' });
try {
  const col = mongoose.connection.collection('credit_bureau');
  await col.createIndex({ nationalId: 1 }, { unique: true });
  await col.createIndex({ mobile: 1 }, { unique: true });

  // اگر شناسه‌ای متعلق به رکورد غیرمصنوعی باشد، به‌جای بازنویسی/تکثیر، عملیات متوقف می‌شود.
  const ids = docs.map((d) => d.nationalId);
  const realCollision = await col.findOne({ nationalId: { $in: ids }, synthetic: { $ne: true } }, { projection: { nationalId: 1 } });
  if (realCollision) throw new Error('تداخل با رکورد غیرمصنوعی در credit_bureau؛ برای حفظ داده واقعی عملیات متوقف شد');

  for (let i = 0; i < docs.length; i += 500) {
    const batch = docs.slice(i, i + 500);
    await col.bulkWrite(batch.map((doc) => ({
      updateOne: { filter: { nationalId: doc.nationalId }, update: { $set: doc }, upsert: true }
    })), { ordered: true });
  }
  console.log(`✔ ${await col.countDocuments({ synthetic: true })} رکورد مصنوعی در credit_bureau موجود است؛ رکوردهای قبلی حذف نشدند`);
} finally {
  await mongoose.disconnect();
}
