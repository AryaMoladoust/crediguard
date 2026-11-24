export const toman = (n) => Number(n || 0).toLocaleString('fa-IR');
export const money = (n) => `${toman(n)} تومان`;
export const CATEGORIES = [
  { slug: 'mobile', name: 'گوشی موبایل', short: 'موبایل', sub: 'جدیدترین پرچم‌دارها' },
  { slug: 'laptop', name: 'لپ‌تاپ', short: 'لپ‌تاپ', sub: 'برای کار و خلاقیت' },
  { slug: 'headphone', name: 'هدفون و صوتی', short: 'هدفون', sub: 'صدایی فراتر از انتظار' },
  { slug: 'powerbank', name: 'پاور بانک و گجت', short: 'گجت', sub: 'انرژی همراه شما' },
  { slug: 'accessory', name: 'لوازم جانبی', short: 'لوازم جانبی', sub: 'جزئیات کاربردی' }
];
export const catName = (slug) => CATEGORIES.find((c) => c.slug === slug)?.name || 'کالا';
export const ORDER_STATUS = {
  pending: { label: 'در انتظار تأیید', step: 0 },
  confirmed: { label: 'تأیید شده', step: 1 },
  completed: { label: 'تحویل شده', step: 2 },
  cancelled: { label: 'لغو شده', step: -1 }
};
export const METHOD_LABEL = { cash: 'پرداخت نقدی', installment: 'درخواست اقساطی' };
export const discountOf = (p) => (p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
export const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return ''; } };
export const defaultImage = (cat) => `/img/${CATEGORIES.some((c) => c.slug === cat) ? cat : 'product-placeholder'}.svg`;
