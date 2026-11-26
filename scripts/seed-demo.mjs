// داده‌ساز امن و تکرارپذیر برای محیط توسعه/دمو؛ هیچ سند موجودی حذف یا بازنویسی نمی‌شود.
// اجرا: npm run seed:demo
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import CreditProfile from '../src/models/CreditProfile.js';
import CreditAssessment from '../src/models/CreditAssessment.js';
import SupportConversation from '../src/models/SupportConversation.js';
import { hashPassword } from '../src/lib/password.js';
import { hashNationalId, maskNationalId } from '../src/lib/national-id.js';
import { generateCreditData } from '../src/lib/credit-sim.js';
import { analyzeCredit } from '../src/lib/credit-agent.js';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI در .env.local تنظیم نشده است');
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) throw new Error('SESSION_SECRET حداقل ۱۶ کاراکتر لازم دارد');

const names = [
  'سارا احمدی','مهدی کریمی','نگار محمدی','علی رضایی','الهام عباسی',
  'رضا نوری','نیلوفر صادقی','آرمان حسینی','ترانه مرادی','پارسا جعفری',
  'مریم قاسمی','امیرحسین کاظمی','هانیه موسوی','محمد امینی','بهاره اکبری',
  'کیان رستمی','نازنین شریفی','سامان حیدری','یلدا صالحی','اشکان محمودی'
];
const sampleQuestions = [
  'برای خرید اقساطی چه مدارکی لازم است؟',
  'درخواست من چه زمانی بررسی می‌شود؟',
  'لطفاً وضعیت قسط بعدی من را بررسی کنید.',
  'برای تکمیل پرونده اعتباری راهنمایی می‌خواهم.',
  'سفارش من هنوز در انتظار تأیید است.'
];
const sampleReplies = [
  'درخواست شما دریافت شد. پرونده در صف بررسی کارشناسان قرار گرفت.',
  'برای ادامه فرایند، لطفاً وارد بخش اعتبار و اقساط شوید و اطلاعات خواسته‌شده را تکمیل کنید.',
  'وضعیت درخواست شما بررسی شد. نتیجه در پنل کاربری قابل مشاهده است.'
];

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'mobiler_db', serverSelectionTimeoutMS: 10000 });
try {
  const passwordHash = await hashPassword('Demo@12345');
  const users = [];
  let createdUsers = 0;
  for (let i = 0; i < names.length; i++) {
    const phone = `09990000${String(100 + i)}`;
    let user = await User.findOne({ phone });
    if (!user) {
      const nidNumber = BigInt(`0x${createHash('sha256').update(`crediguard-demo-national-id-${i}`).digest('hex')}`) % 10000000000n;
      const rawNid = String(nidNumber).padStart(10, '0');
      user = await User.create({
        name: names[i], phone, email: `demo${i + 1}@example.invalid`,
        passwordHash, nationalIdHash: hashNationalId(rawNid), nationalIdMasked: maskNationalId(rawNid),
        phoneVerified: true, phoneVerifiedAt: new Date(), synthetic: true
      });
      createdUsers++;
    }
    users.push(user);

    let profile = await CreditProfile.findOne({ user: user._id });
    if (!profile) {
      const data = generateCreditData(String(user._id));
      profile = await CreditProfile.create({ user: user._id, synthetic: true, source: 'demo-seed', data });
    }
    if (!await CreditAssessment.exists({ user: user._id, latest: true })) {
      const result = analyzeCredit(profile.data);
      await CreditAssessment.create({ user: user._id, inputHash: createHash('sha256').update(JSON.stringify(profile.data)).digest('hex').slice(0,32), latest: true, trigger: 'register', synthetic: true, ...result });
    }
  }

  const products = await Product.find().limit(40).lean();
  let createdOrders = 0;
  if (products.length) {
    for (let i = 0; i < 20; i++) {
      const code = `DEMO-${2026}-${String(i + 1).padStart(4, '0')}`;
      if (await Order.exists({ code })) continue;
      const user = users[i % users.length];
      const product = products[(i * 7) % products.length];
      const qty = 1 + (i % 2);
      const total = Number(product.price || 0) * qty;
      const installment = i % 3 !== 0;
      const months = [3, 6, 9, 12][i % 4];
      const downPayment = Math.round(total * 0.2);
      const financed = total - downPayment;
      const monthly = Math.floor(financed / months);
      const status = ['pending','confirmed','shipped','completed'][i % 4];
      const schedule = status === 'pending' || !installment ? [] : Array.from({ length: months }, (_, j) => ({
        no: j + 1,
        dueDate: new Date(Date.now() - (months - j - 1) * 30 * 86400000 + 10 * 86400000),
        amount: j === months - 1 ? financed - monthly * (months - 1) : monthly,
        status: j < (i % 3) ? 'paid' : 'due',
        ...(j < (i % 3) ? { paidAt: new Date() , paidBy: 'demo-seed' } : {})
      }));
      const assessment = await CreditAssessment.findOne({ user: user._id, latest: true }).lean();
      await Order.create({
        code, user: user._id, synthetic: true,
        customer: { name: user.name, phone: user.phone, address: 'آدرس نمونه - داده آزمایشی' },
        items: [{ product: product._id, name: product.name, price: product.price, qty }],
        total, method: installment ? 'installment' : 'cash', status,
        ...(installment ? { installment: { months, downPayment, financed, monthly, schedule } } : {}),
        ...(assessment ? { credit: { assessment: assessment._id, score: assessment.score, riskLevel: assessment.riskLevel, limit: assessment.creditLimit, recommendation: assessment.recommendation, rule: status === 'pending' ? 'needs_review' : 'within_limit' } } : {}),
        history: [{ status, at: new Date(), by: 'demo-seed' }]
      });
      createdOrders++;
    }
  }

  let createdConversations = 0;
  for (let i = 0; i < 12; i++) {
    const user = users[i % users.length];
    if (await SupportConversation.exists({ user: user._id, synthetic: true })) continue;
    const answered = i % 3 === 1;
    const messages = [{ from: 'customer', text: sampleQuestions[i % sampleQuestions.length], at: new Date(Date.now() - (i + 2) * 3600000) }];
    if (answered) messages.push({ from: 'admin', text: sampleReplies[i % sampleReplies.length], adminName: 'مدیر نمونه', at: new Date(Date.now() - (i + 1) * 3600000) });
    await SupportConversation.create({
      user: user._id, synthetic: true, status: answered ? 'answered' : 'waiting_admin',
      handoff: true, unreadAdmin: answered ? 0 : 1, unreadCustomer: answered ? 1 : 0,
      lastMessageAt: messages[messages.length - 1].at, messages
    });
    createdConversations++;
  }

  console.log('✔ داده‌های آزمایشی با موفقیت اضافه شدند (بدون حذف داده‌های موجود).');
  console.log(`مشتریان جدید: ${createdUsers} | سفارش‌های جدید: ${createdOrders} | مکالمه‌های جدید: ${createdConversations}`);
  console.log('حساب‌های نمایشی: شماره‌ها از 09990000100 به بعد؛ رمز یکسان: Demo@12345');
  console.log('هشدار: این حساب‌ها و تمام داده‌هایشان ساختگی‌اند و برای محیط عملیاتی/مشتری واقعی نیستند.');
} finally {
  await mongoose.disconnect();
}
