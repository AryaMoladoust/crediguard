import { connectDB } from '@/lib/db';
import SupportConversation from '@/models/SupportConversation';
import User from '@/models/User';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { escapeRegex } from '@/lib/paging';
import { migrateLegacyContact } from '@/lib/support-admin';
export const dynamic = 'force-dynamic';
const PAGE = 20;

// فهرست مکالمه‌ها: status=waiting|answered|bot|closed|all ، q (نام/موبایل) ، page
export async function GET(req) {
  if (!(await isAdmin())) return unauthorized();
  const sp = new URL(req.url).searchParams;
  const st = sp.get('status') || 'all';
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
  try {
    await connectDB();
    await migrateLegacyContact().catch((e) => console.error('legacy migrate:', e));
    const filter = {};
    if (st !== 'all') filter.status = { waiting: 'waiting_admin', answered: 'answered', bot: 'bot_answered', closed: 'closed' }[st] || 'waiting_admin';
    const q = (sp.get('q') || '').trim().slice(0, 60);
    if (q) {
      const re = new RegExp(escapeRegex(q), 'i');
      const users = await User.find({ $or: [{ name: re }, { phone: re }] }).select('_id').limit(200).lean();
      filter.$or = [{ user: { $in: users.map((u) => u._id) } }, { 'guest.name': re }, { 'guest.phone': re }];
    }
    const [items, total, counts] = await Promise.all([
      SupportConversation.find(filter).sort({ lastMessageAt: -1 }).skip((page - 1) * PAGE).limit(PAGE).populate('user', 'name phone').lean(),
      SupportConversation.countDocuments(filter),
      SupportConversation.aggregate([{ $group: { _id: '$status', n: { $sum: 1 }, unread: { $sum: '$unreadAdmin' } } }])
    ]);
    const by = Object.fromEntries(counts.map((c) => [c._id, c]));
    return Response.json({
      items: items.map((c) => { const last = c.messages[c.messages.length - 1]; return { id: String(c._id), name: c.user?.name || c.guest?.name || '—', phone: c.user?.phone || c.guest?.phone || '', guest: !c.user, status: c.status, handoff: c.handoff, unread: c.unreadAdmin, last: last ? { from: last.from, text: last.text.slice(0, 120) } : null, lastMessageAt: c.lastMessageAt, count: c.messages.length }; }),
      total, page, pageSize: PAGE, pages: Math.max(1, Math.ceil(total / PAGE)),
      summary: { waiting: by.waiting_admin?.n || 0, answered: by.answered?.n || 0, bot: by.bot_answered?.n || 0, closed: by.closed?.n || 0, unread: Object.values(by).reduce((s, c) => s + (c.unread || 0), 0) }
    });
  } catch (e) { console.error('admin support list:', e); return bad('خطای سرور', 500); }
}
