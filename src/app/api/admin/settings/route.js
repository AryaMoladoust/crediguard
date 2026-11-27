import { connectDB } from '@/lib/db';
import { getAdmin, unauthorized, forbidden, bad } from '@/lib/admin-guard';
import SystemSetting from '@/models/SystemSetting';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const defaults = {
  general: { siteName: 'موبایلر و اعتبار یار', supportPhone: '', maintenanceMode: false, allowRegistration: true },
  frontend: { storeEnabled: true, creditEnabled: true, showInventoryCount: true, enableNotifications: true, productsPerPage: 12 },
  backend: { rateLimitEnabled: true, auditLogEnabled: true, sessionMaxAgeHours: 24, allowDemoPayments: true },
  access: {
    operator: ['dashboard.read','orders.read','orders.update','inventory.read','inventory.update','customers.read'],
    finance: ['dashboard.read','finance.read','installments.read','installments.update','customers.read'],
    support: ['dashboard.read','customers.read','messages.read','messages.reply'],
  },
};
const shape = d => ({ general: { ...defaults.general, ...(d?.general || {}) }, frontend: { ...defaults.frontend, ...(d?.frontend || {}) }, backend: { ...defaults.backend, ...(d?.backend || {}) }, access: { ...defaults.access, ...(d?.access || {}) }, updatedAt: d?.updatedAt || null, updatedBy: d?.updatedBy || '' });
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  try {
    await connectDB();
    const doc = await SystemSetting.findOne({ key: 'main' }).lean();
    return Response.json({ settings: shape(doc), permissions: { canEdit: admin.role === 'owner' }, runtime: { databaseConfigured: !!process.env.MONGODB_URI, sessionSecretConfigured: !!process.env.SESSION_SECRET, paymentMode: 'simulator' } });
  } catch (e) { console.error('settings GET:', e); return bad('دریافت تنظیمات از پایگاه داده ناموفق بود', 500); }
}
export async function PUT(req) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  if (admin.role !== 'owner') return forbidden();
  let body;
  try { body = await req.json(); } catch { return bad('درخواست نامعتبر است'); }
  const clean = {};
  for (const group of ['general','frontend','backend']) {
    if (!body?.[group] || typeof body[group] !== 'object' || Array.isArray(body[group])) return bad(`بخش ${group} نامعتبر است`);
    clean[group] = body[group];
  }
  if (!body?.access || typeof body.access !== 'object' || Array.isArray(body.access)) return bad('تنظیمات دسترسی نامعتبر است');
  const allowed = new Set(['dashboard.read','orders.read','orders.update','inventory.read','inventory.update','customers.read','finance.read','installments.read','installments.update','messages.read','messages.reply']);
  clean.access = {};
  for (const role of ['operator','finance','support']) {
    const list = Array.isArray(body.access[role]) ? body.access[role] : [];
    clean.access[role] = [...new Set(list.filter(x => allowed.has(x)))];
  }
  const g = clean.general, f = clean.frontend, b = clean.backend;
  if (String(g.siteName || '').trim().length < 2 || String(g.siteName).length > 80) return bad('نام سامانه باید بین ۲ تا ۸۰ نویسه باشد');
  if (!Number.isInteger(Number(f.productsPerPage)) || Number(f.productsPerPage) < 4 || Number(f.productsPerPage) > 60) return bad('تعداد محصولات در صفحه باید بین ۴ تا ۶۰ باشد');
  if (!Number.isInteger(Number(b.sessionMaxAgeHours)) || Number(b.sessionMaxAgeHours) < 1 || Number(b.sessionMaxAgeHours) > 720) return bad('مدت نشست باید بین ۱ تا ۷۲۰ ساعت باشد');
  try {
    await connectDB();
    const doc = await SystemSetting.findOneAndUpdate({ key: 'main' }, { $set: { ...clean, updatedBy: admin.email } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    return Response.json({ ok: true, settings: shape(doc) });
  } catch (e) { console.error('settings PUT:', e); return bad('ذخیره تنظیمات ناموفق بود', 500); }
}
