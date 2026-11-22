import mongoose from 'mongoose';
import ProductImage from '@/models/ProductImage';

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // سقف Vercel برای بدنه‌ی درخواست ≈ ۴٫۵MB است

// تشخیص نوع واقعی فایل از روی بایت‌های ابتدایی (به Content-Type کلاینت اعتماد نمی‌کنیم).
// SVG عمداً مجاز نیست چون می‌تواند اسکریپت داشته باشد.
export function sniffImage(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('latin1') === 'GIF8') return 'image/gif';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

// اگر آدرس تصویر از نوع آپلودی باشد، شناسه‌اش را برمی‌گرداند
export function uploadedImageId(url) {
  const m = /^\/api\/images\/([0-9a-fA-F]{24})$/.exec(String(url || ''));
  return m && mongoose.isValidObjectId(m[1]) ? m[1] : null;
}

// حذف تصویر آپلودی بی‌صاحب (خطا نباید عملیات اصلی را خراب کند)
export async function deleteUploadedImage(url) {
  const id = uploadedImageId(url);
  if (!id) return;
  try { await ProductImage.deleteOne({ _id: id }); } catch (e) { console.error('delete image:', e); }
}
