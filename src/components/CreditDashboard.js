'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertTriangle, FlaskConical, CheckCircle2, Clock3 } from 'lucide-react';

const fa = (n) => Math.round(n || 0).toLocaleString('fa-IR');
const jd = (d) => new Date(d).toLocaleDateString('fa-IR-u-ca-persian');
const RISK = { low: ['کم', 'bg-emerald-50 text-emerald-700'], medium: ['متوسط', 'bg-amber-50 text-amber-700'], high: ['بالا', 'bg-orange-50 text-orange-700'], critical: ['بحرانی', 'bg-red-50 text-red-700'] };
const REC = { approve: ['تأیید', 'bg-emerald-50 text-emerald-700'], review: ['نیازمند بررسی', 'bg-amber-50 text-amber-700'], reject: ['رد', 'bg-red-50 text-red-700'] };
const DEC = { auto: null, approved: 'تأیید دستی توسط مدیر', rejected: 'رد توسط مدیر', review: 'در حال بررسی توسط مدیر' };
const INST = { paid: ['پرداخت‌شده', 'bg-emerald-50 text-emerald-700'], due: ['در انتظار', 'bg-ink-100 text-ink-700'], overdue: ['معوق', 'bg-red-50 text-red-700'] };
const Pill = ({ c, children }) => <span className={`rounded-full px-3 py-1 text-xs font-bold ${c}`}>{children}</span>;
const SimBadge = () => <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700"><FlaskConical size={12} />داده آزمایشی (شبیه‌سازی‌شده)</span>;

