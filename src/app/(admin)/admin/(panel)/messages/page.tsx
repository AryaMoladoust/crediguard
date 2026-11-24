"use client";
import { useState } from "react";
import { Check, Mail, Phone, Trash2 } from "lucide-react";
import { Button, EmptyState, PageHeader, Panel } from "@/admin/components/ui";
import { ago, fa, useApi } from "@/admin/lib/api";

type Msg = { id: string; name: string; phone: string; email: string; message: string; read: boolean; createdAt: string };
export default function MessagesPage() {
  const { data, error, loading } = useApi<Msg[]>("/api/admin/messages", 30000);
  const [local, setLocal] = useState<Record<string, "read" | "gone">>({});
  const list = (data ?? []).filter(m => local[m.id] !== "gone");
  const unread = list.filter(m => !m.read && local[m.id] !== "read").length;
  async function mark(id: string) { setLocal(o => ({ ...o, [id]: "read" })); await fetch("/api/admin/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, read: true }) }); }
  async function del(id: string) { if (!confirm("این پیام حذف شود؟")) return; setLocal(o => ({ ...o, [id]: "gone" })); await fetch(`/api/admin/messages?id=${id}`, { method: "DELETE" }); }
  return <>
    <PageHeader title="پیام‌های مشتریان" subtitle="پیام‌هایی که از فرم «تماس با ما» فروشگاه ارسال می‌شود." eyebrow="MESSAGES"/>
    {error && <div className="form-error">{error}</div>}
    <Panel title="صندوق پیام" subtitle={`${fa(unread)} پیام خوانده‌نشده از ${fa(list.length)} پیام`}>
      {!loading && !list.length ? <EmptyState title="پیامی وجود ندارد"/> : <div className="timeline-list">{list.map(m => {
        const read = m.read || local[m.id] === "read";
        return <div className="timeline-item" key={m.id} style={read ? { opacity: .65 } : undefined}>
          <span className="timeline-icon info"><Mail size={15}/></span>
          <div style={{ flex: 1 }}><b>{m.name}{!read && " ●"}</b>
            <small style={{ display: "block", whiteSpace: "pre-wrap", margin: "4px 0" }}>{m.message}</small>
            <small>{m.phone && <><Phone size={12}/> <a href={`tel:${m.phone}`}>{m.phone}</a> · </>}{m.email && <a href={`mailto:${m.email}`}>{m.email}</a>}</small></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}><time>{ago(m.createdAt)}</time>
            <div style={{ display: "flex", gap: 6 }}>{!read && <Button variant="secondary" icon={<Check size={14}/>} onClick={() => mark(m.id)}>خوانده شد</Button>}<Button variant="secondary" icon={<Trash2 size={14}/>} onClick={() => del(m.id)}>حذف</Button></div></div>
        </div>; })}</div>}
    </Panel>
  </>;
}
