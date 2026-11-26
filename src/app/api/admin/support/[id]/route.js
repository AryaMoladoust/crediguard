import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import SupportConversation from '@/models/SupportConversation';
import { getAdmin, unauthorized, bad } from '@/lib/admin-guard';
export const dynamic = 'force-dynamic';

const shape = (c) => ({
  id: String(c._id), status: c.status, handoff: c.handoff, createdAt: c.createdAt,
  customer: { name: c.user?.name || c.guest?.name || '—', phone: c.user?.phone || c.guest?.phone || '', guest: !c.user, userId: c.user?._id ? String(c.user._id) : null },
  messages: c.messages.map((m) => ({ id: String(m._id), from: m.from, text: m.text, adminName: m.adminName || '', intent: m.intent || '', at: m.at }))
});

export async function GET(_req, { params }) {
  if (!(await getAdmin())) return unauthorized();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad('شناسه نامعتبر');
  try {
    await connectDB();
    const c = await SupportConversation.findByIdAndUpdate(id, { $set: { unreadAdmin: 0 } }, { new: true }).populate('user', 'name phone').lean();
    if (!c) return bad('مکالمه پیدا نشد', 404);
    return Response.json(shape(c));
  } catch (e) { console.error('admin support GET:', e); return bad('خطای سرور', 500); }
}

// پاسخ مدیر: پیام در مکالمه‌ی مشتری ذخیره می‌شود؛ مکالمه «پاسخ داده‌شده» و از این پس انسانی است
export async function POST(req, { params }) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  const { id } = await params;
  let b; try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }
  const text = String(b?.text ?? '').trim();
  if (!mongoose.isValidObjectId(id)) return bad('شناسه نامعتبر');
  if (text.length < 1 || text.length > 2000) return bad('پاسخ باید بین ۱ تا ۲۰۰۰ کاراکتر باشد');
  try {
    await connectDB();
    const now = new Date();
    const c = await SupportConversation.findByIdAndUpdate(id,
      { $push: { messages: { from: 'admin', text, adminName: admin.name || admin.email, at: now } }, $set: { status: 'answered', handoff: true, lastMessageAt: now, unreadAdmin: 0 }, $inc: { unreadCustomer: 1 } },
      { new: true }).populate('user', 'name phone').lean();
    if (!c) return bad('مکالمه پیدا نشد', 404);
    return Response.json(shape(c), { status: 201 });
  } catch (e) { console.error('admin support POST:', e); return bad('ارسال پاسخ انجام نشد', 500); }
}

export async function PATCH(req, { params }) {
  if (!(await getAdmin())) return unauthorized();
  const { id } = await params;
  let b; try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }
  if (!mongoose.isValidObjectId(id) || !['closed', 'waiting_admin'].includes(b?.status)) return bad('درخواست نامعتبر');
  await connectDB();
  const r = await SupportConversation.updateOne({ _id: id }, { $set: { status: b.status, ...(b.status === 'waiting_admin' && { handoff: true }) } });
  return r.matchedCount ? Response.json({ ok: true }) : bad('مکالمه پیدا نشد', 404);
}
