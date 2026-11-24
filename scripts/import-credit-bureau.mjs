// استفاده: npm run import:bureau   (یا: node --env-file=.env.local scripts/import-credit-bureau.mjs)
import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';

const file = process.argv[2] || 'data/credit-bureau-10000.json';
if (!file) { console.error('مسیر فایل JSON را بدهید'); process.exit(1); }
const docs = JSON.parse(readFileSync(file, 'utf8'));
await mongoose.connect(process.env.MONGODB_URI, { dbName: 'mobiler_db' });
const col = mongoose.connection.collection('credit_bureau');
await col.deleteMany({});
for (let i = 0; i < docs.length; i += 1000) await col.insertMany(docs.slice(i, i + 1000));
await col.createIndex({ nationalId: 1 }, { unique: true });
await col.createIndex({ mobile: 1 }, { unique: true });
console.log(`✔ ${await col.countDocuments()} رکورد در credit_bureau ثبت شد`);
await mongoose.disconnect();
