"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, XCircle } from "lucide-react";
import { Badge, EmptyState, PageHeader, Panel, SearchInput, SelectField, StatCard, Table } from "@/admin/components/ui";
import { fa, jDate, ORDER_STATUS, Order, statusTone, useApi } from "@/admin/lib/api";

export default function InstallmentsPage() {
  const { data, error, loading } = useApi<Order[]>("/api/admin/orders", 20000);
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const list = useMemo(() => (data ?? []).filter(o => o.method === "installment"), [data]);
  const filtered = list.filter(o => (state === "all" || o.status === state) && (!q || `${o.code} ${o.customer} ${o.phone} ${o.product}`.toLowerCase().includes(q.toLowerCase())));
  const live = list.filter(o => o.status !== "cancelled");
  return <>
    <PageHeader title="درخواست‌های اقساطی" subtitle="سفارش‌هایی که مشتری روش «خرید اقساطی» را انتخاب کرده است. برنامه‌ی اقساط و وصول هنوز به بک‌اند وصل نیست." eyebrow="CREDIT / INSTALLMENTS"/>
    {error && <div className="form-error">{error}</div>}
    <div className="stats-grid stats-four">
      <StatCard label="کل درخواست‌ها" value={fa(list.length)} hint="سفارش اقساطی" icon={<CreditCard size={18}/>} tone="blue"/>
      <StatCard label="در انتظار بررسی" value={fa(list.filter(o => o.status === "pending").length)} hint="نیازمند تصمیم" icon={<Clock3 size={18}/>} tone="amber"/>
      <StatCard label="تأییدشده/تکمیل" value={fa(list.filter(o => o.status === "confirmed" || o.status === "completed").length)} hint="سفارش" icon={<CheckCircle2 size={18}/>} tone="green"/>
      <StatCard label="لغوشده" value={fa(list.filter(o => o.status === "cancelled").length)} hint={`مجموع فعال: ${fa(live.reduce((s, o) => s + o.total, 0))} تومان`} icon={<XCircle size={18}/>} tone="red"/>
    </div>
    <Panel title="فهرست درخواست‌ها" subtitle="تغییر وضعیت از صفحه‌ی «فروش» انجام می‌شود.">
      <div className="table-toolbar"><SearchInput value={q} onChange={setQ} placeholder="شماره سفارش، مشتری یا کالا..."/><SelectField value={state} onChange={setState} options={[{ label: "همه وضعیت‌ها", value: "all" }, ...Object.entries(ORDER_STATUS).map(([value, label]) => ({ label, value }))]}/></div>
      {!loading && !list.length ? <EmptyState title="هنوز درخواست اقساطی ثبت نشده" desc="وقتی مشتری در فروشگاه «درخواست خرید اقساطی» را انتخاب کند، اینجا نمایش داده می‌شود."/> :
        <Table empty={loading ? "در حال بارگذاری..." : "موردی مطابق فیلتر نیست"} headers={["سفارش", "مشتری", "کالا", "تاریخ", "مبلغ (تومان)", "وضعیت"]} rows={filtered.map(o => [<b className="mono link-text">{o.code}</b>, <div><b>{o.customer}</b><small className="muted-cell"> {o.phone}</small></div>, o.product, jDate(o.createdAt), fa(o.total), <Badge tone={statusTone(o.status)}>{ORDER_STATUS[o.status]}</Badge>])}/>}
    </Panel>
  </>;
}
