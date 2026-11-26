"use client";
import Link from "next/link";
import { AlertTriangle, Box, Clock3, Headset } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/admin/components/ui";
import { ago, fa, useApi } from "@/admin/lib/api";

type Events = { support: { id: string; name: string; phone: string; guest: boolean; unread: number; message: string; lastMessageAt: string; status: string }[]; orders: { id: string; code: string; customer: string; total: number; status: string; updatedAt: string }[]; stock: { id: string; name: string; sku: string; stock: number; minStock: number }[] };
export default function NotificationsPage() {
  const { data, error, loading } = useApi<Events>("/api/admin/events", 20000);
  const pending = (data?.orders ?? []).filter(o => o.status === "pending");
  const stock = data?.stock ?? [];
  const support = data?.support ?? [];
  const empty = !loading && !pending.length && !stock.length && !support.length;
  return <>
    <PageHeader title="اعلان‌ها" subtitle="موارد نیازمند اقدام: پیام‌های جدید مشتریان، سفارش‌های در انتظار و کالاهای کم‌موجود یا ناموجود." eyebrow="NOTIFICATIONS"/>
    {error && <div className="form-error">{error}</div>}
    {empty ? <Panel title="اعلان‌ها" subtitle=""><EmptyState title="موردی نیازمند اقدام نیست"/></Panel> : <>
      <Panel title="پیام‌های جدید پشتیبانی" subtitle={`${fa(support.length)} مکالمه نیازمند بررسی`}>
        <div className="timeline-list">{support.map(c => <div className="timeline-item" key={c.id}><span className="timeline-icon warning"><Headset size={15}/></span><div><b>{c.name}{c.guest ? " (مهمان)" : ""} · {c.phone}</b><small>{c.message || "پیام جدید مشتری"} · <Link href={`/admin/messages?conversation=${c.id}`}>مشاهده و پاسخ</Link></small></div><time>{ago(c.lastMessageAt)}</time></div>)}{!support.length && <p className="muted-cell">پیام خوانده‌نشده‌ای وجود ندارد.</p>}</div>
      </Panel>
      <Panel title="سفارش‌های در انتظار" subtitle={`${fa(pending.length)} سفارش`}>
        <div className="timeline-list">{pending.map(o => <div className="timeline-item" key={o.id}><span className="timeline-icon info"><Clock3 size={15}/></span><div><b>سفارش {o.code} منتظر تأیید است</b><small>{o.customer} · {fa(o.total)} تومان · <Link href={`/admin/sales/${o.id}`}>مشاهده سفارش</Link></small></div><time>{ago(o.updatedAt)}</time></div>)}{!pending.length && <p className="muted-cell">سفارش در انتظاری نیست.</p>}</div>
      </Panel>
      <Panel title="هشدار موجودی" subtitle={`${fa(stock.length)} کالا`}>
        <div className="timeline-list">{stock.map(p => <div className="timeline-item" key={p.id}><span className={`timeline-icon ${p.stock <= 0 ? "warning" : "info"}`}>{p.stock <= 0 ? <AlertTriangle size={15}/> : <Box size={15}/>}</span><div><b>{p.name}</b><small>{p.stock <= 0 ? "ناموجود" : `${fa(p.stock)} عدد مانده (نقطه سفارش ${fa(p.minStock)})`} · <Link href={`/admin/inventory/${p.id}`}>ویرایش</Link></small></div></div>)}{!stock.length && <p className="muted-cell">همه‌ی کالاها موجودی کافی دارند.</p>}</div>
      </Panel>
    </>}
  </>;
}
