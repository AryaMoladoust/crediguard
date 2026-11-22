"use client";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/admin/components/ui";
import { ago, fa, jDateTime, METHOD, ORDER_STATUS, useApi } from "@/admin/lib/api";

type Events = { orders: { id: string; code: string; customer: string; total: number; method: string; status: string; updatedAt: string }[] };
export default function ActivityPage() {
  const { data, error, loading } = useApi<Events>("/api/admin/events", 20000);
  const list = data?.orders ?? [];
  return <>
    <PageHeader title="فعالیت‌ها" subtitle="آخرین تغییرات سفارش‌ها (بر اساس زمان آخرین به‌روزرسانی)." eyebrow="ACTIVITY"/>
    {error && <div className="form-error">{error}</div>}
    <Panel title="رویدادهای سفارش" subtitle={`${fa(list.length)} رویداد اخیر`}>
      {!loading && !list.length ? <EmptyState title="هنوز رویدادی ثبت نشده"/> :
        <div className="timeline-list">{list.map(o => <div className="timeline-item" key={o.id}>
          <span className={`timeline-icon ${o.status === "cancelled" ? "warning" : o.status === "pending" ? "info" : "success"}`}>{o.status === "cancelled" ? <XCircle size={15}/> : o.status === "pending" ? <Clock3 size={15}/> : <CheckCircle2 size={15}/>}</span>
          <div><b>سفارش {o.code} · {ORDER_STATUS[o.status]}</b><small>{o.customer} · {fa(o.total)} تومان · {METHOD[o.method]} · {jDateTime(o.updatedAt)}</small></div><time>{ago(o.updatedAt)}</time></div>)}</div>}
    </Panel>
  </>;
}
