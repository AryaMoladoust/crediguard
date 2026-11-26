// محدودکننده‌ی درخواست با پنجره‌ی لغزان.
// در صورت تنظیم Upstash، شمارنده بین نمونه‌های Vercel مشترک است؛ در توسعه‌ی محلی از حافظه استفاده می‌شود.
const g = globalThis;
g._rl ||= new Map();

export function clientIp(req) {
  const xf = req.headers.get('x-forwarded-for');
  return (xf ? xf.split(',')[0].trim() : req.headers.get('x-real-ip')) || 'unknown';
}

const LUA = `
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, now - window)
local count = redis.call('ZCARD', KEYS[1])
if count >= limit then return 0 end
local seq = redis.call('INCR', KEYS[1] .. ':seq')
redis.call('ZADD', KEYS[1], now, tostring(now) .. ':' .. tostring(seq))
redis.call('PEXPIRE', KEYS[1], window)
redis.call('PEXPIRE', KEYS[1] .. ':seq', window)
return 1
`;

async function redisLimit(id, limit, windowMs) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EVAL', LUA, '1', `ratelimit:${id}`, String(Date.now()), String(windowMs), String(limit)]),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`Upstash rate-limit failed (${response.status})`);
  const result = await response.json();
  if (typeof result.result !== 'number') throw new Error('Invalid Upstash rate-limit response');
  return result.result === 1;
}

export async function rateLimit(req, key, limit, windowMs) {
  const id = `${key}:${clientIp(req)}`;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await redisLimit(id, limit, windowMs);
    } catch (e) {
      // در صورت تنظیم Redis ولی اختلال آن، fail-closed تا محدودیت امنیتی دور زده نشود.
      console.error('rate limiter Redis error:', e);
      return false;
    }
  }

  const now = Date.now();
  const hits = (g._rl.get(id) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) { g._rl.set(id, hits); return false; }
  hits.push(now);
  g._rl.set(id, hits);
  if (g._rl.size > 5000) {
    for (const [k, v] of g._rl) if (!v.length || now - v[v.length - 1] > windowMs) g._rl.delete(k);
  }
  return true;
}

export const tooMany = () => Response.json({ error: 'تعداد درخواست‌ها زیاد است؛ چند دقیقه بعد دوباره تلاش کنید.' }, { status: 429 });
