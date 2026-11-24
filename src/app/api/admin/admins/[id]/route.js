import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Admin from '@/models/Admin';
import { getAdmin, unauthorized, forbidden, bad } from '@/lib/admin-guard';
import { hashPassword } from '@/lib/password';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function guard() {
  const a = await getAdmin();
  if (!a) return { res: unauthorized() };
  if (a.role !== 'owner') return { res: forbidden() };
  return {};
}

// ویرایش: نام، فعال/غیرفعال، تغییر رمز
export async function PATCH(req, { params }) {
  const g = await guard(); if (g.res) return g.res;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad('شناسه نامعتبر');
  let b;
  try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }
  const $set = {};
  if (b.name !== undefined) { const v = String(b.name).trim(); if (v.length < 2 || v.length > 80) return bad('نام نامعتبر است'); $set.name = v; }
  if (b.active !== undefined) $set.active = !!b.active;
  if (b.password !== undefined) {
    const pw = String(b.password);
    if (pw.length < 8 || pw.length > 100) return bad('رمز عبور باید حداقل ۸ کاراکتر باشد');
    $set.passwordHash = await hashPassword(pw);
  }
  if (!Object.keys($set).length) return bad('چیزی برای ویرایش ارسال نشده');
  try {
    await connectDB();
    const doc = await Admin.findByIdAndUpdate(id, { $set }, { new: true }).lean();
    if (!doc) return bad('مدیر پیدا نشد', 404);
    return Response.json({ ok: true, id: String(doc._id), active: doc.active });
  } catch (e) {
    console.error('admins PATCH:', e);
    return bad('خطای سرور', 500);
  }
}

export async function DELETE(_req, { params }) {
  const g = await guard(); if (g.res) return g.res;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad('شناسه نامعتبر');
  try {
    await connectDB();
    const doc = await Admin.findByIdAndDelete(id).lean();
    return doc ? Response.json({ ok: true }) : bad('مدیر پیدا نشد', 404);
  } catch (e) {
    console.error('admins DELETE:', e);
    return bad('خطای سرور', 500);
  }
}
