// دسته‌بندی‌های مشترک فروشگاه و پنل
export const CATEGORY_SLUGS = ['mobile', 'laptop', 'headphone', 'powerbank', 'accessory'];

export const toLatinDigits = (s) =>
  String(s ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

// عدد صحیح در بازه؛ در غیر این صورت null
export function toInt(v, min, max) {
  const n = typeof v === 'string' ? Number(toLatinDigits(v).trim()) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

const DEFAULT_IMG = /^\/img\/[a-z-]+\.svg$/;
// گالری تصاویر؛ برای کالاهای قدیمی که فقط image دارند همان یک تصویر برمی‌گردد
export const galleryOf = (p) => {
  const list = Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : [];
  return list.filter((u) => u && !DEFAULT_IMG.test(u));
};

// فهرست تصاویر ورودی: حداکثر ۸ مورد، تکراری حذف می‌شود؛ نامعتبر = null
export function cleanImages(v) {
  if (v === undefined || v === null || v === '') return [];
  if (!Array.isArray(v) || v.length > 8) return null;
  const out = [];
  for (const x of v) { const c = cleanImage(x); if (c === null) return null; if (c && !out.includes(c)) out.push(c); }
  return out;
}

export const shape = (p) => ({
  id: String(p._id),
  sku: p.sku || String(p.slug || '').toUpperCase(),
  name: p.name,
  category: p.category,
  brand: p.brand || '—',
  price: p.price,
  stock: p.stock ?? 0,
  minStock: p.minStock ?? 5,
  colors: p.colors || [],
  colorHex: p.colorHex || '',
  isOffer: !!p.isOffer,
  sold: p.sold ?? 0,
  image: p.image || '',
  images: galleryOf(p),
  slug: p.slug || '',
  oldPrice: p.oldPrice || 0,
  description: p.description || ''
});

// آدرس تصویر: مسیر داخل پروژه (/img/...) یا آدرس https؛ خالی = تصویر پیش‌فرض دسته
export function cleanImage(v) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (s.length > 500) return null;
  if (/^\/(?!\/)[^\s]*$/.test(s) || /^https:\/\/[^\s]+$/.test(s)) return s;
  return null;
}
export const cleanHex = (v) => { const s = String(v ?? '').trim(); return !s ? '' : /^#[0-9a-fA-F]{6}$/.test(s) ? s : null; };
