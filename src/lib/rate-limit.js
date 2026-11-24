// محدودکننده‌ی ساده‌ی درخواست بر اساس IP (حافظه‌ی هر نمونه‌ی سرور).
// برای ترافیک بالا در Vercel بهتر است از Upstash/Redis استفاده شود.
const g = globalThis;
g._rl ||= new Map();
export function clientIp(req) {
  const xf = req.headers.get('x-forwarded-for');
  return (xf ? xf.split(',')[0].trim() : req.headers.get('x-real-ip')) || 'unknown';
}
export function rateLimit(req, key, limit, windowMs) {
  const id = `${key}:${clientIp(req)}`;
  const now = Date.now();
  const hits = (g._rl.get(id) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) { g._rl.set(id, hits); return false; }
  hits.push(now);
  g._rl.set(id, hits);
  if (g._rl.size > 5000) for (const [k, v] of g._rl) if (!v.length || now - v[v.length - 1] > windowMs) g._rl.delete(k);
  return true;
}
export const tooMany = () => Response.json({ error: 'تعداد درخواست‌ها زیاد است؛ چند دقیقه بعد دوباره تلاش کنید.' }, { status: 429 });
