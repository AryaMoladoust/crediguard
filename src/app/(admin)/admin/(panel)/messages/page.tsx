"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCheck, Send, XCircle, RotateCcw } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, Pagination, Panel, SearchInput, SelectField, StatCard } from "@/admin/components/ui";
import { ago, fa, jDateTime, qs, useApi, useDebounced } from "@/admin/lib/api";
import { Mail, MailOpen, Clock3, Bot } from "lucide-react";

type Item = { id: string; name: string; phone: string; guest: boolean; status: string; unread: number; last: { from: string; text: string } | null; lastMessageAt: string };
type List = { items: Item[]; total: number; page: number; pageSize: number; pages: number; summary: { waiting: number; answered: number; bot: number; closed: number; unread: number } };
type Msg = { id: string; from: "customer" | "bot" | "admin"; text: string; adminName: string; at: string };
type Conv = { id: string; status: string; handoff: boolean; customer: { name: string; phone: string; guest: boolean; userId: string | null }; messages: Msg[] };
const ST: Record<string, [string, "warning" | "success" | "info" | "neutral"]> = { waiting_admin: ["در انتظار پاسخ", "warning"], answered: ["پاسخ داده شد", "success"], bot_answered: ["پاسخ خودکار", "info"], closed: ["بسته‌شده", "neutral"] };

export default function MessagesPage() {
  const [status, setStatus] = useState("waiting");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState("");
  const dq = useDebounced(q);
  const { data, error, loading, reload } = useApi<List>(`/api/admin/support${qs({ status, q: dq, page })}`, 15000);
  const { data: conv, error: cErr, reload: reloadConv } = useApi<Conv>(sel ? `/api/admin/support/${sel}` : "", 10000);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const conversation = new URLSearchParams(window.location.search).get("conversation");
    if (conversation) setSel(conversation);
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [conv?.messages.length, sel]);

  async function reply() {
    if (!text.trim() || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/admin/support/${sel}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "ارسال پاسخ ناموفق بود");
      setText(""); reloadConv(); reload();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  async function setState(s: "closed" | "waiting_admin") {
    const r = await fetch(`/api/admin/support/${sel}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
    if (!r.ok) setErr((await r.json().catch(() => ({}))).error || "تغییر وضعیت ناموفق بود"); else { reloadConv(); reload(); }
  }
  const s = data?.summary;
  return <>
    <PageHeader title="پشتیبانی و پیام‌ها" subtitle="مکالمه‌ی مشتریان با پاسخ‌گوی هوشمند و فرم تماس؛ مکالمه‌هایی که ارجاع شده‌اند اینجا پاسخ داده می‌شوند." eyebrow="SUPPORT / INBOX"/>
    {error && <div className="form-error">{error}</div>}
    <div className="stats-grid stats-four compact-stats">
      <StatCard label="در انتظار پاسخ" value={fa(s?.waiting ?? 0)} hint="نیازمند پشتیبان" icon={<Clock3 size={18}/>} tone="amber"/>
      <StatCard label="پاسخ داده‌شده" value={fa(s?.answered ?? 0)} hint="توسط پشتیبان" icon={<CheckCheck size={18}/>} tone="green"/>
      <StatCard label="پاسخ خودکار" value={fa(s?.bot ?? 0)} hint="بدون نیاز به انسان" icon={<Bot size={18}/>} tone="blue"/>
      <StatCard label="پیام خوانده‌نشده" value={fa(s?.unread ?? 0)} hint="کل مکالمه‌ها" icon={<Mail size={18}/>} tone="red"/>
    </div>
    <div className="chat-layout">
      <Panel title="مکالمه‌ها" subtitle={`${fa(data?.total ?? 0)} مکالمه`}>
        <div className="table-toolbar"><SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="نام یا موبایل..."/>
          <SelectField value={status} onChange={v => { setStatus(v); setPage(1); }} options={[{ label: "در انتظار پاسخ", value: "waiting" }, { label: "پاسخ داده‌شده", value: "answered" }, { label: "پاسخ خودکار", value: "bot" }, { label: "بسته‌شده", value: "closed" }, { label: "همه", value: "all" }]}/></div>
        {!loading && !data?.items.length ? <EmptyState title="مکالمه‌ای وجود ندارد"/> : <div className="chat-list">{(data?.items ?? []).map(c => <button key={c.id} className={`chat-item ${sel === c.id ? "active" : ""}`} onClick={() => { setSel(c.id); setErr(""); }}>
          <b><span>{c.name}{c.guest && " (مهمان)"}</span>{c.unread > 0 && <span className="chat-dot">{fa(c.unread)}</span>}</b>
          <small>{c.phone} · {ago(c.lastMessageAt)}</small><small>{c.last ? `${c.last.from === "customer" ? "مشتری" : c.last.from === "admin" ? "شما" : "بات"}: ${c.last.text}` : ""}</small>
          <span><Badge tone={ST[c.status][1]}>{ST[c.status][0]}</Badge></span></button>)}</div>}
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} pageSize={data?.pageSize ?? 20} onPage={setPage}/>
      </Panel>
      <Panel title={conv ? conv.customer.name : "گفتگو"} subtitle={conv ? `${conv.customer.phone}${conv.customer.guest ? " · مهمان (بدون حساب)" : ""}` : "یک مکالمه را از فهرست انتخاب کنید."}
        action={conv && <div style={{ display: "flex", gap: 6 }}>{conv.customer.userId && <Link className="table-action-link" href={`/admin/risk/${conv.customer.userId}`}>پرونده اعتباری</Link>}
          {conv.status === "closed" ? <Button variant="secondary" icon={<RotateCcw size={14}/>} onClick={() => setState("waiting_admin")}>بازگشایی</Button> : <Button variant="secondary" icon={<XCircle size={14}/>} onClick={() => setState("closed")}>بستن</Button>}</div>}>
        {!sel ? <EmptyState title="مکالمه‌ای انتخاب نشده" desc="با انتخاب مکالمه، تاریخچه‌ی کامل و جعبه‌ی پاسخ نمایش داده می‌شود."/> : cErr ? <div className="form-error">{cErr}</div> : !conv ? <EmptyState title="در حال بارگذاری..."/> : <>
          <div className="chat-thread">{conv.messages.map(m => <div key={m.id} className={`chat-msg ${m.from}`}>{m.text}<small>{m.from === "admin" ? `${m.adminName || "پشتیبان"} · ` : m.from === "bot" ? "پاسخ خودکار · " : ""}{jDateTime(m.at)}</small></div>)}<div ref={end}/></div>
          {err && <div className="form-error">{err}</div>}
          <div className="chat-reply"><textarea value={text} onChange={e => setText(e.target.value)} maxLength={2000} placeholder="پاسخ به مشتری..." onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) reply(); }}/>
            <Button icon={<Send size={14}/>} onClick={reply} disabled={busy || !text.trim()}>ارسال</Button></div>
          {conv.customer.guest && <p className="muted-cell" style={{ marginTop: 8 }}>این فرستنده حساب ندارد؛ پاسخ پس از ثبت‌نام با همان شماره‌ی تأییدشده در «پشتیبانی» حساب او دیده می‌شود.</p>}
        </>}
      </Panel>
    </div>
  </>;
}
