"use client";
import { useParams } from "next/navigation";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { Avatar, Badge, Button, EmptyState, PageHeader, Panel, StatCard, Table } from "@/admin/components/ui";
import { fa, jDate, METHOD, ORDER_STATUS, statusTone, useApi, Customer } from "@/admin/lib/api";

type Profile = { customer: Customer; orders: { id: string; code: string; product: string; total: number; method: string; status: string; createdAt: string }[] };

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading } = useApi<Profile>(`/api/admin/customers?phone=${encodeURIComponent(id)}`);
  if (error) return <EmptyState title="مشتری پیدا نشد" desc={error} action={<Button href="/admin/customers" icon={<ArrowRight size={15}/>}>بازگشت</Button>}/>;
  if (loading || !data) return <EmptyState title="در حال بارگذاری..."/>;
  const { customer: c, orders } = data;
  return <>
    <PageHeader title={c.name} subtitle="پرونده‌ی مشتری بر اساس سفارش‌های ثبت‌شده در فروشگاه." eyebrow="CUSTOMER PROFILE" action={<Button variant="secondary" href="/admin/customers" icon={<ArrowRight size={15}/>}>بازگشت به مشتریان</Button>}/>
    <div className="stats-grid stats-four compact-stats">
      <StatCard label="تعداد سفارش" value={fa(c.orders)} hint={`${fa(c.activeOrders)} سفارش فعال`} icon={<Avatar name={c.name} size="sm"/>} tone="blue"/>
      <StatCard label="مجموع خرید" value={fa(c.spent)} hint="تومان (بدون لغوشده)" icon={<Avatar name={c.name} size="sm"/>} tone="green"/>
      <StatCard label="سفارش اقساطی" value={fa(c.installmentOrders)} hint="درخواست اقساط" icon={<Avatar name={c.name} size="sm"/>} tone="violet"/>
      <StatCard label="مشتری از" value={jDate(c.first)} hint={`آخرین سفارش: ${jDate(c.last)}`} icon={<Avatar name={c.name} size="sm"/>} tone="amber"/>
    </div>
    <Panel title="اطلاعات تماس" subtitle="آخرین اطلاعاتی که مشتری هنگام سفارش وارد کرده است.">
      <p className="muted-cell"><Phone size={13}/> <span className="mono">{c.phone}</span></p>
      <p className="muted-cell"><MapPin size={13}/> {c.address || "—"}</p>
    </Panel>
    <Panel title="سفارش‌های مشتری" subtitle={`${fa(orders.length)} سفارش`}>
      <Table empty="سفارشی نیست" headers={["شماره سفارش", "محصول", "تاریخ", "مبلغ (تومان)", "روش", "وضعیت"]} rows={orders.map(o => [<b className="mono link-text">{o.code}</b>, o.product, jDate(o.createdAt), fa(o.total), METHOD[o.method], <Badge tone={statusTone(o.status)}>{ORDER_STATUS[o.status]}</Badge>])}/>
    </Panel>
  </>;
}
