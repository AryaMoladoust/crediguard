'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Banknote } from 'lucide-react';
import { useStore } from './store';
import SmartImg from './SmartImg';
import { SITE } from '@/lib/site';

const DRAFT = 'mb_checkout'; // پیش‌نویس فرم در sessionStorage تا با رفرش/برگشت پاک نشود

export default function CheckoutForm() {
  const { ready, cart, total, clear } = useStore();
  const router = useRouter();
  const [f, setF] = useState({ name: '', phone: '', address: '', note: '' });
  const [method, setMethod] = useState('cash');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => { // پر کردن خودکار از حساب کاربری
    fetch('/api/auth/me').then((r) => r.json()).then(({ user }) => { if (user) { setLoggedIn(true); setF((o) => ({ ...o, name: o.name || user.name, phone: o.phone || user.phone, address: o.address || user.address })); } }).catch(() => {});
  }, []);

  useEffect(() => { // بازیابی پیش‌نویس (قبل از افکت ذخیره تعریف شده است)
    try { const d = JSON.parse(sessionStorage.getItem(DRAFT)); if (d) { setF((o) => ({ ...o, ...d.f })); if (d.method === 'cash' || d.method === 'installment') setMethod(d.method); } } catch {}
  }, []);
  useEffect(() => { try { sessionStorage.setItem(DRAFT, JSON.stringify({ f, method })); } catch {} }, [f, method]);

  if (!ready) return <div className="wrap py-16 text-center text-ink-500">در حال بارگذاری...</div>;
  if (!cart.length) return <div className="wrap py-16"><div className="card mx-auto max-w-md p-10 text-center"><h1 className="text-xl">سبد خرید شما خالی است</h1><Link href="/products" className="btn btn-primary mt-5">رفتن به فروشگاه</Link></div></div>;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: { name: f.name, phone: f.phone, address: f.address }, note: f.note, method, items: cart.map((x) => ({ productId: x.id, qty: x.qty })) }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'ثبت سفارش انجام نشد');
      // در خرید نقدی، سبد تا تأیید موفق پرداخت حفظ می‌شود؛ در اقساطی ثبت درخواست کافی است.
      if (method === 'installment') { clear(); try { sessionStorage.removeItem(DRAFT); } catch {} }
      router.push(d.payUrl || `/order/success?code=${d.code}&method=${method}`);
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <div className="wrap py-8">
      <h1 className="text-2xl sm:text-3xl">تکمیل سفارش</h1>
      {!loggedIn && <p className="mt-2 text-sm text-ink-500">حساب دارید؟ <Link href="/account/login" className="font-bold text-brand-600">وارد شوید</Link> تا اطلاعات و سفارش‌هایتان ذخیره شود (ورود اجباری نیست).</p>}
      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="card space-y-4 p-5 sm:p-6">
            <h2 className="text-lg">اطلاعات تحویل</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">نام و نام خانوادگی<input className="input" required minLength={2} maxLength={80} autoComplete="name" value={f.name} onChange={set('name')} placeholder="مثلاً سارا احمدی" /></label>
              <label className="field">شماره موبایل<input className="input" dir="ltr" style={{ textAlign: 'right' }} required inputMode="numeric" autoComplete="tel" pattern="[0-9۰-۹]{11}" title="شماره ۱۱ رقمی که با ۰۹ شروع می‌شود" value={f.phone} onChange={set('phone')} placeholder="09123456789" /></label>
            </div>
            <label className="field">آدرس کامل تحویل<textarea className="input" required minLength={5} maxLength={500} rows={3} autoComplete="street-address" value={f.address} onChange={set('address')} placeholder="استان، شهر، خیابان، پلاک، واحد، کد پستی" /></label>
            <label className="field">توضیحات سفارش (اختیاری)<textarea className="input" maxLength={500} rows={2} value={f.note} onChange={set('note')} placeholder="مثلاً ساعت مناسب تماس" /></label>
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-lg">روش پرداخت</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[['cash', Banknote, 'پرداخت نقدی', 'پرداخت آنلاین در درگاه؛ بعد از پرداخت موفق، سفارش خودکار تأیید می‌شود'], ['installment', CreditCard, 'درخواست خرید اقساطی', 'پس از بررسی اعتبار، با شما تماس می‌گیریم']].map(([v, I, t, s]) => (
                <label key={v} className={`flex cursor-pointer gap-3 rounded-2xl p-4 ring-2 transition ${method === v ? 'bg-brand-50 ring-brand' : 'ring-ink-100 hover:ring-ink-200'}`}>
                  <input type="radio" name="method" className="mt-1 accent-brand" checked={method === v} onChange={() => setMethod(v)} />
                  <span><b className="flex items-center gap-1.5 text-sm"><I size={17} className="text-brand" />{t}</b><small className="mt-1 block leading-6 text-ink-500">{s}</small></span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-500">درگاه پرداخت در این نسخه شبیه‌ساز است و به بانک واقعی وصل نیست.</p>
          </section>
        </div>
        <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <h2 className="text-lg">سفارش شما</h2>
          <ul className="max-h-60 space-y-3 overflow-y-auto">{cart.map((x) => <li key={x.id} className="flex items-center gap-3"><SmartImg src={x.image} alt="" category={x.category} className="size-12 shrink-0 rounded-lg bg-ink-50 object-contain p-1" /><span className="min-w-0 flex-1 text-xs leading-5"><b className="line-clamp-1">{x.name}</b><span className="text-ink-500">{x.qty.toLocaleString('fa-IR')} × {x.price.toLocaleString('fa-IR')}</span></span></li>)}</ul>
          <div className="flex justify-between border-t border-ink-100 pt-4 text-sm"><span className="text-ink-500">ارسال</span><b>{total >= SITE.freeShipping ? 'رایگان' : 'پس از ثبت اعلام می‌شود'}</b></div>
          <div className="flex justify-between"><span className="font-bold">مبلغ کل</span><b className="text-lg">{total.toLocaleString('fa-IR')} تومان</b></div>
          {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}
          <button className="btn btn-primary w-full !min-h-12" disabled={busy}>{busy ? 'در حال ثبت سفارش...' : method === 'cash' ? 'ثبت سفارش و رفتن به درگاه پرداخت' : 'ثبت نهایی سفارش'}</button>
        </aside>
      </form>
    </div>
  );
}
