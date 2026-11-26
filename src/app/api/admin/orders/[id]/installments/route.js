import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { getAdmin, unauthorized, bad } from '@/lib/admin-guard';
export const dynamic = 'force-dynamic';

// ثبت پرداخت یک قسط توسط مدیر (شرط روی خود سند: قسط پرداخت‌شده دوباره ثبت نمی‌شود)
export async function PATCH(req, { params }) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  const { id } = await params;
  let b; try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }
  const no = Number(b?.no);
  if (!mongoose.isValidObjectId(id) || !Number.isInteger(no) || no < 1) return bad('درخواست نامعتبر');
  try {
    await connectDB();
    const r = await Order.updateOne(
      { _id: id, 'installment.schedule': { $elemMatch: { no, status: 'due' } } },
      { $set: { 'installment.schedule.$.status': 'paid', 'installment.schedule.$.paidAt': new Date(), 'installment.schedule.$.paidBy': admin.name || admin.email } }
    );
    if (!r.matchedCount) return bad('قسط پیدا نشد یا قبلاً پرداخت شده است', 409);
    return Response.json({ ok: true });
  } catch (e) { console.error('installment pay:', e); return bad('خطای سرور', 500); }
}
