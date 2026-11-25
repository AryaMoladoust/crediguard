"use client";
import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, MapPin, Phone, Truck, CheckCircle2, CheckCheck, XCircle } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, Panel, Table } from "@/admin/components/ui";
import { fa, jDateTime, METHOD, ORDER_STATUS, statusTone, useApi } from "@/admin/lib/api";

type Detail = {
  id: string; code: string; status: string; method: "cash" | "installment"; total: number; note: string;
  createdAt: string; updatedAt: string; shippedAt: string | null;
  customer: { name: string; phone: string; address: string };
  items: { name: string; price: number; qty: number; productId: string | null }[];
  payment: { status: "unpaid" | "paid" | "failed" | null; ref: string; paidAt: string | null };
  history: { status: string; at: string; by: string }[];
  next: string[];
};
const STEPS = ["pending", "confirmed", "shipped", "completed"];
const PAY: Record<string, string> = { paid: "پرداخت‌شده", unpaid: "پرداخت‌نشده", failed: "ناموفق" };
const ACTION: Record<string, { label: string; icon: React.ReactNode; variant: "primary" | "secondary" | "danger" }> = {
  confirmed: { label: "تأیید سفارش", icon: <CheckCircle2 size={15}/>, variant: "primary" },
  shipped: { label: "ثبت ارسال", icon: <Truck size={15}/>, variant: "primary" },
  completed: { label: "تکمیل (تحویل شد)", icon: <CheckCheck size={15}/>, variant: "primary" },
  cancelled: { label: "لغو سفارش", icon: <XCircle size={15}/>, variant: "danger" },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: o, error, loading, reload } = useApi<Detail>(`/api/admin/orders/${id}`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  async function move(status: string) {
    if (status === "cancelled" && !window.confirm("با لغو سفارش، موجودی کالاها به انبار برمی‌گردد و دیگر قابل تغییر نیست. ادامه می‌دهید؟")) return;
    setBusy(true); setActionError("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setActionError(d.error || "تغییر وضعیت ناموفق بود");
    } finally { setBusy(false); reload(); }
  }

  if (error) return <EmptyState title="سفارش پیدا نشد" desc={error} action={<Button href="/admin/sales" icon={<ArrowRight size={15}/>}>بازگشت به فروش</Button>}/>;
  if (loading || !o) return <EmptyState title="در حال بارگذاری..."/>;

  const cancelled = o.status === "cancelled";
  const at = STEPS.indexOf(o.status);
  // خط زمانی: ثبت، پرداخت (در صورت وجود) و تغییرهای ثبت‌شده توسط مدیران
  const events = [
    { label: "ثبت سفارش", at: o.createdAt, by: "" },
    ...(o.payment.paidAt ? [{ label: "پرداخت موفق در درگاه", at: o.payment.paidAt, by: "" }] : []),
    ...o.history.map(h => ({ label: `وضعیت: ${ORDER_STATUS[h.status] || h.status}`, at: h.at, by: h.by })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return <>
    <PageHeader title={`سفارش ${o.code}`} subtitle={`ثبت‌شده در ${jDateTime(o.createdAt)}`} eyebrow="COMMERCE / ORDER" action={<Button variant="secondary" href="/admin/sales" icon={<ArrowRight size={15}/>}>بازگشت به فروش</Button>}/>
    {actionError && <div className="form-error">{actionError}</div>}
    <div className="detail-grid">
      <div className="detail-col">
        <Panel title="وضعیت سفارش" subtitle={cancelled ? "این سفارش لغو شده و دیگر قابل تغییر نیست." : o.next.length ? "فقط انتقال‌های مجاز از وضعیت فعلی نمایش داده می‌شود." : "این سفارش تکمیل شده است."}>
          {cancelled ? <Badge tone="danger">{ORDER_STATUS.cancelled}</Badge> : <div className="flow-steps">{STEPS.map((s, i) => <span key={s} className={i < at ? "done" : i === at ? "now" : ""}>{ORDER_STATUS[s]}</span>)}</div>}
          {o.next.length > 0 && <div className="flow-actions">{o.next.map(s => <Button key={s} variant={ACTION[s].variant} icon={ACTION[s].icon} disabled={busy} onClick={() => move(s)}>{ACTION[s].label}</Button>)}</div>}
        </Panel>
        <Panel title="اقلام سفارش" subtitle={`${fa(o.items.length)} قلم کالا`}>
          <Table empty="کالایی ثبت نشده" headers={["کالا", "قیمت واحد (تومان)", "تعداد", "جمع (تومان)"]} rows={[
            ...o.items.map(i => [i.productId ? <Link className="link-text" href={`/admin/inventory/${i.productId}`}>{i.name}</Link> : <span>{i.name} <small className="muted-cell">(حذف‌شده از انبار)</small></span>, fa(i.price), fa(i.qty), fa(i.price * i.qty)]),
            [<b>جمع کل سفارش</b>, "", "", <b>{fa(o.total)}</b>],
          ]}/>
        </Panel>
        <Panel title="سابقه‌ی سفارش" subtitle="رویدادها از قدیم به جدید">
          <div className="timeline-list">{events.map((e, i) => <div className="timeline-item" key={i}><span className="timeline-icon info"><CheckCircle2 size={15}/></span><div><b>{e.label}</b><small>{jDateTime(e.at)}{e.by ? ` · ${e.by}` : ""}</small></div></div>)}</div>
        </Panel>
      </div>
      <div className="detail-col">
        <Panel title="مشتری و آدرس تحویل">
          <dl className="kv-list">
            <div><dt>نام</dt><dd>{o.customer.name}</dd></div>
            <div><dt><Phone size={12}/> موبایل</dt><dd className="mono">{o.customer.phone || "—"}</dd></div>
            <div><dt><MapPin size={12}/> آدرس</dt><dd style={{ whiteSpace: "pre-wrap" }}>{o.customer.address || "—"}</dd></div>
            {o.note && <div><dt>توضیح مشتری</dt><dd style={{ whiteSpace: "pre-wrap" }}>{o.note}</dd></div>}
          </dl>
          {o.customer.phone && <p style={{ marginTop: 14 }}><Link className="table-action-link" href={`/admin/customers/${o.customer.phone}`}>مشاهده پرونده‌ی مشتری</Link></p>}
        </Panel>
        <Panel title="پرداخت">
          <dl className="kv-list">
            <div><dt>روش</dt><dd><Badge tone={o.method === "installment" ? "info" : "neutral"}>{METHOD[o.method]}</Badge></dd></div>
            <div><dt>وضعیت</dt><dd>{o.payment.status ? <Badge tone={o.payment.status === "paid" ? "success" : o.payment.status === "failed" ? "danger" : "warning"}>{PAY[o.payment.status]}</Badge> : o.method === "installment" ? <span className="muted-cell">درخواست اقساطی؛ پرداخت آنلاین ندارد</span> : "—"}</dd></div>
            <div><dt>مبلغ</dt><dd><b>{fa(o.total)}</b> تومان</dd></div>
            {o.payment.ref && <div><dt>کد پیگیری</dt><dd className="mono">{o.payment.ref}</dd></div>}
            {o.payment.paidAt && <div><dt>زمان پرداخت</dt><dd>{jDateTime(o.payment.paidAt)}</dd></div>}
            {o.shippedAt && <div><dt>زمان ارسال</dt><dd>{jDateTime(o.shippedAt)}</dd></div>}
          </dl>
        </Panel>
        <Panel title="وضعیت فعلی"><Badge tone={statusTone(o.status)}>{ORDER_STATUS[o.status]}</Badge> <small className="muted-cell">آخرین تغییر: {jDateTime(o.updatedAt)}</small></Panel>
      </div>
    </div>
  </>;
}
