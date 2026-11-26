'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, UserRound, Bot, Headset } from 'lucide-react';

const FAQ = ['شرایط خرید اقساطی چیست؟', 'سقف اعتبار من چقدر است؟', 'قسط بعدی من چه زمانی است؟', 'بدهی معوق دارم؟', 'وضعیت سفارش من'];
const time = (d) => new Date(d).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
const STATUS = { bot_answered: 'پاسخ خودکار', waiting_admin: 'در انتظار پشتیبان', answered: 'پشتیبان پاسخ داد', closed: 'بسته‌شده' };

export default function SupportChat() {
  const [conv, setConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const end = useRef(null);

  const load = useCallback(async () => {
    try { const r = await fetch('/api/support', { cache: 'no-store' }); const d = await r.json(); if (r.ok) setConv(d.conversation); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); const t = setInterval(() => { if (!document.hidden) load(); }, 8000); return () => clearInterval(t); }, [load]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [conv?.messages?.length]);

  async function post(body) {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'ارسال نشد');
      setConv(d.conversation); setText('');
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }
  const send = (e) => { e.preventDefault(); if (text.trim().length >= 2) post({ text }); };
  const msgs = conv?.messages || [];

  return (
    <section className="card flex h-[34rem] max-h-[75vh] flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-ink-100 p-4">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-brand-50 text-brand"><Headset size={20} /></span>
          <div><b className="block text-sm">پشتیبانی اعتبار یار</b><small className="text-ink-500">{conv ? STATUS[conv.status] : 'پاسخ‌گوی هوشمند + پشتیبان انسانی'}</small></div></div>
        <button type="button" className="btn btn-line !min-h-9 !px-3 text-xs" disabled={busy || conv?.handoff} onClick={() => post({ action: 'handoff' })}>{conv?.handoff ? 'ارجاع‌شده به پشتیبان' : 'گفتگو با پشتیبان انسانی'}</button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4" aria-live="polite">
        {loading && <p className="text-center text-sm text-ink-500">در حال بارگذاری...</p>}
        {!loading && !msgs.length && (
          <div className="grid place-items-center gap-3 py-8 text-center"><Bot size={36} className="text-ink-400" /><p className="text-sm text-ink-500">سؤال خود را بنویسید یا یکی از موارد زیر را انتخاب کنید.</p>
            <div className="flex flex-wrap justify-center gap-2">{FAQ.map((q) => <button key={q} type="button" disabled={busy} onClick={() => post({ text: q })} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink-700 ring-1 ring-ink-200 hover:bg-brand-50">{q}</button>)}</div></div>)}
        {msgs.map((m) => {
          const mine = m.from === 'customer';
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row' : 'flex-row-reverse'}`}>
              <span className={`mt-1 grid size-7 shrink-0 place-items-center rounded-full ${mine ? 'bg-ink text-white' : m.from === 'admin' ? 'bg-brand text-white' : 'bg-white text-ink-500 ring-1 ring-ink-200'}`}>{mine ? <UserRound size={14} /> : m.from === 'admin' ? <Headset size={14} /> : <Bot size={14} />}</span>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-7 ${mine ? 'rounded-tr-sm bg-brand text-white' : 'rounded-tl-sm bg-white ring-1 ring-ink-100'}`}>
                {!mine && <small className="block text-[11px] font-bold text-ink-400">{m.from === 'admin' ? 'پشتیبان' : 'پاسخ خودکار'}</small>}
                <p className="whitespace-pre-wrap">{m.text}</p><time className={`block text-[10px] ${mine ? 'text-white/70' : 'text-ink-400'}`}>{time(m.at)}</time>
              </div>
            </div>);
        })}
        <div ref={end} />
      </div>
      {err && <p role="alert" className="mx-4 mt-3 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-700">{err}</p>}
      <form onSubmit={send} className="flex gap-2 border-t border-ink-100 p-3">
        <input className="input !mt-0 flex-1" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="پیام خود را بنویسید..." aria-label="پیام" />
        <button className="btn btn-primary !px-4" disabled={busy || text.trim().length < 2} aria-label="ارسال"><Send size={18} className="-scale-x-100" /></button>
      </form>
    </section>
  );
}
