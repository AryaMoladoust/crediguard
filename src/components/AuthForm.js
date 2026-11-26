'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthForm({ mode }) {
  const reg = mode === 'register';
  const router = useRouter();
  const [f, setF] = useState({ name: '', phone: '', nationalId: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr('');
    setBusy(true);
    try {
      const r = await fetch(`/api/auth/${reg ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'خطا');
      router.push(reg ? '/account/credit' : '/account'); router.refresh();
    } catch (x) { setErr(x.message); setBusy(false); }
  }
  const ltr = { textAlign: 'right' };
  return (
    <div className="wrap grid min-h-[70vh] place-items-center py-10">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6 sm:p-8">
        <div><h1 className="text-2xl">{reg ? 'ساخت حساب کاربری' : 'ورود به حساب'}</h1><p className="mt-1 text-sm text-ink-500">{reg ? 'با حساب کاربری، خرید اقساطی، سفارش‌ها و پرونده‌ی اعتباری‌تان را مدیریت کنید.' : 'برای دیدن سفارش‌ها و اقساط وارد شوید.'}</p></div>
        {reg && <label className="field">نام و نام خانوادگی<input className="input" required minLength={2} autoComplete="name" value={f.name} onChange={set('name')} /></label>}
        <label className="field">شماره موبایل<input className="input" dir="ltr" style={ltr} required inputMode="numeric" autoComplete="username" value={f.phone} onChange={set('phone')} placeholder="09123456789" /></label>
        {reg && <label className="field">کد ملی<input className="input" dir="ltr" style={ltr} required inputMode="numeric" maxLength={10} autoComplete="off" value={f.nationalId} onChange={set('nationalId')} placeholder="۱۰ رقم" /></label>}
        {reg && <label className="field">ایمیل (اختیاری)<input className="input" dir="ltr" style={ltr} type="email" autoComplete="email" value={f.email} onChange={set('email')} /></label>}
        <label className="field">رمز عبور{reg && <small className="mr-2 font-normal text-ink-400">حداقل ۸ کاراکتر</small>}
          <span className="relative block"><input className="input !pl-11" dir="ltr" style={ltr} required minLength={reg ? 8 : 1} type={show ? 'text' : 'password'} autoComplete={reg ? 'new-password' : 'current-password'} value={f.password} onChange={set('password')} />
            <button type="button" onClick={() => setShow(!show)} className="absolute left-2 top-1/2 mt-[3px] grid size-8 -translate-y-1/2 place-items-center text-ink-400" aria-label={show ? 'پنهان کردن رمز' : 'نمایش رمز'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
        {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}
        <button className="btn btn-primary w-full !min-h-12" disabled={busy}>{busy ? 'لطفاً صبر کنید...' : reg ? 'ثبت‌نام' : 'ورود'}</button>
        <p className="text-center text-sm text-ink-500">{reg ? 'حساب دارید؟' : 'حساب ندارید؟'} <Link href={reg ? '/account/login' : '/account/register'} className="font-bold text-brand-600">{reg ? 'وارد شوید' : 'ثبت‌نام کنید'}</Link></p>
      </form>
    </div>
  );
}
