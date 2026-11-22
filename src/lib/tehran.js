// ایران ساعت تابستانی ندارد؛ آفست ثابت +۰۳:۳۰
const OFFSET = 3.5 * 3600 * 1000;
const DAY = 86400 * 1000;
// شروع امروز (۰۰:۰۰ به وقت تهران) به‌صورت Date
export function startOfTehranDay(now = Date.now()) {
  return new Date(Math.floor((now + OFFSET) / DAY) * DAY - OFFSET);
}
