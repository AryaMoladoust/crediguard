'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function ProfileForm({ user }) {
  const router = useRouter();
  const [f, setF] = useState({ name: user.name, email: user.email, address: user.address });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? { ok: true, t: 'اطلاعات ذخیره شد' } : { ok: false, t: d.error || 'ذخیره نشد' }); setBusy(false); router.refresh();
  }
  const [pw, setPw] = useState({ current: '', next: '', open: false, msg: null });
  async function changePw(e) {
    e.preventDefault(); setPw((o) => ({ ...o, msg: null }));
    const r = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: pw.current, next: pw.next }) });
    const d = await r.json().catch(() => ({}));
    setPw(r.ok ? { current: '', next: '', open: false, msg: { ok: true, t: 'رمز تغییر کرد؛ ورودهای قبلی در دستگاه‌های دیگر خارج شدند' } } : { ...pw, msg: { ok: false, t: d.error || 'تغییر رمز انجام نشد' } });
  }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); router.refresh(); }
  return (
    <form onSubmit={save} className="card space-y-4 p-5 sm:p-6">
      <h2 className="text-lg">اطلاعات حساب</h2>
      <label className="field">نام و نام خانوادگی<input className="input" required minLength={2} value={f.name} onChange={set('name')} /></label>
      <label className="field">شماره موبایل<input className="input bg-ink-50" dir="ltr" style={{ textAlign: 'right' }} value={user.phone} disabled /></label>
      <label className="field">کد ملی<input className="input bg-ink-50" dir="ltr" style={{ textAlign: 'right' }} value={user.nationalIdMasked || 'ثبت نشده (در «اعتبار و اقساط» تکمیل کنید)'} disabled /></label>
      <label className="field">ایمیل<input className="input" dir="ltr" style={{ textAlign: 'right' }} type="email" value={f.email} onChange={set('email')} /></label>
      <label className="field">آدرس پیش‌فرض تحویل<textarea className="input" rows={3} maxLength={500} value={f.address} onChange={set('address')} /></label>
      {msg && <p role="status" className={`rounded-xl p-3 text-sm font-semibold ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.t}</p>}
      <div className="flex gap-2"><button className="btn btn-primary flex-1" disabled={busy}>ذخیره تغییرات</button><button type="button" onClick={logout} className="btn btn-line"><LogOut size={17} /> خروج</button></div>
      <div className="border-t border-ink-100 pt-4">
        <button type="button" className="text-sm font-bold text-brand-600" onClick={() => setPw((o) => ({ ...o, open: !o.open }))}>تغییر رمز عبور</button>
        {pw.open && <div className="mt-3 space-y-3">
          <label className="field">رمز فعلی<input className="input" dir="ltr" style={{ textAlign: 'right' }} type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
          <label className="field">رمز جدید (حداقل ۸ کاراکتر)<input className="input" dir="ltr" style={{ textAlign: 'right' }} type="password" autoComplete="new-password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
          <button type="button" onClick={changePw} className="btn btn-dark w-full" disabled={!pw.current || pw.next.length < 8}>ثبت رمز جدید</button></div>}
        {pw.msg && <p role="status" className={`mt-3 rounded-xl p-3 text-sm font-semibold ${pw.msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{pw.msg.t}</p>}
      </div>
    </form>
  );
}
