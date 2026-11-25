"use client";
import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
export default function LoginPage(){
 const router=useRouter(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const [showPassword,setShowPassword]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();if(!email||!password){setError("ایمیل و رمز عبور را وارد کنید.");return;}setBusy(true);setError("");try{const res=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});if(!res.ok){const d=await res.json().catch(()=>({}));setError(d.error||"ورود ناموفق بود.");setBusy(false);return;}router.push("/admin");router.refresh();}catch{setError("ارتباط با سرور برقرار نشد.");setBusy(false);}}
 return <main className="login-page mobiler-admin-login"><div className="login-ambient ambient-one"/><div className="login-ambient ambient-two"/>
  <Link href="/" className="login-brand mobiler-login-brand"><span className="brand-symbol"><ShoppingBag size={21}/></span><div><b>موبایلر</b><small>مدیریت هوشمند فروشگاه</small></div></Link>
  <section className="login-card mobiler-login-card"><div className="login-card-top"><div className="login-icon mobiler-login-icon"><ShieldCheck size={25}/></div><span className="eyebrow">MOBILER ADMIN • SECURE ACCESS</span><h1>ورود مدیر فروشگاه</h1><p>برای دسترسی به داشبورد مدیریت، وارد حساب مدیر شوید.</p></div>
   <form onSubmit={submit} className="login-form">{error&&<div className="form-error">{error}</div>}<label className="form-field"><span>ایمیل مدیر</span><div className="input-with-icon"><Mail size={16}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@mobiler.ir" autoComplete="username"/></div></label><label className="form-field"><span>رمز عبور</span><div className="input-with-icon"><LockKeyhole size={16}/><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="رمز عبور حساب مدیریت" autoComplete="current-password"/><button type="button" className="admin-password-toggle" onClick={()=>setShowPassword(!showPassword)} aria-label="نمایش رمز">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label><div className="login-options"><span>دسترسی مخصوص مدیران</span></div><button className="btn btn-primary login-submit mobiler-admin-submit" type="submit" disabled={busy}>{busy?"در حال بررسی...":"ورود به پنل مدیریت"} <ArrowLeft size={16}/></button></form>
   <div className="login-security"><ShieldCheck size={15}/> ورود محافظت‌شده · دسترسی محدود به مدیر</div><Link className="admin-back-store" href="/">بازگشت به فروشگاه <ArrowLeft size={14}/></Link>
  </section>
  <div className="login-side-copy mobiler-login-copy"><span>SMART STORE CONTROL</span><h2>همه‌چیز تحت کنترل توست.</h2><p>فروش، سفارش‌ها، مشتریان و موجودی انبار را از یک داشبورد یکپارچه مدیریت کن.</p><div className="admin-feature-pills"><span><ShoppingBag size={14}/> سفارش‌ها</span><span><ShieldCheck size={14}/> امنیت</span><span><Sparkles size={14}/> گزارش هوشمند</span></div></div>
  <footer className="login-footer">© ۱۴۰۵ موبایلر · پنل مدیریت فروشگاه</footer></main>;
}
