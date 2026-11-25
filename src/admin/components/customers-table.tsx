"use client";
import { useState } from "react";
import Link from "next/link";
import { Download, UserRoundSearch, Repeat, CreditCard, Wallet } from "lucide-react";
import { Avatar, Badge, EmptyState, PageHeader, Panel, Pagination, SearchInput, SelectField, StatCard, Table } from "@/admin/components/ui";
import { CustomersPage, fa, jDate, qs, useApi, useDebounced } from "@/admin/lib/api";

type Mode = "all" | "overdue" | "blocked" | "new";
const NEW_DAYS = 30;
const PAGE_SIZE = 20;
const TITLES: Record<Mode, [string, string]> = {
  all: ["مشتریان فروشگاه", "همه‌ی خریدارانی که حداقل یک سفارش ثبت کرده‌اند (بر اساس شماره موبایل)."],
  new: ["مشتریان جدید", `مشتریانی که اولین سفارش‌شان در ${NEW_DAYS} روز اخیر ثبت شده است.`],
  overdue: ["مشتریان معوق‌شده", "پیگیری اقساط سررسیدشده."],
  blocked: ["مشتریان مسدودشده", "حساب‌های محدودشده به‌دلیل ریسک یا تخلف."],
};

export function CustomersTable({ mode = "all" }: { mode?: Mode }) {
  const unavailable = mode === "overdue" || mode === "blocked";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const dq = useDebounced(query);
  const filters = { q: dq, sort, mode: mode === "new" ? "new" : "" };
  // صفحه‌بندی، جست‌وجو و مرتب‌سازی سمت سرور؛ کارت‌های بالا خلاصه‌ی کل مشتریان‌اند، نه فقط این صفحه
  const { data, error, loading } = useApi<CustomersPage>(unavailable ? "" : `/api/admin/customers${qs({ ...filters, page, pageSize: PAGE_SIZE })}`, 30000);
  const list = data?.items ?? [];
  const sum = data?.summary;
  const [title, subtitle] = TITLES[mode];

  if (unavailable) return <>
    <PageHeader title={title} subtitle={subtitle} eyebrow="CUSTOMERS"/>
    <Panel title={title} subtitle={subtitle}><EmptyState title="این بخش هنوز داده‌ای ندارد" desc="وضعیت معوق یا مسدود به ماژول اقساط و اعتبارسنجی وابسته است که هنوز به بک‌اند وصل نشده؛ به‌جای داده نمونه، چیزی نمایش داده نمی‌شود."/></Panel>
  </>;

  return <>
    <PageHeader title={title} subtitle={subtitle} eyebrow="CUSTOMERS" action={<a className="btn btn-secondary" href={`/api/admin/customers/export${qs(filters)}`}><span className="btn-icon"><Download size={16}/></span><span>خروجی CSV</span></a>}/>
    {error && <div className="form-error">{error}</div>}
    <div className="stats-grid stats-four compact-stats">
      <StatCard label="کل مشتریان" value={fa(sum?.customers ?? 0)} hint="خریدار یکتا" icon={<UserRoundSearch size={18}/>} tone="blue"/>
      <StatCard label="مشتری تکراری" value={fa(sum?.repeat ?? 0)} hint="بیش از یک سفارش" icon={<Repeat size={18}/>} tone="green"/>
      <StatCard label="خریدار اقساطی" value={fa(sum?.installmentBuyers ?? 0)} hint="دست‌کم یک سفارش اقساطی" icon={<CreditCard size={18}/>} tone="violet"/>
      <StatCard label="مجموع خرید" value={fa(sum?.spent ?? 0)} hint="تومان (بدون لغوشده)" icon={<Wallet size={18}/>} tone="amber"/>
    </div>
    <Panel title="فهرست مشتریان" subtitle={`${fa(data?.total ?? 0)} مشتری مطابق فیلترها`}>
      <div className="table-toolbar"><SearchInput value={query} onChange={v => { setQuery(v); setPage(1); }} placeholder="نام یا شماره موبایل..."/><SelectField value={sort} onChange={v => { setSort(v); setPage(1); }} options={[{ label: "مرتب‌سازی: آخرین سفارش", value: "recent" }, { label: "بیشترین خرید", value: "spent" }, { label: "بیشترین سفارش", value: "orders" }]}/></div>
      <Table empty={loading ? "در حال بارگذاری..." : dq ? "مشتری‌ای مطابق جست‌وجو پیدا نشد" : "هنوز مشتری‌ای ثبت نشده است"} headers={["مشتری", "شماره موبایل", "تعداد سفارش", "مجموع خرید (تومان)", "سفارش اقساطی", "آخرین سفارش", "پرونده"]} rows={list.map(c => [
        <Link className="table-person table-person-link" href={`/admin/customers/${c.phone}`}><Avatar name={c.name} size="sm"/><div><b>{c.name}</b></div></Link>,
        <span className="mono muted-cell">{c.phone}</span>, fa(c.orders), fa(c.spent),
        c.installmentOrders ? <Badge tone="info">{fa(c.installmentOrders)} سفارش</Badge> : <span className="muted-cell">—</span>,
        <span className="muted-cell">{jDate(c.last)}</span>,
        <Link className="table-action-link" href={`/admin/customers/${c.phone}`}>مشاهده پرونده</Link>])}/>
      <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} pageSize={PAGE_SIZE} onPage={setPage}/>
    </Panel>
  </>;
}
