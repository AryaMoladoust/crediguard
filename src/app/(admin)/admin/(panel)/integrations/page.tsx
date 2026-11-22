import { EmptyState, PageHeader, Panel } from "@/admin/components/ui";
export default function Page() {
  return <>
    <PageHeader title="اتصال و API" subtitle="اتصال به سرویس‌های بیرونی و کلیدهای API." eyebrow="INTEGRATIONS"/>
    <Panel title="اتصال و API" subtitle="">
      <EmptyState title="این بخش هنوز به بک‌اند وصل نشده" desc="برای جلوگیری از نمایش داده‌ی نمونه، فعلاً چیزی نمایش داده نمی‌شود. با ساخته‌شدن API و مدل داده، اطلاعات واقعی اینجا می‌آید."/>
    </Panel>
  </>;
}
