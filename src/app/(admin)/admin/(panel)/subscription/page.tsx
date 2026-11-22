import { EmptyState, PageHeader, Panel } from "@/admin/components/ui";
export default function Page() {
  return <>
    <PageHeader title="اشتراک و طرح‌ها" subtitle="طرح و صورتحساب سامانه." eyebrow="BILLING"/>
    <Panel title="اشتراک و طرح‌ها" subtitle="">
      <EmptyState title="این بخش هنوز به بک‌اند وصل نشده" desc="برای جلوگیری از نمایش داده‌ی نمونه، فعلاً چیزی نمایش داده نمی‌شود. با ساخته‌شدن API و مدل داده، اطلاعات واقعی اینجا می‌آید."/>
    </Panel>
  </>;
}
