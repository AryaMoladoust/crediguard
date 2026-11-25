"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpRight, CircleDollarSign, PackageCheck, ShoppingBag } from "lucide-react";
import { Avatar, Badge, PageHeader, Panel, Pagination, SearchInput, SelectField, StatCard, Table } from "@/admin/components/ui";
import { fa, jDate, METHOD, ORDER_STATUS, Order, OrdersPage, qs, statusTone, useApi, useDebounced } from "@/admin/lib/api";
import { nextStatuses } from "@/lib/order-flow";

const PAGE_SIZE = 20;
type Stats = { today: { sales: number; orders: number; installment: number }; pending: number; avgOrder: number };

export default function SalesPage() {
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("all");
  const [state, setState] = useState("all");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const dq = useDebounced(query);
  const filters = { q: dq, method: method === "all" ? "" : method, status: state === "all" ? "" : state };

  // صفحه‌بندی، فیلتر و جست‌وجو سمت سرور؛ کارت‌های بالا هم از آمار کل دیتابیس می‌آیند (نه از همین صفحه)
  const { data, error, loading, reload } = useApi<OrdersPage>(`/api/admin/orders${qs({ ...filters, page, pageSize: PAGE_SIZE })}`, 15000);
  const { data: stats, reload: reloadStats } = useApi<Stats>("/api/admin/stats", 15000);
  const orders = data?.items ?? [];

  async function changeStatus(o: Order, status: string) {
    if (status === o.status) return;
    if (status === "cancelled" && !window.confirm("با لغو سفارش، موجودی کالاها به انبار برمی‌گردد و دیگر قابل تغییر نیست. ادامه می‌دهید؟")) return;
    const res = await fetch(`/api/admin/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setActionError(d.error || "تغییر وضعیت ناموفق بود"); reload(); return; }
    setActionError(""); reload(); reloadStats();
  }
  const exportUrl = `/api/admin/orders/export${qs(filters)}`;

  return <>
    <PageHeader title="مدیریت فروش" subtitle="سفارش‌های ثبت‌شده در فروشگاه، روش پرداخت و وضعیت پردازش." eyebrow="COMMERCE / ORDERS" action={<a className="btn btn-secondary" href={exportUrl}><span className="btn-icon"><ArrowDownToLine size={16}/></span><span>خروجی CSV سفارش‌ها</span></a>}/>
    <div className="stats-grid stats-four">
      <StatCard label="سفارش‌های امروز" value={fa(stats?.today.orders ?? 0)} hint={`${fa(stats?.today.installment ?? 0)} سفارش اقساطی`} icon={<ShoppingBag size={18}/>} tone="blue"/>
      <StatCard label="مبلغ فروش امروز" value={fa(stats?.today.sales ?? 0)} hint="تومان" icon={<CircleDollarSign size={18}/>} tone="green"/>
      <StatCard label="در انتظار پردازش" value={fa(stats?.pending ?? 0)} hint="نیازمند تأیید" icon={<PackageCheck size={18}/>} tone="amber"/>
      <StatCard label="میانگین ارزش سفارش" value={fa(stats?.avgOrder ?? 0)} hint="تومان" icon={<ArrowUpRight size={18}/>} tone="violet"/>
    </div>
    {(error || actionError) && <div className="form-error">{actionError || error}</div>}
    <Panel title="فهرست سفارش‌ها" subtitle="برای آدرس، اقلام و پرداخت روی شماره سفارش بزنید. وضعیت فقط طبق ترتیب «در انتظار ← تأیید ← ارسال ← تکمیل» جلو می‌رود؛ لغو تا پیش از ارسال ممکن است.">
      <div className="table-toolbar">
        <SearchInput value={query} onChange={v => { setQuery(v); setPage(1); }} placeholder="جست‌وجوی شماره سفارش، مشتری، موبایل یا کالا..."/>
        <SelectField value={method} onChange={v => { setMethod(v); setPage(1); }} options={[{ label: "همه روش‌ها", value: "all" }, { label: "اقساطی", value: "installment" }, { label: "نقدی", value: "cash" }]}/>
        <SelectField value={state} onChange={v => { setState(v); setPage(1); }} options={[{ label: "همه وضعیت‌ها", value: "all" }, ...Object.entries(ORDER_STATUS).map(([value, label]) => ({ label, value }))]}/>
        <span className="filter-count">{fa(data?.total ?? 0)} نتیجه</span>
      </div>
      <Table
        empty={loading ? "در حال بارگذاری..." : data?.total === 0 && !dq && method === "all" && state === "all" ? "هنوز سفارشی ثبت نشده است" : "سفارشی مطابق فیلترها پیدا نشد"}
        headers={["شماره سفارش", "مشتری", "محصول", "تاریخ ثبت", "مبلغ (تومان)", "روش پرداخت", "وضعیت", "تغییر وضعیت"]}
        rows={orders.map(o => {
          const next = nextStatuses(o.status) as string[];
          return [
            <Link className="mono link-text" href={`/admin/sales/${o.id}`}><b>{o.code}</b></Link>,
            <div className="table-person"><Avatar name={o.customer} size="sm"/><div><b>{o.customer}</b><small>{o.phone}</small></div></div>,
            o.product,
            jDate(o.createdAt),
            fa(o.total),
            <Badge tone={o.method === "installment" ? "info" : "neutral"}>{METHOD[o.method]}</Badge>,
            <Badge tone={statusTone(o.status)}>{ORDER_STATUS[o.status]}</Badge>,
            next.length
              ? <SelectField value={o.status} onChange={v => changeStatus(o, v)} options={[o.status, ...next].map(value => ({ label: ORDER_STATUS[value], value }))}/>
              : <span className="muted-cell">—</span>,
          ];
        })}
      />
      <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} pageSize={PAGE_SIZE} onPage={setPage}/>
      <div className="table-footer"><span>بروزرسانی خودکار هر ۱۵ ثانیه</span></div>
    </Panel>
  </>;
}
