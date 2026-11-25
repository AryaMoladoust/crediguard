"use client";
import type React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Banknote, ChartColumn, CircleDollarSign, CreditCard, Users } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, Panel, Pagination, SearchInput, StatCard, Table } from "@/admin/components/ui";
import { CATEGORY, fa, jDate, METHOD, money, ORDER_STATUS, OrdersPage, qs, statusTone, useApi, useDebounced } from "@/admin/lib/api";

type Groups = { groups: { key: string; count: number; total: number }[]; count: number; total: number };
const config: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
  "payment-type": { title: "تحلیل نوع پرداخت", desc: "سهم سفارش‌های نقدی و اقساطی از فروش.", icon: <Banknote size={18}/> },
  status: { title: "تحلیل وضعیت سفارش", desc: "تفکیک سفارش‌ها بر اساس وضعیت پردازش.", icon: <CreditCard size={18}/> },
  category: { title: "فروش بر اساس دسته کالا", desc: "سهم هر دسته از فروش؛ مبلغ هر ردیف کالا به دسته‌ی همان کالا نسبت داده می‌شود.", icon: <ChartColumn size={18}/> },
  customer: { title: "خرید به تفکیک مشتری", desc: "مجموع سفارش‌های هر مشتری (۱۰۰ مشتری برتر).", icon: <Users size={18}/> },
  amount: { title: "تحلیل بازه‌های مبلغ", desc: "توزیع سفارش‌ها در بازه‌های مبلغ.", icon: <CircleDollarSign size={18}/> },
};
const labelOf = (dim: string, key: string) => dim === "payment-type" ? METHOD[key] || key : dim === "status" ? ORDER_STATUS[key] || key : dim === "category" ? CATEGORY[key] || "نامشخص" : key;
const PAGE_SIZE = 20;

export default function FinanceDimensionPage() {
  const { dimension } = useParams<{ dimension: string }>();
  const dim = config[dimension] ? dimension : "status";
  const data = config[dim];
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  // جز بُعد «وضعیت»، سفارش‌های لغوشده در جمع‌ها و جدول نیستند
  const { data: g, error, loading } = useApi<Groups>(`/api/admin/finance/groups${qs({ dimension: dim, q: dq })}`, 30000);
  const { data: list } = useApi<OrdersPage>(`/api/admin/orders${qs({ q: dq, status: dim === "status" ? "" : "active", page, pageSize: PAGE_SIZE })}`, 30000);
  const groups = g?.groups ?? [];
  const max = Math.max(...groups.map(x => x.total), 1);
  return <>
    <PageHeader title={data.title} subtitle={data.desc} eyebrow="FINANCE / ANALYTICS" action={<Button href="/admin/finance" variant="secondary" icon={<ArrowRight size={15}/>}>بازگشت</Button>}/>
    {error && <div className="form-error">{error}</div>}
    {!loading && g && !g.count && !dq ? <Panel title="بدون داده" subtitle=""><EmptyState title="هنوز سفارشی ثبت نشده"/></Panel> : <>
      <div className="stats-grid stats-three">
        <StatCard label="تعداد سفارش" value={fa(g?.count ?? 0)} hint={dim === "status" ? "شامل لغوشده" : "بدون لغوشده"} icon={data.icon} tone="blue"/>
        <StatCard label="مجموع مبلغ" value={money(g?.total ?? 0)} icon={<CircleDollarSign size={18}/>} tone="green"/>
        <StatCard label="تعداد گروه‌ها" value={fa(groups.length)} hint="گروه دارای سفارش" icon={<ChartColumn size={18}/>} tone="violet"/>
      </div>
      <Panel title="خلاصه تفکیکی" subtitle="تعداد و مجموع مبلغ هر گروه.">
        <div className="table-toolbar"><SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="جست‌وجوی سفارش، مشتری یا کالا..."/></div>
        <div className="dimension-bars">{groups.map(x => <div className="dimension-bar-row" key={x.key}><div><b>{labelOf(dim, x.key)}</b><small>{fa(x.count)} سفارش</small></div><div className="dimension-track"><span style={{ width: `${Math.max(6, (x.total / max) * 100)}%` }}/></div><strong>{money(x.total)}</strong></div>)}{!loading && !groups.length && <p className="muted-cell">موردی نیست</p>}</div>
      </Panel>
      <Panel title="جزئیات" subtitle="سفارش‌های مرتبط با این تحلیل.">
        <Table empty="موردی نیست" headers={["شماره سفارش", "تاریخ", "مشتری", "دسته کالا", "نوع پرداخت", "مبلغ", "وضعیت"]} rows={(list?.items ?? []).map(t => [<Link className="mono link-text" href={`/admin/sales/${t.id}`}><b>{t.code}</b></Link>, jDate(t.createdAt), t.customer, t.categories.map(c => CATEGORY[c] || c).join("، ") || "—", METHOD[t.method], money(t.total), <Badge tone={statusTone(t.status)}>{ORDER_STATUS[t.status]}</Badge>])}/>
        <Pagination page={list?.page ?? 1} pages={list?.pages ?? 1} total={list?.total ?? 0} pageSize={PAGE_SIZE} onPage={setPage}/>
      </Panel>
    </>}
  </>;
}
