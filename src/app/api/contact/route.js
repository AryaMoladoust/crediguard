import { connectDB } from '@/lib/db';
import SupportConversation from '@/models/SupportConversation';
import { toLatinDigits } from '@/lib/catalog';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import { getUser } from '@/lib/user-session';
export const dynamic = 'force-dynamic';

// فرم «تماس با ما»: پیام در همان سیستم مکالمه‌های پشتیبانی ثبت می‌شود تا مدیر بتواند پاسخ دهد.
// با ورود به حساب، پاسخ در «پشتیبانی» حساب دیده می‌شود؛ مهمان پس از ثبت‌نام با همین شمارهٔ تأییدشده به مکالمه وصل می‌شود.
export async function POST(req) {
  if (!(await rateLimit(req, 'contact', 5, 60 * 60_000))) return tooMany();
  let b; try { b = await req.json(); } catch { return Response.json({ error: 'درخواست نامعتبر' }, { status: 400 }); }
  if (b?.website) return Response.json({ ok: true }); // honeypot ضد ربات
  const user = await getUser();
  const name = String(b?.name ?? user?.name ?? '').trim();
  const phone = toLatinDigits(b?.phone ?? user?.phone).replace(/\s|-/g, '');
  const email = String(b?.email ?? '').trim();
  const message = String(b?.message ?? '').trim();
  const err = (m) => Response.json({ error: m }, { status: 400 });
  if (name.length < 2 || name.length > 80) return err('نام را وارد کنید');
  if (!phone && !email) return err('شماره موبایل یا ایمیل را برای پاسخ‌گویی وارد کنید');
  if (phone && !/^09\d{9}$/.test(phone)) return err('شماره موبایل نامعتبر است');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('ایمیل نامعتبر است');
  if (message.length < 10 || message.length > 2000) return err('پیام باید بین ۱۰ تا ۲۰۰۰ کاراکتر باشد');
  await connectDB();
  const now = new Date();
  const text = email && !user ? `${message}\n\n(ایمیل: ${email})` : message;
  await SupportConversation.create({ ...(user ? { user: user.id } : { guest: { name, phone: phone || undefined } }), status: 'waiting_admin', handoff: true, unreadAdmin: 1, lastMessageAt: now, messages: [{ from: 'customer', text, at: now }] });
  return Response.json({ ok: true }, { status: 201 });
}
