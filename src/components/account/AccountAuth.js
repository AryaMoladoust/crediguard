'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, ShieldCheck, ShoppingBag, Sparkles, UserRound, CheckCircle2 } from 'lucide-react';

export default function AccountAuth({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const update = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));
  function submit(event) {
    event.preventDefault();
    setNotice('ظاهر و اعتبارسنجی فرم آماده است؛ ذخیره حساب پس از اتصال امن به دیتابیس فعال می‌شود.');
  }
  return <main className="account-auth-page">
    <div className="account-glow account-glow-a"/><div className="account-glow account-glow-b"/>
    <header className="account-topbar"><Link href="/" className="account-brand"><span className="account-brand-mark"><ShoppingBag size={20}/></span><span><b>موبایلر</b><small>تجربه هوشمند خرید دیجیتال</small></span></Link><Link href="/" className="account-back">بازگشت به فروشگاه <ArrowLeft size={16}/></Link></header>
    <div className="account-layout">
      <section className="account-promo"><span className="account-kicker"><Sparkles size={14}/> MOBILER MEMBERS CLUB</span><h1>{isRegister ? <>به خانواده <em>موبایلر</em><br/>اضافه شو.</> : <>همه خریدهایت،<br/><em>یک‌جا و همیشه</em><br/>در دسترس تو.</>}</h1><p>{isRegister ? 'حساب کاربری بساز، سفارش‌هایت را پیگیری کن و تجربه خرید ساده‌تری داشته باش.' : 'وارد حساب کاربری‌ات شو و سفارش‌ها، اطلاعات شخصی و علاقه‌مندی‌هایت را مدیریت کن.'}</p><div className="account-benefits"><div><span><CheckCircle2 size={17}/></span><div><b>پیگیری آسان سفارش‌ها</b><small>وضعیت خریدها در یک نگاه</small></div></div><div><span><ShieldCheck size={17}/></span><div><b>حساب کاربری امن</b><small>اطلاعاتت فقط برای حساب خودت</small></div></div><div><span><ShoppingBag size={17}/></span><div><b>خرید سریع‌تر</b><small>اطلاعاتت برای خریدهای بعدی آماده است</small></div></div></div><div className="account-orbit"><div className="orbit-ring orbit-ring-one"/><div className="orbit-ring orbit-ring-two"/><div className="orbit-bag"><ShoppingBag size={48}/></div><span className="orbit-chip chip-one">MOBILER</span><span className="orbit-chip chip-two">۰۱ / ۱۰۰</span></div></section>
      <section className="account-form-card"><div className="account-form-heading"><div className="account-form-icon">{isRegister ? <UserRound size={23}/> : <LockKeyhole size={23}/>}</div><span className="account-overline">PERSONAL ACCOUNT</span><h2>{isRegister ? 'ساخت حساب کاربری' : 'خوش برگشتی!'}</h2><p>{isRegister ? 'برای شروع، اطلاعاتت را وارد کن.' : 'برای ورود، اطلاعات حساب خودت را وارد کن.'}</p></div>
        <form className="account-form" onSubmit={submit}>
          {isRegister && <label><span>نام و نام خانوادگی</span><div className="account-input"><UserRound size={17}/><input required value={form.name} onChange={update('name')} placeholder="مثلاً علی محمدی" autoComplete="name"/></div></label>}
          {isRegister && <label><span>شماره موبایل</span><div className="account-input"><Phone size={17}/><input required inputMode="tel" value={form.phone} onChange={update('phone')} placeholder="09xxxxxxxxx" autoComplete="tel"/></div></label>}
          <label><span>ایمیل</span><div className="account-input"><Mail size={17}/><input required type="email" value={form.email} onChange={update('email')} placeholder="name@example.com" autoComplete="email" dir="ltr"/></div></label>
          <label><span>رمز عبور</span><div className="account-input"><LockKeyhole size={17}/><input required minLength={8} type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="حداقل ۸ کاراکتر" autoComplete={isRegister ? 'new-password' : 'current-password'}/><button type="button" className="account-eye" onClick={()=>setShowPassword(!showPassword)} aria-label="نمایش رمز عبور">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
          {!isRegister && <div className="account-form-meta"><label className="account-check"><input type="checkbox"/> مرا به خاطر بسپار</label><button type="button" onClick={()=>setNotice('بازیابی رمز عبور پس از راه‌اندازی سرویس احراز هویت فعال می‌شود.')}>رمز عبور را فراموش کرده‌ام</button></div>}
          {notice && <div className="account-notice"><ShieldCheck size={17}/><span>{notice}</span></div>}
          <button className="account-submit" type="submit">{isRegister ? 'ایجاد حساب کاربری' : 'ورود به حساب'} <ArrowLeft size={17}/></button>
        </form>
        <div className="account-switch">{isRegister ? 'قبلاً حساب ساخته‌ای؟' : 'هنوز حساب کاربری نداری؟'} <Link href={isRegister ? '/account/login' : '/account/register'}>{isRegister ? 'وارد شو' : 'ثبت‌نام کن'} <ArrowRight size={14}/></Link></div>
        <div className="account-secure"><ShieldCheck size={15}/> اطلاعات حساب پس از اتصال دیتابیس به‌صورت امن ذخیره خواهد شد.</div>
      </section>
    </div>
    <footer className="account-footer">© ۱۴۰۵ موبایلر · همراه مطمئن خریدهای دیجیتال تو</footer>
  </main>;
}
