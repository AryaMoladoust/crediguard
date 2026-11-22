"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, UserRoundSearch, Repeat, CreditCard, Wallet } from "lucide-react";
import { Avatar, Badge, Button, EmptyState, PageHeader, Panel, SearchInput, SelectField, StatCard, Table } from "@/admin/components/ui";
import { Customer, fa, jDate, useApi } from "@/admin/lib/api";

type Mode = "all" | "overdue" | "blocked" | "new";
const NEW_DAYS = 30;
const TITLES: Record<Mode, [string, string]> = {
  all: ["مشتریان فروشگاه", "همه‌ی خریدارانی که حداقل یک سفارش ثبت کرده‌اند (بر اساس شماره موبایل)."],
  new: ["مشتریان جدید", `مشتریانی که اولین سفارش‌شان در ${NEW_DAYS} روز اخیر ثبت شده است.`],
  overdue: ["مشتریان معوق‌شده", "پیگیری اقساط سررسیدشده."],
  blocked: ["مشتریان مسدودشده", "حساب‌های محدودشده به‌دلیل ریسک یا تخلف."],
};
const csvCell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replaceAll('"', '""')}"`; };

export function CustomersTable({ mode = "all" }: { mode?: Mode }) {
  const { data, error, loading } = useApi<Customer[]>("/api/admin/customers", 30000);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const all = data ?? [];
  const filtered = useMemo(() => {
    const limit = Date.now() - NEW_DAYS * 86400000;
    let list = mode === "new" ? all.filter(c => new Date(c.first).getTime() >= limit) : all;
    if (query) list = list.filter(c => `${c.name} ${c.phone}`.toLowerCase().includes(query.toLowerCase()));
    if (sort === "spent") list = [...list].sort((a, b) => b.spent - a.spent);
    if (sort === "orders") list = [...list].sort((a, b) => b.orders - a.orders);
    return list;
  }, [all, mode, query, sort]);
  const [title, subtitle] = TITLES[mode];
  const unavailable = mode === "overdue" || mode === "blocked";
  const exportCsv = () => {
    const csv = ["Phone,Name,Orders,Total spent (Toman),Installment orders,First order,Last order", ...filtered.map(c => [c.phone, c.name, c.orders, c.spent, c.installmentOrders, c.first, c.last].map(csvCell).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "mobiler-customers.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return <>
    <PageHeader title={title} subtitle={subtitle} eyebrow="CUSTOMERS" action={!unavailable && <Button variant="secondary" icon={<Download size={16}/>} onClick={exportCsv} disabled={!filtered.length}>خروجی CSV</Button>}/>
    {error && <div className="form-error">{error}</div>}
    {unavailable ? <Panel title={title} subtitle={subtitle}><EmptyState title="این بخش هنوز داده‌ای ندارد" desc="وضعیت معوق یا مسدود به ماژول اقساط و اعتبارسنجی وابسته است که هنوز به بک‌اند وصل نشده؛ به‌جای داده نمونه، چیزی نمایش داده نمی‌شود."/></Panel> : <>
      <div className="stats-grid stats-four compact-stats">
        <StatCard label="کل مشتریان" value={fa(all.length)} hint="خریدار یکتا" icon={<UserRoundSearch size={18}/>} tone="blue"/>
        <StatCard label="مشتری تکراری" value={fa(all.filter(c => c.activeOrders > 1).length)} hint="بیش از یک سفارش" icon={<Repeat size={18}/>} tone="green"/>
        <StatCard label="خریدار اقساطی" value={fa(all.filter(c => c.installmentOrders > 0).length)} hint="دست‌کم یک سفارش اقساطی" icon={<CreditCard size={18}/>} tone="violet"/>
        <StatCard label="مجموع خرید" value={fa(all.reduce((s, c) => s + c.spent, 0))} hint="تومان (بدون لغوشده)" icon={<Wallet size={18}/>} tone="amber"/>
      </div>
      <Panel title="فهرست مشتریان" subtitle={`${fa(filtered.length)} مشتری مطابق فیلترها`}>
        <div className="table-toolbar"><SearchInput value={query} onChange={setQuery} placeholder="نام یا شماره موبایل..."/><SelectField value={sort} onChange={setSort} options={[{ label: "مرتب‌سازی: آخرین سفارش", value: "recent" }, { label: "بیشترین خرید", value: "spent" }, { label: "بیشترین سفارش", value: "orders" }]}/></div>
        <Table empty={loading ? "در حال بارگذاری..." : "هنوز مشتری‌ای ثبت نشده است"} headers={["مشتری", "شماره موبایل", "تعداد سفارش", "مجموع خرید (تومان)", "سفارش اقساطی", "آخرین سفارش", "پرونده"]} rows={filtered.map(c => [
          <Link className="table-person table-person-link" href={`/admin/customers/${c.phone}`}><Avatar name={c.name} size="sm"/><div><b>{c.name}</b></div></Link>,
          <span className="mono muted-cell">{c.phone}</span>, fa(c.orders), fa(c.spent),
          c.installmentOrders ? <Badge tone="info">{fa(c.installmentOrders)} سفارش</Badge> : <span className="muted-cell">—</span>,
          <span className="muted-cell">{jDate(c.last)}</span>,
          <Link className="table-action-link" href={`/admin/customers/${c.phone}`}>مشاهده پرونده</Link>])}/>
        <div className="table-footer"><span>نمایش {fa(filtered.length)} مورد</span><span>از سفارش‌های واقعی فروشگاه</span></div>
      </Panel>
    </>}
  </>;
}
