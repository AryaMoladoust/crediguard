import { connectDB } from '@/lib/db';
import ProductImage from '@/models/ProductImage';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { MAX_IMAGE_BYTES, sniffImage } from '@/lib/images';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// آپلود تصویر کالا از سیستم ادمین؛ خروجی: { url: '/api/images/<id>' }
export async function POST(req) {
  if (!(await isAdmin())) return unauthorized();
  let form;
  try { form = await req.formData(); } catch { return bad('درخواست نامعتبر'); }
  const file = form.get('file');
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') return bad('فایلی ارسال نشده است');
  if (file.size > MAX_IMAGE_BYTES) return bad('حجم تصویر باید کمتر از ۳ مگابایت باشد', 413);

  const buf = Buffer.from(await file.arrayBuffer());
  const contentType = sniffImage(buf);
  if (!contentType) return bad('فقط تصویر JPG، PNG، WebP یا GIF مجاز است');

  try {
    await connectDB();
    const doc = await ProductImage.create({ data: buf, contentType, size: buf.length });
    return Response.json({ url: `/api/images/${doc._id}` }, { status: 201 });
  } catch (e) {
    console.error('admin upload:', e);
    return bad('ذخیره‌ی تصویر ناموفق بود', 500);
  }
}
