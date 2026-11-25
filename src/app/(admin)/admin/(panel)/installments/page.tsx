"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, CreditCard, XCircle } from "lucide-react";
import { Badge, EmptyState, PageHeader, Panel, Pagination, SearchInput, SelectField, StatCard, Table } from "@/admin/components/ui";
import { fa, jDate, ORDER_STATUS, OrderStatus, OrdersPage, qs, statusTone, useApi, useDebounced } from "@/admin/lib/api";

const PAGE_SIZE = 20;
export default function InstallmentsPage() {
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  // فقط سفارش‌های اقساطی، با صفحه‌بندی و آمار کل از سرور
  const { data, error, loading } = useApi<OrdersPage>(`/api/admin/orders${qs({ method: "installment", q: dq, status: state === "all" ? "" : state, page, pageSize: PAGE_SIZE })}`, 20000);
  const by = data?.summary.byStatus;
  const all = by ? (Object.keys(by) as OrderStatus[]).reduce((s, k) => s + by[k].count, 0) : 0;
  const active = by ? (Object.keys(by) as OrderStatus[]).filter(k => k !== "cancelled").reduce((s, k) => s + by[k].sum, 0) : 0;
  const isEmpty = !loading && all === 0;
  return <>
    <PageHeader title="درخواست‌های اقساطی" subtitle="سفارش‌هایی که مشتری روش «خرید اقساطی» را انتخاب کرده است. برنامه‌ی اقساط و وصول هنوز به بک‌اند وصل نیست." eyebrow="CREDIT / INSTALLMENTS"/>
    {error && <div className="form-error">{error}</div>}
    <div className="stats-grid stats-four">
      <StatCard label="کل درخواست‌ها" value={fa(all)} hint="سفارش اقساطی" icon={<CreditCard size={18}/>} tone="blue"/>
      <StatCard label="در انتظار بررسی" value={fa(by?.pending.count ?? 0)} hint="نیازمند تصمیم" icon={<Clock3 size={18}/>} tone="amber"/>
      <StatCard label="تأییدشده تا تکمیل" value={fa((by?.confirmed.count ?? 0) + (by?.shipped.count ?? 0) + (by?.completed.count ?? 0))} hint="تأیید، ارسال یا تحویل" icon={<CheckCircle2 size={18}/>} tone="green"/>
      <StatCard label="لغوشده" value={fa(by?.cancelled.count ?? 0)} hint={`مجموع فعال: ${fa(active)} تومان`} icon={<XCircle size={18}/>} tone="red"/>
    </div>
    <Panel title="فهرست درخواست‌ها" subtitle="تغییر وضعیت از صفحه‌ی «فروش» یا جزئیات هر سفارش انجام می‌شود.">
      <div className="table-toolbar"><SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="شماره سفارش، مشتری یا کالا..."/><SelectField value={state} onChange={v => { setState(v); setPage(1); }} options={[{ label: "همه وضعیت‌ها", value: "all" }, ...Object.entries(ORDER_STATUS).map(([value, label]) => ({ label, value }))]}/></div>
      {isEmpty ? <EmptyState title="هنوز درخواست اقساطی ثبت نشده" desc="وقتی مشتری در فروشگاه «درخواست خرید اقساطی» را انتخاب کند، اینجا نمایش داده می‌شود."/> : <>
        <Table empty={loading ? "در حال بارگذاری..." : "موردی مطابق فیلتر نیست"} headers={["سفارش", "مشتری", "کالا", "تاریخ", "مبلغ (تومان)", "وضعیت"]} rows={(data?.items ?? []).map(o => [<Link className="mono link-text" href={`/admin/sales/${o.id}`}><b>{o.code}</b></Link>, <div><b>{o.customer}</b><small className="muted-cell"> {o.phone}</small></div>, o.product, jDate(o.createdAt), fa(o.total), <Badge tone={statusTone(o.status)}>{ORDER_STATUS[o.status]}</Badge>])}/>
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} pageSize={PAGE_SIZE} onPage={setPage}/>
      </>}
    </Panel>
  </>;
}