function CompleteProfile({ onDone }) {
  const [f, setF] = useState({ nationalId: '', otp: '' });
  const [otp, setOtp] = useState({ sent: false, busy: false, devCode: '' });
  const [st, setSt] = useState({ busy: false, err: '' });
  async function send() {
    setOtp((o) => ({ ...o, busy: true })); setSt({ busy: false, err: '' });
    const r = await fetch('/api/auth/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ purpose: 'verify' }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setSt({ busy: false, err: d.error || 'ارسال کد انجام نشد' }); setOtp((o) => ({ ...o, busy: false })); return; }
    setOtp({ sent: true, busy: false, devCode: d.devCode || '' });
  }
  async function submit(e) {
    e.preventDefault(); if (!otp.sent) return send();
    setSt({ busy: true, err: '' });
    const r = await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setSt({ busy: false, err: d.error || 'ثبت نشد' });
    onDone();
  }
  return (
    <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6">
      <h2 className="text-lg">تکمیل پرونده‌ی اعتباری</h2>
      <p className="text-sm text-ink-500">برای خرید اقساطی، کد ملی و تأیید شماره موبایل لازم است. کد ملی فقط به‌صورت رمزنگاری‌شده و ماسک‌شده نگهداری می‌شود.</p>
      <label className="field">کد ملی<input className="input" dir="ltr" style={{ textAlign: 'right' }} required inputMode="numeric" maxLength={10} value={f.nationalId} onChange={(e) => setF({ ...f, nationalId: e.target.value })} /></label>
      {otp.sent && <label className="field">کد تأیید پیامک‌شده<input className="input" dir="ltr" style={{ textAlign: 'right' }} required inputMode="numeric" maxLength={5} value={f.otp} onChange={(e) => setF({ ...f, otp: e.target.value })} />
        {otp.devCode && <small className="mt-1 block font-semibold text-brand-700">حالت آزمایشی؛ کد شما: <b dir="ltr">{otp.devCode}</b></small>}</label>}
      {st.err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{st.err}</p>}
      <button className="btn btn-primary w-full" disabled={st.busy || otp.busy}>{otp.sent ? 'تأیید و ثبت' : 'ارسال کد تأیید'}</button>
    </form>
  );
}

export default function CreditDashboard() {
  const router = useRouter();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try { const r = await fetch('/api/credit/me', { cache: 'no-store' }); const j = await r.json(); if (r.status === 401) return router.push('/account/login'); if (!r.ok) throw new Error(j.error || 'خطا'); setD(j); setErr(''); }
    catch (x) { setErr(x.message || 'دریافت اطلاعات انجام نشد'); }
  }, [router]);
  useEffect(() => { load(); }, [load]);

  if (err) return <p role="alert" className="card mt-6 p-5 text-sm font-semibold text-red-700">{err} <button className="mr-2 underline" onClick={load}>تلاش دوباره</button></p>;
  if (!d) return <div className="mt-6 grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="card h-40 animate-pulse bg-ink-100" />)}</div>;
  if (!d.ready) return <div className="mt-6 max-w-xl"><CompleteProfile onDone={() => { load(); router.refresh(); }} /></div>;

  const a = d.assessment, p = d.profile?.simulated, inst = d.installments;
  const risk = RISK[a.riskLevel], rec = REC[a.recommendation];
  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-start gap-3 rounded-2xl bg-violet-50 p-4 text-sm text-violet-800"><FlaskConical size={20} className="mt-0.5 shrink-0" /><p>{d.notice}</p></div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5"><div className="flex items-center justify-between"><h2 className="text-base">امتیاز اعتباری</h2><SimBadge /></div>
          <p className="mt-3 text-4xl font-extrabold">{fa(a.score)}<small className="text-base font-semibold text-ink-400"> / ۹۰۰</small></p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((a.score - 300) / 600) * 100}%` }} /></div>
          <div className="mt-3 flex flex-wrap gap-2"><Pill c={risk[1]}>ریسک {risk[0]}</Pill><Pill c={rec[1]}>پیشنهاد ایجنت: {rec[0]}</Pill></div></div>
        <div className="card p-5"><h2 className="text-base">سقف اعتبار خرید اقساطی</h2>
          <p className="mt-3 text-3xl font-extrabold">{fa(a.creditLimit)} <small className="text-sm font-semibold text-ink-400">تومان</small></p>
          <p className="mt-2 text-xs leading-6 text-ink-500">ظرفیت قسط ماهانه: {fa(a.metrics?.monthlyCapacity)} تومان. تصمیم نهایی هر سفارش با قوانین سیستم و تأیید مدیر است.</p>
          {DEC[d.profile.decision] && <p className="mt-2 rounded-xl bg-brand-50 p-2.5 text-xs font-bold text-brand-700">{DEC[d.profile.decision]}{d.profile.decisionNote ? `: ${d.profile.decisionNote}` : ''}</p>}</div>
        <div className="card p-5"><h2 className="text-base">اقساط</h2>
          <p className="mt-3 text-sm">{inst.overdueCount ? <span className="font-bold text-red-700">{fa(inst.overdueCount)} قسط معوق ({fa(inst.overdueAmount)} تومان)</span> : <span className="flex items-center gap-1.5 font-bold text-emerald-700"><CheckCircle2 size={16} />قسط معوقی ندارید</span>}</p>
          <p className="mt-2 text-sm text-ink-500">{inst.next ? <>قسط بعدی: <b className="text-ink">{fa(inst.next.amount)} تومان</b> — {jd(inst.next.dueDate)}</> : 'قسط پیش‌رویی ندارید.'}</p></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5"><h2 className="mb-3 flex items-center gap-2 text-base"><ShieldCheck size={18} className="text-brand" />تحلیل ایجنت اعتبار یار</h2>
          <p className="text-sm leading-7">{a.summary}</p>
          <ul className="mt-3 space-y-1.5">{a.reasons.map((r, i) => <li key={i} className="flex items-center justify-between gap-3 text-sm"><span>{r.label}</span><b dir="ltr" className={r.delta > 0 ? 'text-emerald-700' : 'text-red-700'}>{r.delta > 0 ? '+' : ''}{r.delta.toLocaleString('fa-IR')}</b></li>)}</ul>
          {a.flags.length > 0 && <div className="mt-4 space-y-2">{a.flags.map((f) => <p key={f.code} className="flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-xs font-semibold text-amber-800"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{f.text}</p>)}</div>}
          <p className="mt-3 text-[11px] text-ink-400">موتور تحلیل: {a.engine} · {jd(a.at)}</p></div>
        <div className="card p-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-base">اطلاعات اعتباری</h2><SimBadge /></div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">{[
            ['موجودی حساب (فرضی)', `${fa(p.accountBalance)} تومان`], ['درآمد ماهانه', `${fa(p.monthlyIncome)} تومان`], ['خوش‌حسابی', `${fa(p.goodStandingPct)}٪`], ['چک برگشتی', fa(p.bouncedCheques)],
            ['تسهیلات فعال', fa(p.activeLoans)], ['مجموع بدهی', `${fa(p.totalDebt)} تومان`], ['اقساط معوق', fa(p.overdueInstallments)], ['سابقه‌ی نکول', p.everDefaulted ? 'دارد' : 'ندارد']].map(([k, v]) => <div key={k}><dt className="text-xs text-ink-500">{k}</dt><dd className="font-bold">{v}</dd></div>)}</dl>
          <p className="mt-3 text-[11px] text-ink-400">کد ملی: <span dir="ltr">{d.user.nationalId}</span></p></div>
      </section>

      <section className="card p-5 sm:p-6"><h2 className="text-lg">اقساط من</h2>
        {!inst.plans.length ? <p className="mt-4 flex items-center gap-2 text-sm text-ink-500"><Clock3 size={16} />جدول اقساط بعد از تأیید سفارش اقساطی توسط مدیر اینجا ساخته می‌شود.</p> :
          inst.plans.map((pl) => (
            <div key={pl.code} className="mt-5"><b dir="ltr" className="text-sm">{pl.code}</b><small className="mr-2 text-ink-500">{fa(pl.paidCount)} از {fa(pl.months)} قسط پرداخت شده</small>
              <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><thead><tr className="text-xs text-ink-500"><th className="py-1.5 text-right">قسط</th><th className="text-right">سررسید</th><th className="text-right">مبلغ (تومان)</th><th className="text-right">وضعیت</th></tr></thead>
                <tbody>{pl.schedule.map((r) => <tr key={r.no} className="border-t border-ink-100"><td className="py-2">{fa(r.no)}</td><td>{jd(r.dueDate)}</td><td>{fa(r.amount)}</td><td><Pill c={INST[r.status][1]}>{INST[r.status][0]}</Pill></td></tr>)}</tbody></table></div></div>))}
      </section>
    </div>
  );
}
