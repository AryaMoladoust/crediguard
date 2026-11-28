import { connectDB } from './db';
import SystemSetting from '@/models/SystemSetting';
import { SITE } from './site';
import { toLatinDigits } from './catalog';

// تنظیمات پایه؛ اگر چیزی ذخیره نشده یا دیتابیس در دسترس نباشد، مقدار پیش‌فرض برمی‌گردد.
export const SETTING_DEFAULTS = { siteName: SITE.name, supportPhone: SITE.phone, showInventoryCount: true, allowRegistration: true };
export const phoneRawOf = (p) => toLatinDigits(p).replace(/[^\d+]/g, '');

export async function getSettings() {
  const s = { ...SETTING_DEFAULTS };
  try {
    await connectDB();
    const d = await SystemSetting.findOne({ key: 'basic' }).lean();
    if (d) {
      if (typeof d.siteName === 'string' && d.siteName.trim()) s.siteName = d.siteName.trim();
      if (typeof d.supportPhone === 'string' && d.supportPhone.trim()) s.supportPhone = d.supportPhone.trim();
      if (typeof d.showInventoryCount === 'boolean') s.showInventoryCount = d.showInventoryCount;
      if (typeof d.allowRegistration === 'boolean') s.allowRegistration = d.allowRegistration;
    }
  } catch (e) { console.error('getSettings:', e?.message); }
  return { ...s, phoneRaw: phoneRawOf(s.supportPhone) || SITE.phoneRaw };
}
