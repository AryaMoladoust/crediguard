'use client';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function ContactForm() {
  const [f, setF] = useState({ name: '', phone: '', email: '', message: '', website: '' });
  const [st, setSt] = useState({ busy: false, ok: false, err: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function send(e) {
    e.preventDefault(); setSt({ busy: true, ok: false, err: '' });
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'ارسال نشد');
      setSt({ busy: false, ok: true, err: '' }); setF({ name: '', phone: '', email: '', message: '', website: '' });
    } catch (x) { setSt({ busy: false, ok: false, err: x.message }); }
  }
  return (
    <form onSubmit={send} className="card space-y-4 p-5 sm:p-6">
      <h2 className="text-lg">پیام به پشتیبانی</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">نام<input className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></label>
        <label className="field">شماره موبایل<input className="input" dir="ltr" style={{ textAlign: 'right' }} inputMode="numeric" value={f.phone} onChange={set('phone')} placeholder="09123456789" /></label>
      </div>
      <label className="field">ایمیل (اختیاری)<input className="input" dir="ltr" style={{ textAlign: 'right' }} type="email" value={f.email} onChange={set('email')} /></label>
      <label className="field">پیام شما<textarea className="input" required minLength={10} maxLength={2000} rows={5} value={f.message} onChange={set('message')} /></label>
      <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.website} onChange={set('website')} name="website" />
      {st.err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{st.err}</p>}
      {st.ok && <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={18} />پیام شما ثبت شد؛ به‌زودی پاسخ می‌دهیم.</p>}
      <button className="btn btn-primary w-full" disabled={st.busy}>{st.busy ? 'در حال ارسال...' : 'ارسال پیام'}</button>
    </form>
  );
}
