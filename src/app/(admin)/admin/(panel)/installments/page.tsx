"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, CreditCard, Users, Wallet, XCircle } from "lucide-react";
import { Badge, EmptyState, PageHeader, Panel, Pagination, SearchInput, SelectField, StatCard, Table } from "@/admin/components/ui";
import { fa, jDate, ORDER_STATUS, OrderStatus, OrdersPage, qs, statusTone, useApi, useDebounced } from "@/admin/lib/api";

const PAGE_SIZE = 20;
type CRow = { userId: string | null; name: string; phone: string; orders: number; totalCount: number; paidCount: number; remainingCount: number; remainingAmount: number; overdueCount: number; overdueAmount: number; maxDaysLate: number; downDueCount: number; downDueAmount: number; next: { code: string; no: number; dueDate: string; amount: number; daysLeft: number } | null };
type CPage = { items: CRow[]; total: number; page: number; pageSize: number; pages: number; summary: { customers: number; overdueCustomers: number; overdueAmount: number; remainingAmount: number; dueSoon: number; downDue: number } };

// وضعیت اقساط مشتریان برای فروشنده: چند قسط دارد، چند تا مانده، تا سررسید چند روز، چند روز عقب افتاده
function CustomersOverview() {
  const [q, setQ] = useState(""); const [f, setF] = useState("all"); const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, error, loading } = useApi<CPage>(`/api/admin/installments${qs({ q: dq, filter: f === "all" ? "" : f, page })}`, 30000);
  const s = data?.summary;
  return <>
    <div className="stats-grid stats-four">
      <StatCard label="مشتریان دارای اقساط" value={fa(s?.customers ?? 0)} hint={`${fa(s?.dueSoon ?? 0)} نفر سررسید تا ۷ روز آینده`} icon={<Users size={18}/>} tone="blue"/>
      <StatCard label="مانده‌ی اقساط (تومان)" value={fa(s?.remainingAmount ?? 0)} hint="جمع اقساط پرداخت‌نشده" icon={<Wallet size={18}/>} tone="violet"/>
      <StatCard label="مشتریان معوق" value={fa(s?.overdueCustomers ?? 0)} hint={`${fa(s?.overdueAmount ?? 0)} تومان معوق`} icon={<AlertTriangle size={18}/>} tone="red"/>
      <StatCard label="پیش‌پرداخت پرداخت‌نشده" value={fa(s?.downDue ?? 0)} hint="تأییدشده ولی هنوز پرداخت نشده" icon={<Clock3 size={18}/>} tone="amber"/>
    </div>
    <Panel title="وضعیت اقساط مشتریان" subtitle="برای دیدن جدول کامل هر مشتری و پرونده‌ی اعتباری، روی نام او بزنید.">
      {error && <div className="form-error">{error}</div>}
      <div className="table-toolbar"><SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="نام یا موبایل مشتری..."/>
        <SelectField value={f} onChange={v => { setF(v); setPage(1); }} options={[{ label: "همه مشتریان", value: "all" }, { label: "دارای قسط معوق", value: "overdue" }, { label: "سررسید تا ۷ روز", value: "soon" }, { label: "پیش‌پرداخت پرداخت‌نشده", value: "down" }]}/></div>
      <Table empty={loading ? "در حال بارگذاری..." : "مشتری‌ای مطابق فیلتر نیست"} headers={["مشتری", "کل اقساط", "پرداخت‌شده", "مانده", "مبلغ مانده (تومان)", "معوق", "قسط بعدی", "پیش‌پرداخت"]}
        rows={(data?.items ?? []).map(r => [
          r.userId ? <Link className="link-text" href={`/admin/risk/${r.userId}`}><b>{r.name}</b><small className="muted-cell"> {r.phone}</small></Link> : <div><b>{r.name}</b><small className="muted-cell"> {r.phone}</small></div>,
          fa(r.totalCount), fa(r.paidCount), fa(r.remainingCount), fa(r.remainingAmount),
          r.overdueCount ? <Badge tone="danger">{fa(r.overdueCount)} قسط · {fa(r.overdueAmount)} · {r.maxDaysLate > 0 ? `${fa(r.maxDaysLate)} روز تأخیر` : "امروز سررسید"}</Badge> : <Badge tone="success">ندارد</Badge>,
          r.next ? <div><b>{fa(r.next.amount)}</b><small className="muted-cell"> {jDate(r.next.dueDate)} · {fa(r.next.daysLeft)} روز دیگر</small></div> : "—",
          r.downDueCount ? <Badge tone="warning">{fa(r.downDueAmount)} تومان</Badge> : <small className="muted-cell">—</small>])}/>
      <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} pageSize={data?.pageSize ?? 20} onPage={setPage}/>
    </Panel>
  </>;
}

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
    <PageHeader title="درخواست‌های اقساطی" subtitle="وضعیت اقساط مشتریان (کل، پرداخت‌شده، مانده، سررسید و تأخیر) و درخواست‌های اقساطی. مشتری اقساط را خودش با درگاه پرداخت می‌کند." eyebrow="CREDIT / INSTALLMENTS"/>
    <CustomersOverview/>
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
