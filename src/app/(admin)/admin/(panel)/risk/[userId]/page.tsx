"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowRight, FlaskConical, RotateCcw, Save } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, Panel, Table } from "@/admin/components/ui";
import { DEC, REC, RISK, METHOD, ORDER_STATUS, fa, jDate, jDateTime, statusTone, useApi } from "@/admin/lib/api";

type D = {
  notice: string;
  user: { id: string; name: string; phone: string; email: string; nationalId: string };
  profile: { data: Record<string, number | boolean>; decision: string; decisionNote: string; decisionBy: string; decisionAt: string | null; adjustments: { at: string; by: string; reason: string; changes: Record<string, unknown> }[] };
  assessment: { score: number; riskLevel: string; creditLimit: number; recommendation: string; summary: string; reasons: { label: string; delta: number }[]; flags: { code: string; severity: string; text: string }[]; metrics: { dti: number; monthlyCapacity: number }; engine: string; at: string };
  history: { score: number; riskLevel: string; creditLimit: number; recommendation: string; trigger: string; at: string }[];
  orders: { id: string; code: string; total: number; method: string; status: string; createdAt: string; credit: { rule: string; recommendation: string } | null }[];
  installments: { overdueCount: number; overdueAmount: number };
};
const NUM: [string, string][] = [["monthlyIncome", "درآمد ماهانه"], ["accountBalance", "موجودی حساب (فرضی)"], ["monthlyObligations", "تعهدات ماهانه"], ["totalDebt", "مجموع بدهی"], ["activeLoans", "تسهیلات فعال"], ["overdueInstallments", "اقساط معوق"], ["maxDelayDays", "حداکثر تأخیر (روز)"], ["bouncedCheques", "چک برگشتی"], ["onTimePayments", "اقساط به‌موقع"], ["latePayments", "اقساط با تأخیر"], ["recentInquiries", "استعلام ۶ماهه"], ["accountAgeMonths", "عمر حساب (ماه)"]];
const BOOL: [string, string][] = [["everDefaulted", "سابقه‌ی نکول"], ["blacklisted", "فهرست سیاه"], ["hasChequebook", "دسته‌چک دارد"]];
const RULE: Record<string, string> = { within_limit: "در محدوده‌ی اعتبار", needs_review: "نیازمند بررسی دستی" };

