"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Banknote, CheckCircle2, ChartColumn, CircleDollarSign, FileSpreadsheet, Search, Wallet, XCircle } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, Panel, SearchInput, SelectField, StatCard, Table } from "@/admin/components/ui";
import { fa, money } from "@/admin/lib/api";
import { Tx, statusTone, useTransactions } from "@/admin/lib/finance";

const DAY = 86400000;
export default function FinanceClient() {
  const { txs, error, loading } = useTransactions();
  const [query, setQuery] = useState(""); const [period, setPeriod] = useState("month"); const [type, setType] = useState("all");
  const [status, setStatus] = useState("all"); const [minA, setMinA] = useState(""); const [maxA, setMaxA] = useState("");
  const filtered = useMemo(() => {
    const now = Date.now();
    const since = period === "week" ? now - 7 * DAY : period === "month" ? now - 30 * DAY : 0;
    const lo = minA ? Number(minA) : -Infinity, hi = maxA ? Number(maxA) : Infinity;
    return txs.filter((t: Tx) => t.ts >= since && (!query || `${t.id} ${t.customer} ${t.category}`.toLowerCase().includes(query.toLowerCase())) && (type === "all" || t.type === type) && (status === "all" || t.statusKey === status) && t.amount >= lo && t.amount <= hi);
  }, [txs, period, query, type, status, minA, maxA]);
  const live = filtered.filter(t => t.statusKey !== "cancelled");
  const total = live.reduce((s, t) => s + t.amount, 0);
  const done = filtered.filter(t => t.statusKey === "completed").reduce((s, t) => s + t.amount, 0);
  const pending = filtered.filter(t => t.statusKey === "pending" || t.statusKey === "confirmed").reduce((s, t) => s + t.amount, 0);
  const cancelled = filtered.filter(t => t.statusKey === "cancelled").reduce((s, t) => s + t.amount, 0);
  function exportExcel() {
    const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["شماره سفارش", "تاریخ", "مشتری", "دسته کالا", "نوع پرداخت", "مبلغ (تومان)", "وضعیت"];
    const lines = [head, ...filtered.map(t => [t.id, t.date, t.customer, t.category, t.type, t.amount, t.status])];
    lines.push([], ["جمع فروش (بدون لغوشده)", total], ["تکمیل‌شده", done], ["در جریان", pending], ["لغوشده", cancelled]);
    const csv = "\uFEFF" + lines.map(r => r.map(q).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `mobiler-finance-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
    <PageHeader title="مدیریت مالی" subtitle="گردش مالی بر اساس سفارش‌های واقعی فروشگاه. پرداخت آنلاین و دریافت اقساط هنوز ثبت نمی‌شود." eyebrow="FINANCE" action={<Button icon={<FileSpreadsheet size={16}/>} onClick={exportExcel} disabled={!filtered.length}>خروجی CSV (قابل باز شدن در Excel)</Button>}/>
    {error && <div className="form-error">{error}</div>}
    <div className="stats-grid stats-four">
      <StatCard label="جمع فروش" value={money(total)} hint="بدون سفارش‌های لغوشده" icon={<Wallet size={18}/>} tone="blue"/>
      <StatCard label="تکمیل‌شده" value={money(done)} hint="سفارش تحویل‌شده" icon={<CheckCircle2 size={18}/>} tone="green"/>
      <StatCard label="در جریان" value={money(pending)} hint="در انتظار/تأییدشده" icon={<CircleDollarSign size={18}/>} tone="amber"/>
      <StatCard label="لغوشده" value={money(cancelled)} hint={`${fa(filtered.length)} سفارش در این نما`} icon={<XCircle size={18}/>} tone="red"/>
    </div>
    <Panel title="فیلترها" subtitle="فیلترها روی جدول و فایل Excel اعمال می‌شوند.">
      <div className="finance-filters">
        <label className="form-field"><span>بازه زمانی</span><select value={period} onChange={e => setPeriod(e.target.value)}><option value="week">۷ روز اخیر</option><option value="month">۳۰ روز اخیر</option><option value="all">تمام دوره</option></select></label>
        <label className="form-field"><span>نوع پرداخت</span><select value={type} onChange={e => setType(e.target.value)}><option value="all">همه</option><option>نقدی</option><option>اقساطی</option></select></label>
        <label className="form-field"><span>وضعیت</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">همه</option><option value="pending">در انتظار</option><option value="confirmed">تأییدشده</option><option value="completed">تکمیل‌شده</option><option value="cancelled">لغوشده</option></select></label>
        <label className="form-field"><span>حداقل مبلغ</span><input inputMode="numeric" value={minA} onChange={e => setMinA(e.target.value.replace(/\D/g, ""))}/></label>
        <label className="form-field"><span>حداکثر مبلغ</span><input inputMode="numeric" value={maxA} onChange={e => setMaxA(e.target.value.replace(/\D/g, ""))}/></label>
      </div>
    </Panel>
    <div className="finance-shortcuts"><Link href="/admin/finance/payment-type"><Banknote size={17}/><span><b>نوع پرداخت</b><small>نقدی و اقساطی</small></span></Link><Link href="/admin/finance/status"><CheckCircle2 size={17}/><span><b>وضعیت سفارش</b><small>تفکیک وضعیت‌ها</small></span></Link><Link href="/admin/finance/category"><ChartColumn size={17}/><span><b>دسته کالا</b><small>فروش هر دسته</small></span></Link><Link href="/admin/finance/customer"><Search size={17}/><span><b>مشتری</b><small>خرید هر مشتری</small></span></Link><Link href="/admin/finance/amount"><CircleDollarSign size={17}/><span><b>مبلغ</b><small>بازه‌های مبلغ</small></span></Link></div>
    <Panel title="دفتر سفارش‌ها" subtitle="هر سفارش یک ردیف مالی است.">
      <div className="table-toolbar"><SearchInput value={query} onChange={setQuery} placeholder="شماره سفارش، مشتری یا دسته..."/></div>
      {!loading && !txs.length ? <EmptyState title="هنوز سفارشی ثبت نشده" desc="با ثبت اولین سفارش در فروشگاه، گزارش مالی اینجا ساخته می‌شود."/> :
        <Table empty={loading ? "در حال بارگذاری..." : "موردی مطابق فیلترها نیست"} headers={["شماره سفارش", "تاریخ", "مشتری", "دسته کالا", "نوع پرداخت", "مبلغ", "وضعیت"]} rows={filtered.map(t => [<b className="mono link-text">{t.id}</b>, t.date, t.customer, t.category, <Badge tone={t.type === "اقساطی" ? "info" : "neutral"}>{t.type}</Badge>, <b>{money(t.amount)}</b>, <Badge tone={statusTone(t.statusKey)}>{t.status}</Badge>])}/>}
      <div className="table-footer"><span>جمع فروش این نما: <b>{money(total)}</b></span><span>خروجی شامل همین فیلترها و خلاصه است.</span></div>
    </Panel>
  </>;
}
