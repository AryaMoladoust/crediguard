import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import CreditAssessment from '@/models/CreditAssessment';
import { getAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { ensureProfile, runAssessment, cleanChanges, applyChanges, summarizeInstallments } from '@/lib/credit-service';
import { generateCreditData } from '@/lib/credit-sim';
import { SIM_NOTICE } from '@/lib/credit-policy';
export const dynamic = 'force-dynamic';

async function detail(userId) {
  const u = await User.findById(userId).select('name phone email nationalIdMasked phoneVerified createdAt').lean();
  if (!u) return null;
  const { profile, assessment } = await runAssessment(userId, 'admin');
  const [history, orders] = await Promise.all([
    CreditAssessment.find({ user: userId }).sort({ createdAt: -1 }).limit(10).select('score riskLevel creditLimit recommendation trigger createdAt latest').lean(),
    Order.find({ user: userId, status: { $ne: 'awaiting_payment' } }).sort({ createdAt: -1 }).limit(30).lean()
  ]);
  return {
    notice: SIM_NOTICE,
    user: { id: String(u._id), name: u.name, phone: u.phone, email: u.email || '', nationalId: u.nationalIdMasked || '', phoneVerified: !!u.phoneVerified, createdAt: u.createdAt },
    profile: { data: profile.data, simVersion: profile.simVersion, decision: profile.decision?.status || 'auto', decisionNote: profile.decision?.note || '', decisionBy: profile.decision?.by || '', decisionAt: profile.decision?.at || null, adjustments: (profile.adjustments || []).slice(-10).reverse() },
    assessment: { score: assessment.score, riskLevel: assessment.riskLevel, creditLimit: assessment.creditLimit, recommendation: assessment.recommendation, summary: assessment.summary, reasons: assessment.reasons, flags: assessment.flags, metrics: assessment.metrics, engine: assessment.engine, at: assessment.createdAt },
    history: history.map((h) => ({ score: h.score, riskLevel: h.riskLevel, creditLimit: h.creditLimit, recommendation: h.recommendation, trigger: h.trigger, at: h.createdAt })),
    orders: orders.map((o) => ({ id: String(o._id), code: o.code, total: o.total, method: o.method, status: o.status, createdAt: o.createdAt, credit: o.credit?.rule ? { rule: o.credit.rule, recommendation: o.credit.recommendation } : null })),
    installments: summarizeInstallments(orders)
  };
}

export async function GET(_req, { params }) {
  if (!(await getAdmin())) return unauthorized();
  const { userId } = await params;
  if (!mongoose.isValidObjectId(userId)) return bad('شناسه نامعتبر');
  try {
    await connectDB();
    const d = await detail(userId);
    return d ? Response.json(d) : bad('مشتری پیدا نشد', 404);
  } catch (e) { console.error('admin credit GET:', e); return bad('خطای سرور', 500); }
}

// action: decide {status: approved|rejected|review|auto, note} | adjust {changes, reason} | reset_sim {reason}
// ایجنت فقط پیشنهاد می‌دهد؛ اعمال محدودیت/تأیید دستی فقط از همین مسیرِ مدیر و با ثبت سابقه انجام می‌شود.
export async function POST(req, { params }) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  const { userId } = await params;
  if (!mongoose.isValidObjectId(userId)) return bad('شناسه نامعتبر');
  let b; try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }
  const by = admin.name || admin.email;
  try {
    await connectDB();
    if (!(await User.exists({ _id: userId }))) return bad('مشتری پیدا نشد', 404);
    const profile = await ensureProfile(userId);
    if (b?.action === 'decide') {
      if (!['approved', 'rejected', 'review', 'auto'].includes(b.status)) return bad('وضعیت نامعتبر');
      const note = String(b.note ?? '').trim().slice(0, 500);
      if (b.status !== 'auto' && note.length < 3) return bad('دلیل تصمیم را بنویسید');
      profile.decision = { status: b.status, by, note, at: new Date() };
      await profile.save();
    } else if (b?.action === 'adjust' || b?.action === 'reset_sim') {
      const reason = String(b.reason ?? '').trim().slice(0, 300);
      if (reason.length < 3) return bad('دلیل تغییر داده‌ی آزمایشی را بنویسید');
      let changes, next;
      if (b.action === 'adjust') {
        const c = cleanChanges(b.changes); if (c.error) return bad(c.error);
        changes = c.changes; next = applyChanges(profile.data, changes);
      } else { next = generateCreditData(String(userId), profile.simVersion); changes = { reset: true }; }
      profile.data = next; profile.markModified('data');
      profile.adjustments.push({ at: new Date(), by, reason, changes });
      await profile.save();
    } else return bad('عملیات نامعتبر');
    return Response.json(await detail(userId));
  } catch (e) { console.error('admin credit POST:', e); return bad('خطای سرور', 500); }
}
