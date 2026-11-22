import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import ProductImage from '@/models/ProductImage';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// نمایش عمومی تصویر کالا برای فروشگاه و پنل
export async function GET(_req, { params }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return new Response('Not found', { status: 404 });
  try {
    await connectDB();
    const doc = await ProductImage.findById(id);
    if (!doc) return new Response('Not found', { status: 404 });
    const body = Buffer.from(doc.data);
    return new Response(body, {
      headers: {
        'Content-Type': doc.contentType,
        'Content-Length': String(body.length),
        // هر آپلود شناسه‌ی جدید دارد، پس کش طولانی امن است
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'"
      }
    });
  } catch (e) {
    console.error('image GET:', e);
    return new Response('Server error', { status: 500 });
  }
}
