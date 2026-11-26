import ContactMessage from '@/models/ContactMessage';
import SupportConversation from '@/models/SupportConversation';
// پیام‌های قدیمیِ فرم تماس (قبل از سیستم مکالمه) یک‌بار به مکالمه تبدیل می‌شوند تا مدیر بتواند پاسخ دهد
export async function migrateLegacyContact() {
  const old = await ContactMessage.find({ migrated: { $ne: true } }).limit(500).lean();
  for (const m of old) {
    await SupportConversation.create({ guest: { name: m.name, phone: m.phone || undefined }, status: 'waiting_admin', handoff: true, unreadAdmin: m.read ? 0 : 1, lastMessageAt: m.createdAt, createdAt: m.createdAt,
      messages: [{ from: 'customer', text: m.email ? `${m.message}\n\n(ایمیل: ${m.email})` : m.message, at: m.createdAt }] });
    await ContactMessage.updateOne({ _id: m._id }, { migrated: true });
  }
}
