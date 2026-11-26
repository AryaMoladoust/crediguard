import { connectDB } from '@/lib/db';
import { getUser } from '@/lib/user-session';
import SupportConversation from '@/models/SupportConversation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const error = (message, status = 400) => Response.json({ error: message }, { status });

// اعلان‌های پاسخ پشتیبانی؛ منبع داده همان مکالمه‌های ذخیره‌شده در MongoDB است.
export async function GET() {
  const user = await getUser();
  if (!user) return error('برای مشاهده اعلان‌ها وارد حساب شوید', 401);
  try {
    await connectDB();
    const conversations = await SupportConversation.find({ user: user.id })
      .sort({ lastMessageAt: -1 }).limit(50).select('status unreadCustomer lastMessageAt messages').lean();

    const notifications = [];
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
      unread: conversations.reduce((sum, item) => sum + (item.unreadCustomer || 0), 0)
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
    await SupportConversation.updateMany({ user: user.id, unreadCustomer: { $gt: 0 } }, { $set: { unreadCustomer: 0 } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error('account notifications PATCH:', e);
    return error('به‌روزرسانی وضعیت اعلان‌ها انجام نشد', 500);
  }
}
