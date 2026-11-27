'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, Clock3, CreditCard, Zap, BadgeCheck } from 'lucide-react';

const fa = (n) => Math.round(n || 0).toLocaleString('fa-IR');
const jd = (d) => new Date(d).toLocaleDateString('fa-IR-u-ca-persian');
const INST = { paid: ['پرداخت‌شده', 'bg-emerald-50 text-emerald-700'], due: ['در انتظار', 'bg-ink-100 text-ink-700'], overdue: ['معوق', 'bg-red-50 text-red-700'] };
const Pill = ({ c, children }) => <span className={`rounded-full px-3 py-1 text-xs font-bold ${c}`}>{children}</span>;

function CompleteProfile({ onDone }) {
  const [f, setF] = useState({ nationalId: '' });
  const [st, setSt] = useState({ busy: false, err: '' });
  async function submit(e) {
    e.preventDefault();
    setSt({ busy: true, err: '' });
    const r = await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setSt({ busy: false, err: d.error || 'ثبت نشد' });
    onDone();
  }
  return (
    <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6">
      <h2 className="text-lg">تکمیل پرونده‌ی اعتباری</h2>
      <p className="text-sm text-ink-500">برای خرید اقساطی، کد ملی لازم است. کد ملی فقط به‌صورت رمزنگاری‌شده و ماسک‌شده نگهداری می‌شود.</p>
      <label className="field">کد ملی<input className="input" dir="ltr" style={{ textAlign: 'right' }} required inputMode="numeric" maxLength={10} value={f.nationalId} onChange={(e) => setF({ ...f, nationalId: e.target.value })} /></label>
      {st.err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{st.err}</p>}
      <button className="btn btn-primary w-full" disabled={st.busy}>{st.busy ? 'لطفاً صبر کنید...' : 'ثبت'}</button>
    </form>
  );
}

