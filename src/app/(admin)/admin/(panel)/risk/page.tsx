"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldAlert, ShieldCheck, Users, FlaskConical } from "lucide-react";
import { Badge, EmptyState, PageHeader, Pagination, Panel, SearchInput, SelectField, StatCard, Table } from "@/admin/components/ui";
import { DEC, REC, RISK, fa, jDate, qs, useApi, useDebounced } from "@/admin/lib/api";

type Row = { userId: string; name: string; phone: string; nationalId: string; score: number; riskLevel: string; creditLimit: number; recommendation: string; decision: string; flags: number; at: string };
type List = { items: Row[]; total: number; page: number; pageSize: number; pages: number; summary: { approve: number; review: number; reject: number; all: number } };

export default function RiskPage() {
  const [q, setQ] = useState(""); const [rec, setRec] = useState("all"); const [risk, setRisk] = useState("all"); const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, error, loading } = useApi<List>(`/api/admin/credit${qs({ q: dq, recommendation: rec === "all" ? "" : rec, risk: risk === "all" ? "" : risk, page })}`, 30000);
  const s = data?.summary;
  return <>
    <PageHeader title="اعتبار و ریسک" subtitle="تحلیل ایجنت اعتبار یار بر پایه‌ی داده‌ی آزمایشی (شبیه‌سازی‌شده)؛ تصمیم نهایی با قوانین سیستم و مدیر است." eyebrow="INTELLIGENCE / RISK"/>
    <div className="sim-banner"><FlaskConical size={15}/>همه‌ی اطلاعات اعتباری این بخش آزمایشی است و از بانک مرکزی یا سرویس اعتبارسنجی واقعی دریافت نشده.</div>
    {error && <div className="form-error">{error}</div>}
    <div className="stats-grid stats-four">
      <StatCard label="مشتریان بررسی‌شده" value={fa(s?.all ?? 0)} hint="دارای پرونده‌ی اعتباری" icon={<Users size={18}/>} tone="blue"/>
      <StatCard label="پیشنهاد تأیید" value={fa(s?.approve ?? 0)} hint="ریسک مناسب" icon={<CheckCircle2 size={18}/>} tone="green"/>
      <StatCard label="نیازمند بررسی" value={fa(s?.review ?? 0)} hint="تصمیم دستی" icon={<ShieldCheck size={18}/>} tone="amber"/>
      <StatCard label="پیشنهاد رد" value={fa(s?.reject ?? 0)} hint="ریسک بالا" icon={<ShieldAlert size={18}/>} tone="red"/>
    </div>
    <Panel title="مشتریان و نتیجه‌ی تحلیل" subtitle="برای دیدن دلایل، ویرایش داده‌ی آزمایشی و ثبت تصمیم، روی مشتری بزنید.">
      <div className="table-toolbar"><SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="نام یا موبایل..."/>
        <SelectField value={rec} onChange={v => { setRec(v); setPage(1); }} options={[{ label: "همه پیشنهادها", value: "all" }, { label: "تأیید", value: "approve" }, { label: "نیازمند بررسی", value: "review" }, { label: "رد", value: "reject" }]}/>
        <SelectField value={risk} onChange={v => { setRisk(v); setPage(1); }} options={[{ label: "همه سطح‌های ریسک", value: "all" }, ...Object.entries(RISK).map(([value, [label]]) => ({ label, value }))]}/></div>
      {!loading && !data?.items.length && !q && rec === "all" && risk === "all" ? <EmptyState title="هنوز مشتری‌ای بررسی نشده" desc="با ثبت‌نام مشتری (و ثبت کد ملی) پرونده‌ی اعتباری و تحلیل ایجنت به‌طور خودکار ساخته می‌شود."/> : <>
        <Table empty={loading ? "در حال بارگذاری..." : "موردی مطابق فیلتر نیست"} headers={["مشتری", "امتیاز", "ریسک", "سقف اعتبار (تومان)", "پیشنهاد ایجنت", "تصمیم نهایی", "هشدار", "تحلیل"]}
          rows={(data?.items ?? []).map(r => [<Link className="link-text" href={`/admin/risk/${r.userId}`}><b>{r.name}</b><small className="muted-cell"> {r.phone}</small></Link>, <b>{fa(r.score)}</b>, <Badge tone={RISK[r.riskLevel][1]}>{RISK[r.riskLevel][0]}</Badge>, fa(r.creditLimit), <Badge tone={REC[r.recommendation][1]}>{REC[r.recommendation][0]}</Badge>, <small className="muted-cell">{DEC[r.decision]}</small>, r.flags ? fa(r.flags) : "—", jDate(r.at)])}/>
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} pageSize={data?.pageSize ?? 20} onPage={setPage}/></>}
    </Panel>
  </>;
}
