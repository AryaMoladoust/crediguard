import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { toLatinDigits } from '@/lib/catalog';
import { rateLimit, tooMany } from '@/lib/rate-limit';
export const dynamic = 'force-dynamic';

// پیگیری سفارش: کد سفارش + شماره موبایل ثبت‌شده
export async function POST(req) {
  if (!rateLimit(req, 'track', 20, 10 * 60_000)) return tooMany();
  let b; try { b = await req.json(); } catch { return Response.json({ error: 'درخواست نامعتبر' }, { status: 400 }); }
  const code = toLatinDigits(b?.code).trim().toUpperCase();
  const phone = toLatinDigits(b?.phone).replace(/\s|-/g, '');
  if (!/^ORD-\d{6}$/.test(code) || !/^09\d{9}$/.test(phone)) return Response.json({ error: 'کد سفارش (مثل ORD-123456) و شماره موبایل را درست وارد کنید' }, { status: 400 });
  await connectDB();
  const o = await Order.findOne({ code, 'customer.phone': phone }).lean();
  if (!o) return Response.json({ error: 'سفارشی با این مشخصات پیدا نشد' }, { status: 404 });
  return Response.json({
    code: o.code, status: o.status, method: o.method, total: o.total, createdAt: o.createdAt, updatedAt: o.updatedAt,
    items: (o.items || []).map((i) => ({ name: i.name, qty: i.qty, price: i.price }))
  });
}
