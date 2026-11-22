"use client";
import { ShieldCheck } from "lucide-react";
import { Avatar, Badge, EmptyState, PageHeader, Panel, Table } from "@/admin/components/ui";
import { useApi } from "@/admin/lib/api";

export default function UsersPage() {
  const { data, error, loading } = useApi<{ email: string }>("/api/admin/me");
  return <>
    <PageHeader title="مدیریت کاربران" subtitle="حساب‌های دارای دسترسی به پنل. فعلاً فقط یک مدیر (از متغیرهای محیطی) وجود دارد." eyebrow="ACCESS CONTROL"/>
    {error && <div className="form-error">{error}</div>}
    <Panel title="مدیر پنل" subtitle="ایمیل از ADMIN_EMAIL خوانده می‌شود.">
      <Table empty={loading ? "در حال بارگذاری..." : "—"} headers={["کاربر", "نقش", "دسترسی", "وضعیت"]} rows={data ? [[<div className="table-person"><Avatar name={data.email || "A"} size="sm"/><div><b className="mono">{data.email || "—"}</b></div></div>, "مدیر کل", "کامل", <Badge tone="success"><ShieldCheck size={12}/> فعال</Badge>]] : []}/>
    </Panel>
    <Panel title="نقش‌ها و کارکنان" subtitle=""><EmptyState title="مدیریت کارکنان هنوز ساخته نشده" desc="افزودن کاربر و نقش نیاز به مدل کاربر در دیتابیس دارد."/></Panel>
  </>;
}
