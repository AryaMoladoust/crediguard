import { connectDB } from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';
import { toLatinDigits } from '@/lib/catalog';
import { rateLimit, tooMany } from '@/lib/rate-limit';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!rateLimit(req, 'contact', 5, 60 * 60_000)) return tooMany();
  let b; try { b = await req.json(); } catch { return Response.json({ error: 'درخواست نامعتبر' }, { status: 400 }); }
  if (b?.website) return Response.json({ ok: true }); // honeypot ضد ربات
  const name = String(b?.name ?? '').trim();
  const phone = toLatinDigits(b?.phone).replace(/\s|-/g, '');
  const email = String(b?.email ?? '').trim();
  const message = String(b?.message ?? '').trim();
  const err = (m) => Response.json({ error: m }, { status: 400 });
  if (name.length < 2 || name.length > 80) return err('نام را وارد کنید');
  if (!phone && !email) return err('شماره موبایل یا ایمیل را برای پاسخ‌گویی وارد کنید');
  if (phone && !/^09\d{9}$/.test(phone)) return err('شماره موبایل نامعتبر است');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('ایمیل نامعتبر است');
  if (message.length < 10 || message.length > 2000) return err('پیام باید بین ۱۰ تا ۲۰۰۰ کاراکتر باشد');
  await connectDB();
  await ContactMessage.create({ name, phone, email, message });
  return Response.json({ ok: true }, { status: 201 });
}
