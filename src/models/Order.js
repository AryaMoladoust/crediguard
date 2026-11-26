import mongoose from 'mongoose';
// آدرس نسبی (نه @/) تا اسکریپت‌های seed هم بتوانند این مدل را مستقیم با node لود کنند
import { ORDER_STATUSES } from '../lib/order-flow.js';
// وضعیت‌هایی که ادمین می‌تواند تنظیم کند (قاعده‌ی انتقال در lib/order-flow.js)
export { ORDER_STATUSES };
// سفارش نقدی تا پرداخت در درگاه در این وضعیت است (در پنل ادمین دیده نمی‌شود)
export const AWAITING_PAYMENT = 'awaiting_payment';
const ALL_STATUSES = [...ORDER_STATUSES, AWAITING_PAYMENT];

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    synthetic: { type: Boolean, default: false },
    code: { type: String, unique: true, sparse: true },
    customer: { name: String, phone: { type: String, index: true }, address: String },
    note: { type: String, maxlength: 500 },
    items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, price: Number, qty: Number }],
    total: Number,
    method: { type: String, enum: ['cash', 'installment'], default: 'cash' },
    status: { type: String, enum: ALL_STATUSES, default: 'pending', index: true },
    payment: { status: { type: String, enum: ['unpaid', 'paid', 'failed'] }, ref: String, paidAt: Date },
    shippedAt: Date,
    // خرید اقساطی: برنامه‌ی درخواستی و (پس از تأیید مدیر) جدول اقساط
    installment: {
      months: Number, downPayment: Number, financed: Number, monthly: Number,
      // پیش‌پرداخت (قسط اول): بعد از تأیید مدیر با درگاه پرداخت می‌شود؛ سفارش قدیمی بدون این فیلد «پرداخت‌شده» حساب می‌شود
      down: { status: { type: String, enum: ['unpaid', 'paid'] }, ref: String, paidAt: Date },
      schedule: [{ _id: false, no: Number, dueDate: Date, amount: Number, status: { type: String, enum: ['due', 'paid'], default: 'due' }, paidAt: Date, paidBy: String, payRef: String }],
      // دفتر پرداخت‌های درگاه (پیش‌پرداخت، پرداخت زودتر، تسویه‌ی همه)
      payments: [{ _id: false, ref: String, kind: { type: String, enum: ['down', 'one', 'all'] }, nos: [Number], amount: Number, at: Date }]
    },
    // نتیجه‌ی اعتبارسنجی لحظه‌ی ثبت (پیشنهاد ایجنت + نتیجه‌ی قوانین)
    credit: { assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditAssessment' }, score: Number, riskLevel: String, limit: Number, recommendation: String, rule: String },
    // سابقه‌ی تغییر وضعیت توسط مدیران (برای صفحه‌ی جزئیات سفارش)
    history: [{ _id: false, status: String, at: Date, by: String }]
  },
  { timestamps: true }
);
export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
