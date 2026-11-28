import { connectDB } from '@/lib/db';
import { getAdmin, unauthorized, forbidden, bad } from '@/lib/admin-guard';
import { getSettings } from '@/lib/settings';
import SystemSetting from '@/models/SystemSetting';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const pub = (s) => ({ siteName: s.siteName, supportPhone: s.supportPhone, showInventoryCount: s.showInventoryCount, allowRegistration: s.allowRegistration });

// مشاهده‌ی تنظیمات برای هر مدیر واردشده؛ ویرایش فقط برای مدیر کل
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  return Response.json({ settings: pub(await getSettings()), canEdit: admin.role === 'owner' });
}

export async function PUT(req) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  if (admin.role !== 'owner') return forbidden();
  let b; try { b = await req.json(); } catch { return bad('درخواست نامعتبر است'); }
  const siteName = String(b?.siteName ?? '').trim();
  const supportPhone = String(b?.supportPhone ?? '').trim();
  if (siteName.length < 2 || siteName.length > 60) return bad('نام فروشگاه باید بین ۲ تا ۶۰ نویسه باشد');
  if (supportPhone.length < 3 || supportPhone.length > 30 || !/^[0-9۰-۹+\-\s()]+$/.test(supportPhone)) return bad('شماره‌ی پشتیبانی نامعتبر است');
  if (typeof b?.showInventoryCount !== 'boolean' || typeof b?.allowRegistration !== 'boolean') return bad('مقدار گزینه‌ها نامعتبر است');
  try {
    await connectDB();
    await SystemSetting.findOneAndUpdate({ key: 'basic' }, { $set: { siteName, supportPhone, showInventoryCount: b.showInventoryCount, allowRegistration: b.allowRegistration, updatedBy: admin.email } }, { upsert: true, setDefaultsOnInsert: true });
    return Response.json({ ok: true, settings: pub(await getSettings()) });
  } catch (e) { console.error('settings PUT:', e); return bad('ذخیره تنظیمات ناموفق بود', 500); }
}
