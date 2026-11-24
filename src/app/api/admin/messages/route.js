import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  await connectDB();
  const list = await ContactMessage.find().sort({ createdAt: -1 }).limit(200).lean();
  return Response.json(list.map((m) => ({ id: String(m._id), name: m.name, phone: m.phone || '', email: m.email || '', message: m.message, read: !!m.read, createdAt: m.createdAt })));
}
export async function PATCH(req) {
  if (!(await isAdmin())) return unauthorized();
  let b; try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }
  if (!mongoose.isValidObjectId(b?.id)) return bad('شناسه نامعتبر');
  await connectDB();
  await ContactMessage.updateOne({ _id: b.id }, { read: !!b.read });
  return Response.json({ ok: true });
}
export async function DELETE(req) {
  if (!(await isAdmin())) return unauthorized();
  const id = new URL(req.url).searchParams.get('id');
  if (!mongoose.isValidObjectId(id)) return bad('شناسه نامعتبر');
  await connectDB();
  await ContactMessage.deleteOne({ _id: id });
  return Response.json({ ok: true });
}
