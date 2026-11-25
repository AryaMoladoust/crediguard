"use client";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Box, CalendarDays, CheckCircle2, Clock3, CreditCard, Package, ShoppingBag, TrendingUp, Users, Wallet, XCircle } from "lucide-react";
import { Avatar, Badge, MiniLink, PageHeader, Panel, Progress, StatCard, Table } from "@/admin/components/ui";
import { ago, fa, METHOD, ORDER_STATUS, statusTone, useApi } from "@/admin/lib/api";

type Stats = {
  today: { sales: number; orders: number }; pending: number;
  statuses: Record<string, number>; installments: { count: number; sum: number };
  inventory: { total: number; ok: number; low: number; out: number };
  weeks: { sales: number; installment: number; orders: number }[];
  recent: { id: string; code: string; customer: string; product: string; total: number; method: string; status: string; createdAt: string }[];
};
type Events = { orders: { code: string; customer: string; total: number; status: string; updatedAt: string }[]; stock: { id: string; name: string; stock: number; minStock: number }[] };

export default function DashboardPage() {
  const { data: stats, error } = useApi<Stats>("/api/admin/stats", 20000);
  const { data: ev } = useApi<Events>("/api/admin/events", 20000);
  const inv = stats?.inventory ?? { total: 0, ok: 0, low: 0, out: 0 };
  const pct = (n: number) => (inv.total ? Math.round((n / inv.total) * 100) : 0);
  const weeks = stats?.weeks ?? [];
  const maxW = Math.max(...weeks.map(w => w.sales), 1);
  const totalSales = weeks.reduce((s, w) => s + w.sales, 0);
  const totalIns = weeks.reduce((s, w) => s + w.installment, 0);
  const st = stats?.statuses ?? { pending: 0, confirmed: 0, shipped: 0, completed: 0, cancelled: 0 };
  const stTotal = st.pending + st.confirmed + st.shipped + st.completed + st.cancelled;
  const today = new Intl.DateTimeFormat("fa-IR", { dateStyle: "full" }).format(new Date());
  const timeline = (ev?.orders ?? []).slice(0, 4);
  return <>
    <PageHeader title="داشبورد مدیریتی" subtitle="نمای لحظه‌ای از فروش، سفارش‌ها و موجودی انبار فروشگاه؛ همه‌ی اعداد از دیتابیس خوانده می‌شوند." eyebrow="OVERVIEW" action={<div className="header-date"><CalendarDays size={15}/> {today}</div>}/>
    {error && <div className="form-error">{error}</div>}
    <div className="stats-grid stats-four">
      <StatCard label="فروش امروز" value={fa(stats?.today.sales ?? 0)} hint={`تومان · ${fa(stats?.today.orders ?? 0)} سفارش`} icon={<ShoppingBag size={19}/>} tone="green"/>
      <StatCard label="سفارش‌های اقساطی فعال" value={fa(stats?.installments.count ?? 0)} hint={`${fa(stats?.installments.sum ?? 0)} تومان`} icon={<CreditCard size={19}/>} tone="blue"/>
      <StatCard label="در انتظار تأیید" value={fa(stats?.pending ?? 0)} hint="سفارش جدید" icon={<Clock3 size={19}/>} tone="violet"/>
      <StatCard label="هشدار موجودی" value={fa(inv.low + inv.out)} hint={`${fa(inv.out)} ناموجود · ${fa(inv.low)} کم‌موجود`} icon={<AlertTriangle size={19}/>} tone="red"/>
    </div>
    <div className="dashboard-grid main-dashboard-grid">
      <Panel title="روند فروش" subtitle="فروش ۸ هفته اخیر (بدون سفارش‌های لغوشده)" className="sales-chart-panel">
        <div className="chart-summary"><div><small>مجموع فروش</small><strong>{fa(totalSales)} تومان</strong><span className="positive-text"><TrendingUp size={13}/> {fa(weeks.reduce((s, w) => s + w.orders, 0))} سفارش</span></div><div><small>سفارش‌های اقساطی</small><strong>{fa(totalIns)} تومان</strong><span className="muted-text">{totalSales ? fa((totalIns / totalSales) * 100) : "۰"}٪ از فروش</span></div></div>
        <div className="chart-legend"><span><i className="legend-blue"/> فروش کل</span><span><i className="legend-cyan"/> اقساطی</span></div>
        <div className="bar-chart"><div className="chart-grid-lines"><i/><i/><i/><i/></div><div className="bar-chart-inner">{weeks.map((w, i) => <div className="bar-group" key={i} title={`${fa(w.sales)} تومان`}><div className="bars"><span className="bar bar-main" style={{ height: `${(w.sales / maxW) * 100}%` }}/><span className="bar bar-second" style={{ height: `${(w.installment / maxW) * 100}%` }}/></div><small>{i === weeks.length - 1 ? "این هفته" : `${fa(weeks.length - 1 - i)} هفته قبل`}</small></div>)}</div></div>
      </Panel>
      <Panel title="وضعیت سفارش‌ها" subtitle="توزیع همه‌ی سفارش‌های ثبت‌شده">
        <div className="inventory-states" style={{ padding: "6px 0" }}>
          {([["pending", "در انتظار", "amber"], ["confirmed", "تأییدشده", "blue"], ["shipped", "ارسال‌شده", "violet"], ["completed", "تکمیل‌شده", "green"], ["cancelled", "لغوشده", "red"]] as const).map(([k, l, c]) => <div key={k}><div><span>{l}</span><b>{fa(st[k])} سفارش</b></div><Progress value={stTotal ? (st[k] / stTotal) * 100 : 0} color={c}/></div>)}
        </div>
        <div className="risk-note"><Users size={15}/><span>مشتریان از روی سفارش‌ها ساخته می‌شوند.</span><Link href="/admin/customers">مشاهده</Link></div>
      </Panel>
    </div>
    <div className="dashboard-grid lower-dashboard-grid">
      <Panel title="آخرین سفارش‌ها" subtitle="آخرین سفارش‌های ثبت‌شده در فروشگاه" action={<MiniLink href="/admin/sales">همه سفارش‌ها</MiniLink>} className="recent-orders-panel">
        <Table empty="هنوز سفارشی ثبت نشده است" headers={["مشتری", "محصول", "مبلغ (تومان)", "روش", "وضعیت", "زمان"]} rows={(stats?.recent ?? []).map(r => [<div className="table-person"><Avatar name={r.customer} size="sm"/><div><b>{r.customer}</b><small>{r.code}</small></div></div>, r.product, fa(r.total), METHOD[r.method], <Badge tone={statusTone(r.status)}>{ORDER_STATUS[r.status]}</Badge>, <span className="muted-cell">{ago(r.createdAt)}</span>])}/>
      </Panel>
      <Panel title="نمای سریع عملیات" subtitle="میانبرهای پرکاربرد" className="quick-panel">
        <div className="quick-actions-grid"><Link href="/admin/inventory/new"><span className="quick-icon blue"><Package size={18}/></span><b>افزودن محصول</b><small>ثبت کالا در دیتابیس</small><ArrowLeft size={14}/></Link><Link href="/admin/sales"><span className="quick-icon green"><ShoppingBag size={18}/></span><b>سفارش‌ها</b><small>مدیریت وضعیت</small><ArrowLeft size={14}/></Link><Link href="/admin/customers"><span className="quick-icon amber"><Users size={18}/></span><b>مشتریان</b><small>خریداران فروشگاه</small><ArrowLeft size={14}/></Link><Link href="/admin/finance"><span className="quick-icon violet"><Wallet size={18}/></span><b>گزارش مالی</b><small>تراکنش‌ها و خروجی اکسل</small><ArrowLeft size={14}/></Link></div>
      </Panel>
    </div>
    <div className="dashboard-grid bottom-dashboard-grid">
      <Panel title="سلامت موجودی انبار" subtitle="وضعیت کلی کالاهای قابل فروش" action={<MiniLink href="/admin/inventory">مدیریت انبار</MiniLink>}>
        <div className="inventory-health"><div className="inventory-total"><Package size={19}/><strong>{fa(inv.total)}</strong><small>قلم کالا</small></div><div className="inventory-states"><div><div><span>موجودی کافی</span><b>{fa(inv.ok)} کالا</b></div><Progress value={pct(inv.ok)} color="green"/></div><div><div><span>موجودی کم</span><b>{fa(inv.low)} کالا</b></div><Progress value={pct(inv.low)} color="amber"/></div><div><div><span>ناموجود</span><b>{fa(inv.out)} کالا</b></div><Progress value={pct(inv.out)} color="red"/></div></div></div>
      </Panel>
      <Panel title="فعالیت‌های اخیر" subtitle="آخرین تغییرات سفارش‌ها" action={<MiniLink href="/admin/activity">همه فعالیت‌ها</MiniLink>}>
        <div className="timeline-list">{timeline.length ? timeline.map(o => <div className="timeline-item" key={o.code}><span className={`timeline-icon ${o.status === "cancelled" ? "warning" : o.status === "pending" ? "info" : "success"}`}>{o.status === "cancelled" ? <XCircle size={15}/> : o.status === "pending" ? <Box size={15}/> : <CheckCircle2 size={15}/>}</span><div><b>سفارش {o.code} · {ORDER_STATUS[o.status]}</b><small>{o.customer} · {fa(o.total)} تومان</small></div><time>{ago(o.updatedAt)}</time></div>) : <p className="muted-cell">فعالیتی ثبت نشده است.</p>}</div>
      </Panel>
    </div>
  </>;
}
