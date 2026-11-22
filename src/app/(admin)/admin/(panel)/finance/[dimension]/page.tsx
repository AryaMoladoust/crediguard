"use client";
import type React from "react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Banknote, ChartColumn, CircleDollarSign, CreditCard, Download, Users } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, Panel, SearchInput, StatCard, Table } from "@/admin/components/ui";
import { fa, money } from "@/admin/lib/api";
import { amountBand, statusTone, useTransactions } from "@/admin/lib/finance";

const config: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
  "payment-type": { title: "تحلیل نوع پرداخت", desc: "سهم سفارش‌های نقدی و اقساطی از فروش.", icon: <Banknote size={18}/> },
  status: { title: "تحلیل وضعیت سفارش", desc: "تفکیک سفارش‌ها بر اساس وضعیت پردازش.", icon: <CreditCard size={18}/> },
  category: { title: "فروش بر اساس دسته کالا", desc: "سهم هر دسته‌ی کالایی از سفارش‌ها.", icon: <ChartColumn size={18}/> },
  customer: { title: "خرید به تفکیک مشتری", desc: "مجموع سفارش‌های هر مشتری.", icon: <Users size={18}/> },
  amount: { title: "تحلیل بازه‌های مبلغ", desc: "توزیع سفارش‌ها در بازه‌های مبلغ.", icon: <CircleDollarSign size={18}/> },
};
export default function FinanceDimensionPage() {
  const { dimension } = useParams<{ dimension: string }>();
  const data = config[dimension] || config.status;
  const { txs, error, loading } = useTransactions();
  const [q, setQ] = useState("");
  const rows = useMemo(() => txs.filter(t => t.statusKey !== "cancelled" || dimension === "status").filter(t => !q || `${t.id} ${t.customer} ${t.category}`.toLowerCase().includes(q.toLowerCase())), [txs, q, dimension]);
  const groups = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    rows.forEach(t => { const k = dimension === "payment-type" ? t.type : dimension === "status" ? t.status : dimension === "category" ? t.category : dimension === "customer" ? t.customer : amountBand(t.amount); const v = map.get(k) || { count: 0, total: 0 }; v.count++; v.total += t.amount; map.set(k, v); });
    return Array.from(map.entries()).map(([label, v]) => ({ label, ...v })).sort((a, b) => b.total - a.total);
  }, [rows, dimension]);
  const max = Math.max(...groups.map(g => g.total), 1);
  return <>
    <PageHeader title={data.title} subtitle={data.desc} eyebrow="FINANCE / ANALYTICS" action={<Button href="/admin/finance" variant="secondary" icon={<ArrowRight size={15}/>}>بازگشت</Button>}/>
    {error && <div className="form-error">{error}</div>}
    {!loading && !txs.length ? <Panel title="بدون داده" subtitle=""><EmptyState title="هنوز سفارشی ثبت نشده"/></Panel> : <>
      <div className="stats-grid stats-three">
        <StatCard label="تعداد سفارش" value={fa(rows.length)} hint={dimension === "status" ? "شامل لغوشده" : "بدون لغوشده"} icon={data.icon} tone="blue"/>
        <StatCard label="مجموع مبلغ" value={money(rows.reduce((s, t) => s + t.amount, 0))} icon={<CircleDollarSign size={18}/>} tone="green"/>
        <StatCard label="تعداد گروه‌ها" value={fa(groups.length)} hint="گروه دارای سفارش" icon={<ChartColumn size={18}/>} tone="violet"/>
      </div>
      <Panel title="خلاصه تفکیکی" subtitle="تعداد و مجموع مبلغ هر گروه.">
        <div className="table-toolbar"><SearchInput value={q} onChange={setQ} placeholder="جست‌وجوی سفارش یا مشتری..."/><Button variant="secondary" icon={<Download size={15}/>} onClick={() => window.print()}>چاپ گزارش</Button></div>
        <div className="dimension-bars">{groups.map(g => <div className="dimension-bar-row" key={g.label}><div><b>{g.label}</b><small>{fa(g.count)} سفارش</small></div><div className="dimension-track"><span style={{ width: `${Math.max(6, (g.total / max) * 100)}%` }}/></div><strong>{money(g.total)}</strong></div>)}</div>
      </Panel>
      <Panel title="جزئیات" subtitle="سفارش‌های مرتبط با این تحلیل.">
        <Table empty="موردی نیست" headers={["شماره سفارش", "تاریخ", "مشتری", "دسته کالا", "نوع پرداخت", "مبلغ", "وضعیت"]} rows={rows.map(t => [<b className="mono link-text">{t.id}</b>, t.date, t.customer, t.category, t.type, money(t.amount), <Badge tone={statusTone(t.statusKey)}>{t.status}</Badge>])}/>
      </Panel>
    </>}
  </>;
}
