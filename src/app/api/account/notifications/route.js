import { connectDB } from '@/lib/db';
import { getUser } from '@/lib/user-session';
import SupportConversation from '@/models/SupportConversation';
import Notification from '@/models/Notification';
import { syncInstallmentReminders } from '@/lib/installment-reminders';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const error = (message, status = 400) => Response.json({ error: message }, { status });

// اعلان‌های اقساط و پاسخ‌های پشتیبانی از داده‌های ذخیره‌شده در MongoDB ساخته می‌شوند.
export async function GET() {
  const user = await getUser();
  if (!user) return error('برای مشاهده اعلان‌ها وارد حساب شوید', 401);
  try {
    await connectDB();
    await syncInstallmentReminders(user.id);
    const [conversations, installmentNotifications] = await Promise.all([SupportConversation.find({ user: user.id })
      .sort({ lastMessageAt: -1 }).limit(50).select('status unreadCustomer lastMessageAt messages').lean(),
      Notification.find({ user: user.id }).sort({ createdAt: -1 }).limit(50).lean()]);

    const notifications = installmentNotifications.map((item) => ({ id: String(item._id), type: item.type, title: item.title, message: item.message, link: item.link, createdAt: item.createdAt, unread: !item.readAt }));
    for (const conversation of conversations) {
      for (const message of conversation.messages || []) {
        if (message.from !== 'admin') continue;
        notifications.push({
          id: String(message._id),
          conversationId: String(conversation._id),
          type: 'support_reply',
          title: 'پاسخ پشتیبانی',
          message: message.text,
          createdAt: message.at,
          unread: (conversation.unreadCustomer || 0) > 0
        });
      }
    }
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return Response.json({
      notifications: notifications.slice(0, 50),
      unread: conversations.reduce((sum, item) => sum + (item.unreadCustomer || 0), 0) + installmentNotifications.filter((item) => !item.readAt).length
    });
  } catch (e) {
    console.error('account notifications GET:', e);
    return error('دریافت اعلان‌ها انجام نشد', 500);
  }
}

export async function PATCH() {
  const user = await getUser();
  if (!user) return error('برای مشاهده اعلان‌ها وارد حساب شوید', 401);
  try {
    await connectDB();
    await Promise.all([
      SupportConversation.updateMany({ user: user.id, unreadCustomer: { $gt: 0 } }, { $set: { unreadCustomer: 0 } }),
      Notification.updateMany({ user: user.id, readAt: null }, { $set: { readAt: new Date() } })
    ]);
    return Response.json({ ok: true });
  } catch (e) {
    console.error('account notifications PATCH:', e);
    return error('به‌روزرسانی وضعیت اعلان‌ها انجام نشد', 500);
  }
}
