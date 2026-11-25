// ابزارهای صفحه‌بندی سمت سرور
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const int = (v, def, min, max) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
// page از ۱ شروع می‌شود؛ pageSize پیش‌فرض ۲۰ و حداکثر ۱۰۰
export function parsePaging(sp, { size = 20, max = 100 } = {}) {
  return { page: int(sp.get('page'), 1, 1, 1_000_000), pageSize: int(sp.get('pageSize'), size, 1, max) };
}
// صفحه‌ی درخواستی را به بازه‌ی معتبر می‌برد (مثلاً بعد از حذف/لغو و خالی‌شدن آخرین صفحه)
export function pageMeta(total, page, pageSize) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(page, pages);
  return { total, page: p, pageSize, pages, skip: (p - 1) * pageSize };
}
