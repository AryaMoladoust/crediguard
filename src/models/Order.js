import mongoose from 'mongoose';
// وضعیت‌هایی که ادمین می‌تواند تنظیم کند
export const ORDER_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
// سفارش نقدی تا پرداخت در درگاه در این وضعیت است (در پنل ادمین دیده نمی‌شود)
export const AWAITING_PAYMENT = 'awaiting_payment';
const ALL_STATUSES = [...ORDER_STATUSES, AWAITING_PAYMENT];

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    code: { type: String, unique: true, sparse: true },
    customer: { name: String, phone: { type: String, index: true }, address: String },
    note: { type: String, maxlength: 500 },
    items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, price: Number, qty: Number }],
    total: Number,
    method: { type: String, enum: ['cash', 'installment'], default: 'cash' },
    status: { type: String, enum: ALL_STATUSES, default: 'pending', index: true },
    payment: { status: { type: String, enum: ['unpaid', 'paid', 'failed'] }, ref: String, paidAt: Date }
  },
  { timestamps: true }
);
export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
