"use client";
import type React from "react";
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, UserPlus, Wand2 } from "lucide-react";
import { Avatar, Badge, Button, EmptyState, PageHeader, Panel, Table } from "@/admin/components/ui";
import { jDateTime, useApi } from "@/admin/lib/api";

type AdminRow = { id: string; name: string; email: string; active: boolean; lastLoginAt: string | null; createdAt: string };
type Data = { owner: { email: string; name: string }; admins: AdminRow[] };

// رمز تصادفی قوی (حروف و عدد، بدون نویسه‌های مبهم)
function genPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

export default function UsersPage() {
  const { data, error, loading, reload } = useApi<Data>("/api/admin/admins");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function call(url: string, method: string, body?: unknown) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "عملیات انجام نشد");
    return d;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await call("/api/admin/admins", "POST", { name, email, password });
      setMsg({ type: "ok", text: `مدیر «${name}» اضافه شد. ایمیل و رمز را به خودش بدهید؛ رمز دیگر نمایش داده نمی‌شود.` });
      setName(""); setEmail(""); setPassword("");
      reload();
    } catch (x: any) { setMsg({ type: "err", text: x.message }); }
    setBusy(false);
  }
  async function toggle(a: AdminRow) {
    setMsg(null);
    try { await call(`/api/admin/admins/${a.id}`, "PATCH", { active: !a.active }); reload(); }
    catch (x: any) { setMsg({ type: "err", text: x.message }); }
  }
  async function resetPw(a: AdminRow) {
    const pw = window.prompt(`رمز جدید برای ${a.email} (حداقل ۸ کاراکتر):`, genPassword());
    if (!pw) return;
    setMsg(null);
    try { await call(`/api/admin/admins/${a.id}`, "PATCH", { password: pw }); setMsg({ type: "ok", text: `رمز ${a.email} تغییر کرد: ${pw}` }); }
    catch (x: any) { setMsg({ type: "err", text: x.message }); }
  }
  async function remove(a: AdminRow) {
    if (!window.confirm(`مدیر «${a.name}» برای همیشه حذف شود؟`)) return;
    setMsg(null);
    try { await call(`/api/admin/admins/${a.id}`, "DELETE"); reload(); }
    catch (x: any) { setMsg({ type: "err", text: x.message }); }
  }

  const rows: React.ReactNode[][] = [];
  if (data) {
    rows.push([
      <div className="table-person"><Avatar name={data.owner.name} size="sm" /><div><b>{data.owner.name}</b><small className="mono">{data.owner.email || "—"}</small></div></div>,
      "مدیر کل", "—", <Badge tone="success"><ShieldCheck size={12} /> فعال</Badge>, "—",
    ]);
    for (const a of data.admins) rows.push([
      <div className="table-person"><Avatar name={a.name} size="sm" tone="violet" /><div><b>{a.name}</b><small className="mono">{a.email}</small></div></div>,
      "مدیر", a.lastLoginAt ? jDateTime(a.lastLoginAt) : "هنوز وارد نشده",
      a.active ? <Badge tone="success">فعال</Badge> : <Badge tone="danger">غیرفعال</Badge>,
      <div style={{ display: "flex", gap: 6 }}>
        <Button variant="secondary" className="btn-small" onClick={() => toggle(a)}>{a.active ? "غیرفعال‌کردن" : "فعال‌کردن"}</Button>
        <Button variant="secondary" className="btn-small" onClick={() => resetPw(a)}>تغییر رمز</Button>
        <Button variant="danger" className="btn-small" onClick={() => remove(a)}>حذف</Button>
      </div>,
    ]);
  }

  return <>
    <PageHeader title="مدیریت کاربران" subtitle="هر مدیر با ایمیل و رمز خودش وارد می‌شود و چند مدیر می‌توانند هم‌زمان در پنل باشند." eyebrow="ACCESS CONTROL" />
    {error && <div className="form-error">{error}</div>}
    {msg && <div className="form-error" style={msg.type === "ok" ? { background: "#16c79815", borderColor: "#16c79855", color: "#28d4a8" } : undefined}>{msg.text}</div>}
    <Panel title="افزودن مدیر جدید" subtitle="فقط مدیر کل می‌تواند مدیر اضافه یا حذف کند.">
      <form onSubmit={add}>
        <div className="form-grid">
          <label className="form-field"><span>نام و نام خانوادگی</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً علی رضایی" required /></label>
          <label className="form-field"><span>ایمیل (مثلاً Gmail)</span><input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" autoComplete="off" required /></label>
          <label className="form-field span-2"><span>رمز عبور (حداقل ۸ کاراکتر)</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input type={show ? "text" : "password"} dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
              <Button variant="secondary" onClick={() => setShow(!show)} icon={show ? <EyeOff size={14} /> : <Eye size={14} />}>{show ? "پنهان" : "نمایش"}</Button>
              <Button variant="secondary" onClick={() => { setPassword(genPassword()); setShow(true); }} icon={<Wand2 size={14} />}>رمز تصادفی</Button>
            </div>
          </label>
        </div>
        <div style={{ marginTop: 14 }}><Button type="submit" disabled={busy} icon={<UserPlus size={15} />}>{busy ? "در حال افزودن..." : "افزودن مدیر"}</Button></div>
      </form>
    </Panel>
    <div style={{ height: 16 }} />
    <Panel title="مدیران پنل" subtitle="مدیر کل از ADMIN_EMAIL / ADMIN_PASSWORD در تنظیمات سرور خوانده می‌شود و قابل حذف نیست.">
      {!loading && data && !data.admins.length && <EmptyState title="هنوز مدیر دیگری اضافه نشده" desc="از فرم بالا یک مدیر تازه بسازید." />}
      <Table empty={loading ? "در حال بارگذاری..." : "—"} headers={["کاربر", "نقش", "آخرین ورود", "وضعیت", "عملیات"]} rows={rows} />
    </Panel>
  </>;
}