export default function RiskDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: d, error, loading, reload } = useApi<D>(`/api/admin/credit/${userId}`);
  const [edit, setEdit] = useState<Record<string, string | boolean>>({});
  const [reason, setReason] = useState("");
  const [dec, setDec] = useState({ status: "approved", note: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  async function post(body: object, okText: string) {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/admin/credit/${userId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "عملیات ناموفق بود");
      setMsg({ ok: true, t: okText }); setEdit({}); setReason(""); reload();
    } catch (e: any) { setMsg({ ok: false, t: e.message }); } finally { setBusy(false); }
  }
  if (error) return <EmptyState title="مشتری پیدا نشد" desc={error} action={<Button href="/admin/risk" icon={<ArrowRight size={15}/>}>بازگشت</Button>}/>;
  if (loading || !d) return <EmptyState title="در حال بارگذاری..."/>;
  const a = d.assessment, p = d.profile.data;
  const changes = Object.fromEntries(Object.entries(edit).map(([k, v]) => [k, typeof v === "string" ? Number(v) : v]));
  const changed = Object.keys(changes).length > 0;

  return <>
    <PageHeader title={d.user.name} subtitle={`پرونده‌ی اعتباری · ${d.user.phone} · کد ملی ${d.user.nationalId || "—"}`} eyebrow="RISK / CUSTOMER" action={<Button variant="secondary" href="/admin/risk" icon={<ArrowRight size={15}/>}>بازگشت به فهرست</Button>}/>
    <div className="sim-banner"><FlaskConical size={15}/>{d.notice}</div>
    {msg && <div className={msg.ok ? "sim-banner" : "form-error"}>{msg.t}</div>}
    <div className="detail-grid">
      <div className="detail-col">
        <Panel title="تحلیل ایجنت اعتبار یار" subtitle={`موتور ${a.engine} · ${jDateTime(a.at)} — فقط پیشنهاد؛ هیچ داده‌ی مالی را تغییر نمی‌دهد`}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <Badge tone="info">امتیاز {fa(a.score)} از ۹۰۰</Badge><Badge tone={RISK[a.riskLevel][1]}>ریسک {RISK[a.riskLevel][0]}</Badge><Badge tone={REC[a.recommendation][1]}>پیشنهاد: {REC[a.recommendation][0]}</Badge><Badge tone="purple">سقف {fa(a.creditLimit)} تومان</Badge></div>
          <p style={{ fontSize: 11, lineHeight: 2 }}>{a.summary}</p>
          <ul className="reason-list" style={{ marginTop: 12 }}>{a.reasons.map((r, i) => <li key={i}><span>{r.label}</span><b dir="ltr" className={r.delta > 0 ? "pos" : "neg"}>{r.delta > 0 ? "+" : ""}{fa(r.delta)}</b></li>)}</ul>
          {a.flags.length > 0 && <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>{a.flags.map(f => <div key={f.code} className="form-error" style={{ margin: 0, display: "flex", gap: 6, alignItems: "center" }}><AlertTriangle size={13}/>{f.text}</div>)}</div>}
        </Panel>
        <Panel title="ویرایش کنترل‌شده‌ی داده‌ی آزمایشی" subtitle="فقط مقدارهای شبیه‌سازی‌شده؛ با دلیل و ثبت سابقه. پس از ذخیره، ایجنت دوباره تحلیل می‌کند.">
          <div className="edit-grid">{NUM.map(([k, l]) => <label key={k}>{l}<input type="number" dir="ltr" value={edit[k] !== undefined ? String(edit[k]) : String(p[k])} onChange={e => setEdit(o => ({ ...o, [k]: e.target.value }))}/></label>)}
            {BOOL.map(([k, l]) => <label key={k}>{l}<select className="field-text" value={String(edit[k] !== undefined ? edit[k] : p[k])} onChange={e => setEdit(o => ({ ...o, [k]: e.target.value === "true" }))}><option value="false">خیر</option><option value="true">بله</option></select></label>)}</div>
          <input className="field-text" style={{ width: "100%", marginTop: 12 }} placeholder="دلیل تغییر (الزامی)" value={reason} onChange={e => setReason(e.target.value)} maxLength={300}/>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Button icon={<Save size={14}/>} disabled={busy || !changed || reason.trim().length < 3} onClick={() => post({ action: "adjust", changes, reason }, "داده‌ی آزمایشی به‌روز و تحلیل دوباره انجام شد")}>ذخیره و تحلیل مجدد</Button>
            <Button variant="secondary" icon={<RotateCcw size={14}/>} disabled={busy || reason.trim().length < 3} onClick={() => { if (confirm("داده‌ی آزمایشی به مقدار پایه‌ی شبیه‌ساز برگردانده شود؟")) post({ action: "reset_sim", reason }, "داده‌ی آزمایشی به حالت پایه برگشت"); }}>بازگشت به مقدار پایه</Button></div>
          {d.profile.adjustments.length > 0 && <div className="timeline-list" style={{ marginTop: 14 }}>{d.profile.adjustments.map((x, i) => <div className="timeline-item" key={i}><span className="timeline-icon info"><Save size={14}/></span><div><b>{x.reason}</b><small>{jDateTime(x.at)} · {x.by}</small></div></div>)}</div>}
        </Panel>
        <Panel title="سفارش‌های مشتری" subtitle={`${fa(d.orders.length)} سفارش`}>
          <Table empty="سفارشی نیست" headers={["سفارش", "تاریخ", "مبلغ (تومان)", "روش", "بررسی اعتبار", "وضعیت"]} rows={d.orders.map(o => [<Link className="mono link-text" href={`/admin/sales/${o.id}`}><b>{o.code}</b></Link>, jDate(o.createdAt), fa(o.total), METHOD[o.method], o.credit ? (RULE[o.credit.rule] || o.credit.rule) : "—", <Badge tone={statusTone(o.status)}>{ORDER_STATUS[o.status]}</Badge>])}/>
        </Panel>
      </div>
      <div className="detail-col">
        <Panel title="تصمیم نهایی اعتباردهی" subtitle="ایجنت اجازه‌ی اعمال محدودیت ندارد؛ فقط مدیر (با ثبت دلیل).">
          <dl className="kv-list"><div><dt>وضعیت فعلی</dt><dd><Badge tone={d.profile.decision === "rejected" ? "danger" : d.profile.decision === "approved" ? "success" : "neutral"}>{DEC[d.profile.decision]}</Badge></dd></div>
            {d.profile.decisionBy && <div><dt>ثبت‌کننده</dt><dd>{d.profile.decisionBy}{d.profile.decisionAt ? ` · ${jDate(d.profile.decisionAt)}` : ""}</dd></div>}
            {d.profile.decisionNote && <div><dt>دلیل</dt><dd>{d.profile.decisionNote}</dd></div>}</dl>
          <select className="field-text" style={{ width: "100%", marginTop: 12 }} value={dec.status} onChange={e => setDec({ ...dec, status: e.target.value })}><option value="approved">تأیید دستی (فعال‌سازی خرید اقساطی)</option><option value="rejected">رد / مسدودسازی خرید اقساطی</option><option value="review">نیازمند بررسی بیشتر</option><option value="auto">بازگشت به قوانین خودکار</option></select>
          <input className="field-text" style={{ width: "100%", marginTop: 8 }} placeholder="دلیل تصمیم" value={dec.note} onChange={e => setDec({ ...dec, note: e.target.value })} maxLength={500}/>
          <div style={{ marginTop: 10 }}><Button disabled={busy || (dec.status !== "auto" && dec.note.trim().length < 3)} onClick={() => post({ action: "decide", ...dec }, "تصمیم ثبت شد")}>ثبت تصمیم</Button></div>
          <p className="muted-cell" style={{ marginTop: 8 }}>تصمیم «رد» قابل بازگشت است (با «بازگشت به قوانین خودکار»).</p>
        </Panel>
        <Panel title="خلاصه‌ی مالی (آزمایشی)">
          <dl className="kv-list"><div><dt>نسبت تعهدات به درآمد</dt><dd>{fa(a.metrics.dti * 100)}٪</dd></div><div><dt>ظرفیت قسط ماهانه</dt><dd>{fa(a.metrics.monthlyCapacity)} تومان</dd></div><div><dt>خوش‌حسابی</dt><dd>{fa(Number(p.goodStandingPct))}٪</dd></div>
            <div><dt>اقساط معوق (سفارش‌ها)</dt><dd>{d.installments.overdueCount ? `${fa(d.installments.overdueCount)} قسط · ${fa(d.installments.overdueAmount)} تومان` : "ندارد"}</dd></div></dl>
        </Panel>
        <Panel title="سابقه‌ی تحلیل‌ها"><Table empty="—" headers={["تاریخ", "امتیاز", "سقف", "پیشنهاد"]} rows={d.history.map(h => [jDate(h.at), fa(h.score), fa(h.creditLimit), REC[h.recommendation][0]])}/></Panel>
      </div>
    </div>
  </>;
}
