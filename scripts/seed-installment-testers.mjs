// کاربران آزمایشی «در حال پرداخت قسط» برای تست پرداخت اقساط با درگاه (پیش‌پرداخت، پرداخت زودتر، تسویه‌ی همه، تأخیر).
// اجرا: npm run seed:installments          ← فقط چیزی که نیست را می‌سازد
//       npm run seed:installments -- --reset ← سفارش‌های TEST-INST-* را پاک و با تاریخ‌های تازه (نسبت به همین لحظه) دوباره می‌سازد
// فقط اسناد synthetic با کد TEST-INST-* حذف می‌شوند؛ هیچ سند دیگری لمس نمی‌شود.
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import { hashPassword } from '../src/lib/password.js';
import { hashNationalId, maskNationalId } from '../src/lib/national-id.js';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI در .env.local تنظیم نشده است');
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) throw new Error('SESSION_SECRET حداقل ۱۶ کاراکتر لازم دارد');
const RESET = process.argv.includes('--reset');
const DAY = 86400000;

// firstOffset: سررسید قسط اول نسبت به «الان» (روز)؛ قسط‌های بعدی هر ۳۰ روز. paid: چند قسط اول پرداخت‌شده. downPaid: پیش‌پرداخت داده شده؟
const SCENARIOS = [
  { name: 'تست ۱ — قسط امروز سررسید شده', months: 6, price: 24_000_000, firstOffset: -1 / 24, paid: 0, downPaid: true },
  { name: 'تست ۲ — ۳ روز تا سررسید', months: 6, price: 18_000_000, firstOffset: 3, paid: 0, downPaid: true },
  { name: 'تست ۳ — ۵ روز تأخیر', months: 6, price: 30_000_000, firstOffset: -35, paid: 1, downPaid: true },
  { name: 'تست ۴ — معوق چندماهه (۳ قسط)', months: 9, price: 45_000_000, firstOffset: -100, paid: 1, downPaid: true },
  { name: 'تست ۵ — منظم، مناسب پرداخت زودتر و تسویه‌ی همه', months: 6, price: 36_000_000, firstOffset: -55, paid: 2, downPaid: true },
  { name: 'تست ۶ — پیش‌پرداخت پرداخت‌نشده (تازه تأیید شده)', months: 6, price: 20_000_000, firstOffset: 30, paid: 0, downPaid: false },
  { name: 'تست ۷ — فقط یک قسط مانده', months: 3, price: 12_000_000, firstOffset: -50, paid: 2, downPaid: true },
  { name: 'تست ۸ — در انتظار تأیید مدیر', months: 6, price: 15_000_000, pending: true }
];

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'mobiler_db', serverSelectionTimeoutMS: 10000 });
try {
  if (RESET) {
    const r = await Order.deleteMany({ synthetic: true, code: /^TEST-INST-/ });
    console.log(`پاک‌شد: ${r.deletedCount} سفارش TEST-INST-*`);
  }
  const passwordHash = await hashPassword('Demo@12345');
  const products = await Product.find().limit(10).lean();
  let usersNew = 0, ordersNew = 0;
  for (let i = 0; i < SCENARIOS.length; i++) {
    const sc = SCENARIOS[i];
    const phone = `09991000${String(101 + i)}`;
    let user = await User.findOne({ phone });
    if (!user) {
      const nid = String(BigInt(`0x${createHash('sha256').update(`crediguard-tester-nid-${i}`).digest('hex')}`) % 10000000000n).padStart(10, '0');
      user = await User.create({ name: sc.name, phone, passwordHash, nationalIdHash: hashNationalId(nid), nationalIdMasked: maskNationalId(nid), synthetic: true });
      usersNew++;
    }
    const code = `TEST-INST-${String(i + 1).padStart(2, '0')}`;
    if (await Order.exists({ code })) continue;
    const down = Math.round((sc.price * 0.2) / 1000) * 1000;
    const financed = sc.price - down;
    const monthly = Math.ceil(financed / sc.months / 1000) * 1000;
    const now = Date.now();
    const schedule = sc.pending ? [] : Array.from({ length: sc.months }, (_, j) => {
      const dueDate = new Date(now + (sc.firstOffset + 30 * j) * DAY);
      const isPaid = j < sc.paid;
      return { no: j + 1, dueDate, amount: j === sc.months - 1 ? financed - monthly * (sc.months - 1) : monthly, status: isPaid ? 'paid' : 'due',
        ...(isPaid ? { paidAt: new Date(dueDate.getTime() - 2 * DAY), paidBy: 'tester-seed' } : {}) };
    });
    const p = products.length ? products[i % products.length] : null;
    const status = sc.pending ? 'pending' : 'confirmed';
    await Order.create({
      code, user: user._id, synthetic: true, method: 'installment', status, total: sc.price,
      customer: { name: user.name, phone, address: 'آدرس نمونه — داده آزمایشی' },
      items: [{ ...(p ? { product: p._id } : {}), name: p?.name || 'کالای آزمایشی', price: sc.price, qty: 1 }],
      installment: { months: sc.months, downPayment: down, financed, monthly, down: sc.pending ? { status: 'unpaid' } : sc.downPaid ? { status: 'paid', paidAt: new Date(now - 20 * DAY), ref: 'SIM-SEED' } : { status: 'unpaid' }, schedule },
      history: [{ status, at: new Date(), by: 'tester-seed' }]
    });
    ordersNew++;
  }
  console.log(`✔ کاربران تازه: ${usersNew} | سفارش‌های تازه: ${ordersNew}`);
  console.log('ورود: موبایل 09991000101 تا 09991000108 — رمز: Demo@12345 (سپس «اعتبار و اقساط»)');
  console.log('سناریوها: ۱ امروز سررسید · ۲ سه روز تا سررسید · ۳ پنج روز تأخیر · ۴ معوق چندماهه · ۵ پرداخت زودتر/تسویه همه · ۶ پیش‌پرداخت پرداخت‌نشده · ۷ یک قسط مانده · ۸ در انتظار تأیید');
  console.log('نکته: تاریخ‌ها نسبت به لحظه‌ی اجرا هستند؛ برای تازه‌کردن آن‌ها با --reset دوباره اجرا کنید.');
} finally { await mongoose.disconnect(); }
