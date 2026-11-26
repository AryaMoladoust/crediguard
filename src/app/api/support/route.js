import { connectDB } from '@/lib/db';
import SupportConversation from '@/models/SupportConversation';
import { getUser } from '@/lib/user-session';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import { customerCredit } from '@/lib/customer-credit';
import { answer } from '@/lib/support-bot';
import { runAssessmentOnly } from '@/lib/credit-lookup';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const err = (error, status = 400) => Response.json({ error }, { status });
const MAX_MESSAGES = 400;
const shape = (c) => c && ({ id: String(c._id), status: c.status, handoff: c.handoff, unreadCustomer: c.unreadCustomer, messages: c.messages.map((m) => ({ id: String(m._id), from: m.from, text: m.text, adminName: m.from === 'admin' ? 'پشتیبانی' : undefined, at: m.at })) });

// مکالمه‌ی جاری مشتری (فقط مکالمه‌های خودش). خواندن، پیام‌های خوانده‌نشده را صفر می‌کند.
export async function GET() {
  const u = await getUser();
  if (!u) return err('وارد حساب شوید', 401);
  await connectDB();
  const c = await SupportConversation.findOneAndUpdate({ user: u.id, status: { $ne: 'closed' } }, { $set: { unreadCustomer: 0 } }, { sort: { lastMessageAt: -1 }, new: true }).lean();
  return Response.json({ conversation: shape(c) });
}

export async function POST(req) {
  if (!(await rateLimit(req, 'support', 30, 10 * 60_000))) return tooMany();
  const u = await getUser();
  if (!u) return err('برای گفتگو با پشتیبانی وارد حساب شوید', 401);
  let b; try { b = await req.json(); } catch { return err('درخواست نامعتبر'); }
  const text = String(b?.text ?? '').trim();
  const wantHuman = b?.action === 'handoff';
  if (!wantHuman && (text.length < 2 || text.length > 1000)) return err('پیام باید بین ۲ تا ۱۰۰۰ کاراکتر باشد');
  try {
    await connectDB();
    let c = await SupportConversation.findOne({ user: u.id, status: { $ne: 'closed' } }).sort({ lastMessageAt: -1 });
    if (!c) c = new SupportConversation({ user: u.id, messages: [] });
    if (c.messages.length >= MAX_MESSAGES) return err('این مکالمه به سقف پیام رسیده؛ لطفاً مکالمه‌ی جدید با پشتیبانی شروع کنید', 409);
    const now = new Date();
    if (text) c.messages.push({ from: 'customer', text, at: now });
    c.lastMessageAt = now;
    c.unreadAdmin += 1;

    if (c.handoff && c.status !== 'closed' && !wantHuman) {
      c.status = 'waiting_admin'; // انسان درگیر است؛ بات دخالت نمی‌کند
    } else if (wantHuman) {
      c.handoff = true; c.status = 'waiting_admin';
      c.messages.push({ from: 'bot', intent: 'human', text: 'مکالمه به پشتیبان انسانی ارجاع شد. هر زمان پاسخ بدهد همین‌جا می‌بینید.', at: new Date() });
    } else {
      const ctx = await customerCredit(u, { assess: false });
      ctx.assessment = ctx.ready ? await runAssessmentOnly(u.id) : null;
      ctx.user = u;
      const r = answer(text, ctx);
      c.messages.push({ from: 'bot', intent: r.intent, text: r.text, at: new Date() });
      if (r.handoff) { c.handoff = true; c.status = 'waiting_admin'; } else c.status = 'bot_answered';
    }
    await c.save();
    return Response.json({ conversation: shape(c.toObject()) }, { status: 201 });
  } catch (e) { console.error('support POST:', e); return err('ارسال پیام انجام نشد', 500); }
}