export default function CreditDashboard() {
  const router = useRouter();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [payErr, setPayErr] = useState('');
  const [justPaid, setJustPaid] = useState(false);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/credit/me', { cache: 'no-store' }); const j = await r.json(); if (r.status === 401) return router.push('/account/login'); if (!r.ok) throw new Error(j.error || 'خطا'); setD(j); setErr(''); }
    catch (x) { setErr(x.message || 'دریافت اطلاعات انجام نشد'); }
  }, [router]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { try { setJustPaid(new URLSearchParams(window.location.search).get('paid') === '1'); } catch {} }, []);

  // اتصال به درگاه: مبلغ سمت سرور از روی سفارش محاسبه می‌شود
  async function pay(orderId, target) {
    const key = `${orderId}:${target}`;
    setBusy(key); setPayErr('');
    try {
      const r = await fetch('/api/credit/pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, target }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.payUrl) throw new Error(j.error || 'اتصال به درگاه انجام نشد');
      window.location.href = j.payUrl;
    } catch (x) { setPayErr(x.message); setBusy(''); }
  }

  if (err) return <p role="alert" className="card mt-6 p-5 text-sm font-semibold text-red-700">{err} <button className="mr-2 underline" onClick={load}>تلاش دوباره</button></p>;
  if (!d) return <div className="mt-6 grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="card h-40 animate-pulse bg-ink-100" />)}</div>;
  if (!d.ready) return <div className="mt-6 max-w-xl"><CompleteProfile onDone={() => { load(); router.refresh(); }} /></div>;

  const pu = d.purchase, inst = d.installments;
  return (
    <div className="mt-6 space-y-6">
      {justPaid && <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700"><BadgeCheck size={18} />پرداخت با موفقیت ثبت شد.</p>}
      {payErr && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{payErr}</p>}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5"><h2 className="flex items-center gap-2 text-base"><ShieldCheck size={18} className="text-brand" />میزان خرید اقساطی شما</h2>
          {pu?.blocked
            ? <p className="mt-3 text-sm font-semibold leading-7 text-red-700">در حال حاضر امکان خرید اقساطی برای حساب شما فعال نیست. برای اطلاعات بیشتر با پشتیبانی صحبت کنید.</p>
            : <><p className="mt-3 text-3xl font-extrabold">{fa(pu?.available)} <small className="text-sm font-semibold text-ink-400">تومان</small></p>
              <p className="mt-2 text-xs leading-6 text-ink-500">حداکثر مبلغ اقساطی که الان می‌توانید بگیرید. با پیش‌پرداخت {fa(10)}٪ تا حدود <b className="text-ink">{fa(pu?.maxTotal)} تومان</b> کالا می‌توانید بخرید. با پرداخت اقساط، این مبلغ آزاد می‌شود.</p>
              {pu?.used > 0 && <p className="mt-2 text-xs text-ink-500">از سقف {fa(pu.limit)} تومان، {fa(pu.used)} تومان درگیر اقساط جاری است.</p>}</>}
          <p className="mt-2 text-[11px] text-ink-400">پرونده‌های عادی خودکار بررسی می‌شوند و فقط موارد پرریسک به مدیر ارجاع می‌شوند.</p></div>
        <div className="card p-5"><h2 className="text-base">وضعیت اقساط</h2>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">{[['کل اقساط', inst.totalCount], ['پرداخت‌شده', inst.paidCount], ['باقی‌مانده', inst.remainingCount]].map(([k, v]) => <div key={k} className="rounded-xl bg-ink-50 p-2"><dd className="text-xl font-extrabold">{fa(v)}</dd><dt className="text-[11px] text-ink-500">{k}</dt></div>)}</dl>
          <p className="mt-3 text-sm text-ink-500">مانده‌ی بدهی اقساط: <b className="text-ink">{fa(inst.remainingAmount)} تومان</b></p></div>
        <div className="card p-5"><h2 className="text-base">سررسید و تأخیر</h2>
          <p className="mt-3 text-sm">{inst.overdueCount ? <span className="font-bold text-red-700">{fa(inst.overdueCount)} قسط معوق ({fa(inst.overdueAmount)} تومان)، حداکثر {fa(inst.maxDaysLate)} روز تأخیر</span> : <span className="flex items-center gap-1.5 font-bold text-emerald-700"><CheckCircle2 size={16} />قسط معوقی ندارید</span>}</p>
          {inst.downDueCount > 0 && <p className="mt-2 text-sm font-bold text-amber-700">{fa(inst.downDueCount)} پیش‌پرداخت در انتظار پرداخت ({fa(inst.downDueAmount)} تومان)</p>}
          <p className="mt-2 text-sm text-ink-500">{inst.next ? <>قسط بعدی: <b className="text-ink">{fa(inst.next.amount)} تومان</b> — {jd(inst.next.dueDate)} ({fa(inst.next.daysLeft)} روز دیگر)</> : 'قسط پیش‌رویی ندارید.'}</p></div>
      </section>

      {inst.awaiting.length > 0 && <section className="card p-5"><h2 className="flex items-center gap-2 text-base"><Clock3 size={18} />در انتظار تأیید مدیر</h2>
        <ul className="mt-3 space-y-2 text-sm">{inst.awaiting.map((a) => <li key={a.code} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ink-50 p-3"><b dir="ltr">{a.code}</b><span className="text-ink-500">{fa(a.months)} قسط {fa(a.monthly)} تومانی · پیش‌پرداخت {fa(a.downPayment)} تومان</span></li>)}</ul>
        <p className="mt-2 text-xs text-ink-500">پس از تصمیم مدیر، امکان پرداخت پیش‌پرداخت و جدول اقساط همین‌جا نمایش داده می‌شود.</p></section>}

      <section className="card p-5 sm:p-6"><h2 className="text-lg">اقساط من</h2>
        {!inst.plans.length ? <p className="mt-4 flex items-center gap-2 text-sm text-ink-500"><Clock3 size={16} />جدول اقساط پس از تأیید خودکار یا تصمیم مدیر در این بخش نمایش داده می‌شود.</p> :
          inst.plans.map((pl) => {
            const downOk = pl.down.status === 'paid';
            const open = pl.schedule.filter((r) => r.status !== 'paid');
            const allAmount = open.reduce((s, r) => s + r.amount, 0);
            return (
              <div key={pl.code} className="mt-6 border-t border-ink-100 pt-5 first:mt-4 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><b dir="ltr" className="text-sm">{pl.code}</b><small className="mr-2 text-ink-500">{fa(pl.paidCount)} از {fa(pl.months)} قسط پرداخت شده · مانده {fa(pl.remainingAmount)} تومان</small></div>
                  {downOk && open.length > 1 && <button className="btn btn-primary !min-h-10" disabled={!!busy} onClick={() => pay(pl.orderId, 'all')}><Zap size={15} />{busy === `${pl.orderId}:all` ? 'در حال اتصال...' : `پرداخت همه اقساط (${fa(allAmount)} تومان)`}</button>}
                </div>
                <div className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3 text-sm ${downOk ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <span><b>پیش‌پرداخت (قسط اول)</b> · {fa(pl.down.amount)} تومان {downOk && pl.down.paidAt ? `· پرداخت در ${jd(pl.down.paidAt)}` : ''}</span>
                  {downOk ? <Pill c="bg-emerald-100 text-emerald-700">پرداخت‌شده</Pill> : <button className="btn btn-primary !min-h-10" disabled={!!busy} onClick={() => pay(pl.orderId, 'down')}><CreditCard size={15} />{busy === `${pl.orderId}:down` ? 'در حال اتصال...' : 'پرداخت با درگاه'}</button>}
                </div>
                {!downOk && <p className="mt-2 text-xs text-amber-800">پرداخت اقساط و ارسال کالا بعد از پرداخت پیش‌پرداخت ممکن می‌شود.</p>}
                <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="text-xs text-ink-500"><th className="py-1.5 text-right">قسط</th><th className="text-right">سررسید</th><th className="text-right">مبلغ (تومان)</th><th className="text-right">وضعیت</th><th className="text-right">زمان</th><th /></tr></thead>
                  <tbody>{pl.schedule.map((r) => <tr key={r.no} className="border-t border-ink-100">
                    <td className="py-2">{fa(r.no)}</td><td>{jd(r.dueDate)}</td><td>{fa(r.amount)}</td>
                    <td><Pill c={INST[r.status][1]}>{INST[r.status][0]}</Pill></td>
                    <td className="text-xs text-ink-500">{r.status === 'paid' ? (r.paidAt ? `پرداخت در ${jd(r.paidAt)}` : '') : r.status === 'overdue' ? <b className="text-red-700">{r.daysLate > 0 ? `${fa(r.daysLate)} روز تأخیر` : 'امروز سررسید شده'}</b> : `${fa(r.daysLeft)} روز تا سررسید`}</td>
                    <td className="text-left">{r.status !== 'paid' && <button className="btn btn-line !min-h-9 !px-3 text-xs" disabled={!!busy || !downOk} onClick={() => pay(pl.orderId, `n${r.no}`)}>{busy === `${pl.orderId}:n${r.no}` ? 'اتصال...' : r.status === 'overdue' ? 'پرداخت قسط' : 'پرداخت زودتر'}</button>}</td></tr>)}</tbody></table></div>
              </div>);
          })}
      </section>
    </div>
  );
}
