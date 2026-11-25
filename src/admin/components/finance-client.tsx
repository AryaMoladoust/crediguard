"use client";
import Link from "next/link";
import { useState } from "react";
import { Banknote, CheckCircle2, ChartColumn, CircleDollarSign, FileSpreadsheet, Search, Truck, Wallet, XCircle } from "lucide-react";
import { Badge, EmptyState, PageHeader, Panel, Pagination, SearchInput, StatCard, Table } from "@/admin/components/ui";
import { CATEGORY, fa, jDate, METHOD, money, ORDER_STATUS, OrderStatus, OrdersPage, qs, statusTone, useApi, useDebounced } from "@/admin/lib/api";

const PAGE_SIZE = 25;
export default function FinanceClient() {
  const [query, setQuery] = useState(""); const [period, setPeriod] = useState("month"); const [type, setType] = useState("all");
  const [status, setStatus] = useState("all"); const [minA, setMinA] = useState(""); const [maxA, setMaxA] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(query), dmin = useDebounced(minA), dmax = useDebounced(maxA);
  const filters = { q: dq, period, method: type === "all" ? "" : type, status: status === "all" ? "" : status, min: dmin, max: dmax };
  // کل فیلترها و جمع‌ها سمت سرور و روی همه‌ی سفارش‌ها محاسبه می‌شود (قبلاً فقط ۵۰۰ سفارش آخر را جمع می‌زد)
  const { data, error, loading } = useApi<OrdersPage>(`/api/admin/orders${qs({ ...filters, page, pageSize: PAGE_SIZE })}`, 30000);
  const by = data?.summary.byStatus;
  const sum = (...k: OrderStatus[]) => k.reduce((s, x) => s + (by?.[x].sum ?? 0), 0);
  const cnt = (...k: OrderStatus[]) => k.reduce((s, x) => s + (by?.[x].count ?? 0), 0);
  const total = sum("pending", "confirmed", "shipped", "completed");
  const done = sum("completed");
  const inFlight = sum("pending", "confirmed", "shipped");
  const cancelled = sum("cancelled");
  const set = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(1); };
  const noOrders = !loading && by && cnt("pending", "confirmed", "shipped", "completed", "cancelled") === 0 && period === "all" && type === "all" && !dq && !dmin && !dmax;
  return <>
    <PageHeader title="مدیریت مالی" subtitle="گردش مالی بر اساس سفارش‌های واقعی فروشگاه. پرداخت آنلاین و دریافت اقساط هنوز ثبت نمی‌شود." eyebrow="FINANCE" action={<a className="btn btn-primary" href={`/api/admin/orders/export${qs(filters)}`}><span className="btn-icon"><FileSpreadsheet size={16}/></span><span>خروجی CSV (قابل باز شدن در Excel)</span></a>}/>
    {error && <div className="form-error">{error}</div>}
    <div className="stats-grid stats-four">
      <StatCard label="جمع فروش" value={money(total)} hint={`${fa(cnt("pending", "confirmed", "shipped", "completed"))} سفارش، بدون لغوشده`} icon={<Wallet size={18}/>} tone="blue"/>
      <StatCard label="تکمیل‌شده" value={money(done)} hint={`${fa(cnt("completed"))} سفارش تحویل‌شده`} icon={<CheckCircle2 size={18}/>} tone="green"/>
      <StatCard label="در جریان" value={money(inFlight)} hint={`${fa(cnt("pending", "confirmed", "shipped"))} سفارش · در انتظار، تأیید یا ارسال`} icon={<Truck size={18}/>} tone="amber"/>
      <StatCard label="لغوشده" value={money(cancelled)} hint={`${fa(cnt("cancelled"))} سفارش لغوشده`} icon={<XCircle size={18}/>} tone="red"/>
    </div>
    <Panel title="فیلترها" subtitle="فیلترها روی جدول و فایل CSV اعمال می‌شوند؛ کارت‌های بالا وضعیت‌ها را تفکیک می‌کنند و با فیلتر «وضعیت» تغییر نمی‌کنند.">
      <div className="finance-filters">
        <label className="form-field"><span>بازه زمانی</span><select value={period} onChange={e => set(setPeriod)(e.target.value)}><option value="week">۷ روز اخیر</option><option value="month">۳۰ روز اخیر</option><option value="all">تمام دوره</option></select></label>
        <label className="form-field"><span>نوع پرداخت</span><select value={type} onChange={e => set(setType)(e.target.value)}><option value="all">همه</option><option value="cash">نقدی</option><option value="installment">اقساطی</option></select></label>
        <label className="form-field"><span>وضعیت</span><select value={status} onChange={e => set(setStatus)(e.target.value)}><option value="all">همه</option>{Object.entries(ORDER_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="form-field"><span>حداقل مبلغ</span><input inputMode="numeric" value={minA} onChange={e => set(setMinA)(e.target.value.replace(/\D/g, ""))}/></label>
        <label className="form-field"><span>حداکثر مبلغ</span><input inputMode="numeric" value={maxA} onChange={e => set(setMaxA)(e.target.value.replace(/\D/g, ""))}/></label>
      </div>
    </Panel>
    <div className="finance-shortcuts"><Link href="/admin/finance/payment-type"><Banknote size={17}/><span><b>نوع پرداخت</b><small>نقدی و اقساطی</small></span></Link><Link href="/admin/finance/status"><CheckCircle2 size={17}/><span><b>وضعیت سفارش</b><small>تفکیک وضعیت‌ها</small></span></Link><Link href="/admin/finance/category"><ChartColumn size={17}/><span><b>دسته کالا</b><small>فروش هر دسته</small></span></Link><Link href="/admin/finance/customer"><Search size={17}/><span><b>مشتری</b><small>خرید هر مشتری</small></span></Link><Link href="/admin/finance/amount"><CircleDollarSign size={17}/><span><b>مبلغ</b><small>بازه‌های مبلغ</small></span></Link></div>
    <Panel title="دفتر سفارش‌ها" subtitle="هر سفارش یک ردیف مالی است.">
      <div className="table-toolbar"><SearchInput value={query} onChange={set(setQuery)} placeholder="شماره سفارش، مشتری یا کالا..."/></div>
      {noOrders ? <EmptyState title="هنوز سفارشی ثبت نشده" desc="با ثبت اولین سفارش در فروشگاه، گزارش مالی اینجا ساخته می‌شود."/> : <>
        <Table empty={loading ? "در حال بارگذاری..." : "موردی مطابق فیلترها نیست"} headers={["شماره سفارش", "تاریخ", "مشتری", "دسته کالا", "نوع پرداخت", "مبلغ", "وضعیت"]} rows={(data?.items ?? []).map(t => [<Link className="mono link-text" href={`/admin/sales/${t.id}`}><b>{t.code}</b></Link>, jDate(t.createdAt), t.customer, t.categories.map(c => CATEGORY[c] || c).join("، ") || "—", <Badge tone={t.method === "installment" ? "info" : "neutral"}>{METHOD[t.method]}</Badge>, <b>{money(t.total)}</b>, <Badge tone={statusTone(t.status)}>{ORDER_STATUS[t.status]}</Badge>])}/>
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} pageSize={PAGE_SIZE} onPage={setPage}/>
      </>}
      <div className="table-footer"><span>جمع فروش این نما: <b>{money(total)}</b></span><span>خروجی CSV شامل همه‌ی سفارش‌های همین فیلترها و خلاصه است.</span></div>
    </Panel>
  </>;
}
