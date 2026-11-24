'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, TriangleAlert } from 'lucide-react';
import { SITE } from '@/lib/site';
import { useStore } from './store';

// شبیه‌ساز درگاه پرداخت: به بانک واقعی وصل نیست و اطلاعات کارت دریافت/ذخیره نمی‌کند.
export default function GatewaySim({ token, code, total, expiresAt }) {
  const router = useRouter();
  const { clear } = useStore();
  const [left, setLeft] = useState(null); // در سرور null تا hydration ناسازگار نشود
  const [busy, setBusy] = useState('');
  const [failed, setFailed] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [expiresAt]);

  async function send(result) {
    setBusy(result); setErr('');
    try {
      const r = await fetch('/api/payment/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, result }) });
      const d = await r.json().catch(() => ({}));
      if (result === 'success') {
        if (!r.ok || !d.ok) throw new Error(d.error || 'پرداخت انجام نشد');
        clear();
        try { sessionStorage.removeItem('mb_checkout'); } catch {}
        router.replace(`/order/success?code=${d.code}&method=cash`);
        return;
      }
      setFailed(true);
    } catch (x) { setErr(x.message); }
    setBusy('');
  }

  const expired = left === 0;
  const mmss = left === null ? '--:--' : `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  const fake = (label, v) => <label className="field">{label}<input className="input bg-ink-50" dir="ltr" style={{ textAlign: 'right' }} value={v} readOnly tabIndex={-1} /></label>;

  return (
    <div className="wrap py-10">
      <div className="card mx-auto max-w-md space-y-5 p-6">
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-6 text-amber-800"><TriangleAlert size={16} className="mt-0.5 shrink-0" />درگاه پرداخت آزمایشی (شبیه‌ساز) — به بانک وصل نیست. اطلاعات کارت واقعی وارد نکنید.</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-ink-500">پذیرنده</span><b>{SITE.name}</b></div>
          <div className="flex justify-between"><span className="text-ink-500">کد سفارش</span><b dir="ltr">{code}</b></div>
          <div className="flex justify-between border-t border-ink-100 pt-3"><span className="font-bold">مبلغ قابل پرداخت</span><b className="text-lg">{Number(total).toLocaleString('fa-IR')} تومان</b></div>
        </div>
        {failed ? (
          <div className="space-y-3 text-center">
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">پرداخت انجام نشد. سفارش شما تا پایان مهلت پرداخت نگه داشته می‌شود.</p>
            <button type="button" className="btn btn-primary w-full" onClick={() => setFailed(false)} disabled={expired}>تلاش مجدد برای پرداخت</button>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {fake('شماره کارت (آزمایشی)', '0000 0000 0000 0000')}
              <div className="grid grid-cols-3 gap-3">{fake('CVV2', '000')}{fake('تاریخ انقضا', '12/99')}{fake('رمز دوم', '••••••')}</div>
            </div>
            <p className="flex items-center justify-between text-xs text-ink-500"><span className="flex items-center gap-1"><Lock size={13} />پرداخت امن (نمایشی)</span><span>زمان باقی‌مانده: <b dir="ltr">{mmss}</b></span></p>
            {expired && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">مهلت پرداخت تمام شد.</p>}
            {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="btn btn-primary" disabled={!!busy || expired} onClick={() => send('success')}>{busy === 'success' ? 'در حال پرداخت...' : 'پرداخت'}</button>
              <button type="button" className="btn btn-line" disabled={!!busy} onClick={() => send('failed')}>انصراف</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
