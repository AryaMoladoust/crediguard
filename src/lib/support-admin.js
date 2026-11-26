import ContactMessage from '@/models/ContactMessage';
import SupportConversation from '@/models/SupportConversation';

// پیام‌های قدیمی فرم تماس را به مکالمه تبدیل می‌کند.
// legacyContactId در SupportConversation یکتا است؛ بنابراین اجرای هم‌زمان
// این تابع نمی‌تواند برای یک پیام قدیمی دو مکالمه بسازد.
export async function migrateLegacyContact() {
  const old = await ContactMessage.find({ migrated: { $ne: true } })
    .sort({ createdAt: 1 })
    .limit(500)
    .lean();

  let migrated = 0;
  for (const m of old) {
    try {
      await SupportConversation.create({
        legacyContactId: m._id,
        guest: { name: m.name, phone: m.phone || undefined },
        status: 'waiting_admin',
        handoff: true,
        unreadAdmin: m.read ? 0 : 1,
        lastMessageAt: m.createdAt,
        createdAt: m.createdAt,
        messages: [{
          from: 'customer',
          text: m.email ? `${m.message}\n\n(ایمیل: ${m.email})` : m.message,
          at: m.createdAt
        }]
      });
    } catch (error) {
      // duplicate key یعنی درخواست هم‌زمان قبلاً مکالمه را ساخته است.
      if (error?.code !== 11000) throw error;
    }

    // فقط پس از ایجاد مکالمه یا اطمینان از وجود نسخه‌ی قبلی، پیام مبدأ علامت می‌خورد.
    await ContactMessage.updateOne({ _id: m._id, migrated: { $ne: true } }, { $set: { migrated: true } });
    migrated += 1;
  }
  return { migrated };
}
