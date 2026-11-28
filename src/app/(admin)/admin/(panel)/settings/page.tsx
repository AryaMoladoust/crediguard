"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Panel, Button } from "@/admin/components/ui";
import { Save, LogOut } from "lucide-react";

type Basic = { siteName: string; supportPhone: string; showInventoryCount: boolean; allowRegistration: boolean };
const initial: Basic = { siteName: "", supportPhone: "", showInventoryCount: true, allowRegistration: true };

export default function SettingsPage() {
  const router = useRouter();
  async function logout() {
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch {}
    router.push("/admin/login"); router.refresh();
  }
  const [data, setData] = useState<Basic>(initial);
  const [canEdit, setCanEdit] = useState(false);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/settings", { cache: "no-store" });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "دریافت تنظیمات ناموفق بود");
        setData({ ...initial, ...d.settings });
        setCanEdit(!!d.canEdit);
      } catch (e: any) { setError(e.message || "خطا در دریافت تنظیمات"); }
      finally { setBusy(false); }
    })();
  }, []);

  async function save() {
    setSaving(true); setError(""); setOk("");
    try {
      const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "ذخیره انجام نشد");
      setData({ ...initial, ...d.settings });
      setOk("تنظیمات ذخیره شد.");
    } catch (e: any) { setError(e.message || "ذخیره انجام نشد"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader title="تنظیمات" subtitle="تنظیمات پایه‌ی فروشگاه؛ تغییرها بلافاصله در سایت اعمال می‌شوند." eyebrow="SETTINGS" />
      {busy ? <Panel title="در حال دریافت..."><p>لطفاً صبر کنید...</p></Panel> : (
        <Panel title="تنظیمات پایه" subtitle={canEdit ? "" : "فقط مدیر کل می‌تواند این تنظیمات را تغییر دهد."}>
          <div className="basic-settings">
            {error && <div className="bs-alert bs-error" role="alert">{error}</div>}
            {ok && <div className="bs-alert bs-ok">{ok}</div>}
            <label className="bs-field">نام فروشگاه
              <input type="text" disabled={!canEdit} maxLength={60} value={data.siteName} onChange={(e) => setData({ ...data, siteName: e.target.value })} />
              <small>در عنوان صفحه‌ها، هدر و فوتر سایت نمایش داده می‌شود.</small>
            </label>
            <label className="bs-field">شماره‌ی پشتیبانی
              <input type="text" dir="ltr" disabled={!canEdit} maxLength={30} value={data.supportPhone} onChange={(e) => setData({ ...data, supportPhone: e.target.value })} />
              <small>در هدر، فوتر و صفحه‌ی «تماس با ما» نمایش داده می‌شود.</small>
            </label>
            <label className="bs-toggle">
              <span><b>نمایش موجودی انبار</b><small>تعداد موجودی روی کارت محصولات دیده شود.</small></span>
              <input type="checkbox" disabled={!canEdit} checked={data.showInventoryCount} onChange={(e) => setData({ ...data, showInventoryCount: e.target.checked })} />
            </label>
            <label className="bs-toggle">
              <span><b>ثبت‌نام کاربران جدید</b><small>اگر خاموش باشد، کسی نمی‌تواند حساب تازه بسازد (ورود کاربران فعلی ادامه دارد).</small></span>
              <input type="checkbox" disabled={!canEdit} checked={data.allowRegistration} onChange={(e) => setData({ ...data, allowRegistration: e.target.checked })} />
            </label>
            <div className="bs-actions"><Button onClick={save} disabled={!canEdit || saving} icon={<Save size={15} />}>{saving ? "در حال ذخیره..." : "ذخیره"}</Button></div>
          </div>
        </Panel>
      )}
      <Panel title="حساب کاربری" subtitle="خروج از پنل مدیریت روی همین دستگاه.">
        <div className="basic-settings"><div className="bs-actions"><Button variant="secondary" onClick={logout} icon={<LogOut size={15} />}>خروج از حساب</Button></div></div>
      </Panel>
    </>
  );
}
