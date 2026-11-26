'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Headset, MessageCircle, RefreshCw } from 'lucide-react';
import AccountNav from '@/components/AccountNav';

const fa = (value) => Number(value || 0).toLocaleString('fa-IR');
const date = (value) => new Date(value).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });

export default function AccountNotificationsPage() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/account/notifications', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'دریافت اعلان‌ها ناموفق بود');
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead() {
    try {
      const response = await fetch('/api/account/notifications', { method: 'PATCH' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'عملیات ناموفق بود');
      setUnread(0);
      setItems((old) => old.map((item) => ({ ...item, unread: false })));
    } catch (e) { setError(e.message); }
  }

  return <div className="wrap py-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl sm:text-3xl">اعلان‌های من</h1><p className="mt-2 text-sm text-ink-500">پاسخ‌های پشتیبانی و پیام‌های مرتبط با حساب شما</p></div>
      <div className="flex gap-2">
        <button className="btn btn-line" onClick={load} type="button"><RefreshCw size={16}/>بروزرسانی</button>
        <button className="btn btn-primary" onClick={markRead} type="button" disabled={!unread}><CheckCheck size={16}/>خواندن همه</button>
      </div>
    </div>
    <AccountNav active="/account/notifications"/>
    <section className="card mt-6 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">اعلان‌های پشتیبانی</h2><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand">{fa(unread)} خوانده‌نشده</span></div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="py-10 text-center text-sm text-ink-500">در حال دریافت اعلان‌ها...</p> : items.length ? <div className="divide-y divide-ink-100">
        {items.map((item) => <article key={item.id} className="flex gap-3 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand"><Headset size={18}/></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><b className="text-sm">{item.title}</b>{item.unread && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">جدید</span>}</div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-7 text-ink-700">{item.message}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><time className="text-xs text-ink-400">{date(item.createdAt)}</time><Link className="btn btn-line !min-h-8 !px-3 text-xs" href="/account/support"><MessageCircle size={14}/>ادامه گفتگو</Link></div>
          </div>
        </article>)}
      </div> : <div className="grid place-items-center gap-2 py-12 text-center"><Bell size={34} className="text-ink-300"/><b className="text-sm">اعلانی ندارید</b><p className="text-xs text-ink-500">پاسخ‌های پشتیبانی در این بخش نمایش داده می‌شوند.</p><Link className="btn btn-primary mt-2" href="/account/support">رفتن به پشتیبانی</Link></div>}
    </section>
  </div>;
}
