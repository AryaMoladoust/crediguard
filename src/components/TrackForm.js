'use client';
import { useState } from 'react';
import { Check, PackageSearch } from 'lucide-react';
import { ORDER_STATUS, METHOD_LABEL, fmtDate } from '@/lib/format';

const STEPS = ['ثبت سفارش', 'تأیید شده', 'ارسال شده', 'تحویل شده'];

export default function TrackForm({ initialCode = '' }) {
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [o, setO] = useState(null);
  async function go(e) {
    e.preventDefault(); setBusy(true); setErr(''); setO(null);
    try {
      const r = await fetch('/api/orders/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, phone }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'خطا'); setO(d);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  const st = o ? ORDER_STATUS[o.status] || ORDER_STATUS.pending : null;
  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={go} className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <label className="field">کد سفارش<input className="input" dir="ltr" style={{ textAlign: 'right' }} required value={code} onChange={(e) => setCode(e.target.value)} placeholder="ORD-123456" /></label>
        <label className="field">شماره موبایل ثبت‌شده<input className="input" dir="ltr" style={{ textAlign: 'right' }} required inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09123456789" /></label>
        <button className="btn btn-primary sm:col-span-2" disabled={busy}><PackageSearch size={18} />{busy ? 'در حال جستجو...' : 'پیگیری سفارش'}</button>
        {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 sm:col-span-2">{err}</p>}
      </form>
      {o && (
        <div className="card mt-5 space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><small className="text-ink-500">کد سفارش</small><b className="block text-lg">{o.code}</b></div><span className={`rounded-full px-3 py-1 text-sm font-bold ${o.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700'}`}>{st.label}</span></div>
          {o.status !== 'cancelled' && (
            <ol className="grid grid-cols-4 gap-2" aria-label="مراحل سفارش">{STEPS.map((s, i) => (
              <li key={s} className="text-center"><span className={`mx-auto mb-1.5 grid size-9 place-items-center rounded-full text-sm font-bold ${i <= st.step ? 'bg-brand text-white' : 'bg-ink-100 text-ink-400'}`}>{i <= st.step ? <Check size={17} /> : (i + 1).toLocaleString('fa-IR')}</span><span className={`text-xs font-semibold ${i <= st.step ? 'text-ink' : 'text-ink-400'}`}>{s}</span></li>))}</ol>
          )}
          <ul className="divide-y divide-ink-100 text-sm">{o.items.map((i, k) => <li key={k} className="flex justify-between gap-3 py-2.5"><span>{i.name} <span className="text-ink-500">× {i.qty.toLocaleString('fa-IR')}</span></span><b>{(i.price * i.qty).toLocaleString('fa-IR')}</b></li>)}</ul>
          {o.payUrl && <a href={o.payUrl} className="btn btn-primary w-full">ادامه‌ی پرداخت</a>}
          <div className="flex flex-wrap justify-between gap-2 border-t border-ink-100 pt-4 text-sm"><span className="text-ink-500">{METHOD_LABEL[o.method]}{o.paid ? ' · پرداخت‌شده' : ''} · {fmtDate(o.createdAt)}</span><b className="text-base">{o.total.toLocaleString('fa-IR')} تومان</b></div>
        </div>
      )}
    </div>
  );
}
