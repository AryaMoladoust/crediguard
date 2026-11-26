import { connectDB } from '@/lib/db';
import CreditAssessment from '@/models/CreditAssessment';
import CreditProfile from '@/models/CreditProfile';
import User from '@/models/User';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { escapeRegex } from '@/lib/paging';
export const dynamic = 'force-dynamic';
const PAGE = 20;

// فهرست مشتریان با آخرین تحلیل ایجنت: recommendation=approve|review|reject، risk=low|medium|high|critical، q، page
export async function GET(req) {
  if (!(await isAdmin())) return unauthorized();
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
  try {
    await connectDB();
    const f = { latest: true };
    if (['approve', 'review', 'reject'].includes(sp.get('recommendation'))) f.recommendation = sp.get('recommendation');
    if (['low', 'medium', 'high', 'critical'].includes(sp.get('risk'))) f.riskLevel = sp.get('risk');
    const q = (sp.get('q') || '').trim().slice(0, 60);
    if (q) { const re = new RegExp(escapeRegex(q), 'i'); f.user = { $in: (await User.find({ $or: [{ name: re }, { phone: re }] }).select('_id').limit(300).lean()).map((u) => u._id) }; }
    const [rows, total, agg] = await Promise.all([
      CreditAssessment.find(f).sort({ createdAt: -1 }).skip((page - 1) * PAGE).limit(PAGE).populate('user', 'name phone nationalIdMasked').lean(),
      CreditAssessment.countDocuments(f),
      CreditAssessment.aggregate([{ $match: { latest: true } }, { $group: { _id: '$recommendation', n: { $sum: 1 } } }])
    ]);
    const profiles = await CreditProfile.find({ user: { $in: rows.map((r) => r.user?._id).filter(Boolean) } }).select('user decision').lean();
    const dec = new Map(profiles.map((p) => [String(p.user), p.decision?.status || 'auto']));
    const by = Object.fromEntries(agg.map((a) => [a._id, a.n]));
    return Response.json({
      items: rows.filter((r) => r.user).map((r) => ({ userId: String(r.user._id), name: r.user.name, phone: r.user.phone, nationalId: r.user.nationalIdMasked || '', score: r.score, riskLevel: r.riskLevel, creditLimit: r.creditLimit, recommendation: r.recommendation, decision: dec.get(String(r.user._id)) || 'auto', flags: (r.flags || []).length, at: r.createdAt })),
      total, page, pageSize: PAGE, pages: Math.max(1, Math.ceil(total / PAGE)),
      summary: { approve: by.approve || 0, review: by.review || 0, reject: by.reject || 0, all: (by.approve || 0) + (by.review || 0) + (by.reject || 0) }
    });
  } catch (e) { console.error('admin credit list:', e); return bad('خطای سرور', 500); }
}
