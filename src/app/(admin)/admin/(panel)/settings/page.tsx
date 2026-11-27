"use client";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Badge, Button } from "@/admin/components/ui";
import { Save, Server, Monitor, ShieldCheck, SlidersHorizontal, Database, RefreshCw } from "lucide-react";

type Settings = { general: any; frontend: any; backend: any; access: Record<string,string[]> };
const initial: Settings = {
 general:{siteName:"موبایلر و اعتبار یار",supportPhone:"",maintenanceMode:false,allowRegistration:true},
 frontend:{storeEnabled:true,creditEnabled:true,showInventoryCount:true,enableNotifications:true,productsPerPage:12},
 backend:{rateLimitEnabled:true,auditLogEnabled:true,sessionMaxAgeHours:24,allowDemoPayments:true},
 access:{operator:[],finance:[],support:[]}
};
const permissionList = [
 ["dashboard.read","مشاهده داشبورد"],["orders.read","مشاهده سفارش‌ها"],["orders.update","مدیریت سفارش‌ها"],["inventory.read","مشاهده انبار"],["inventory.update","ویرایش موجودی"],["customers.read","مشاهده مشتریان"],["finance.read","مشاهده امور مالی"],["installments.read","مشاهده اقساط"],["installments.update","مدیریت اقساط"],["messages.read","مشاهده پیام‌ها"],["messages.reply","پاسخ به پیام‌ها"]
] as const;
export default function SettingsPage(){
 const [data,setData]=useState<Settings>(initial); const [active,setActive]=useState("general"); const [canEdit,setCanEdit]=useState(false); const [runtime,setRuntime]=useState<any>(null); const [busy,setBusy]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState(""); const [success,setSuccess]=useState("");
 async function load(){setBusy(true);setError("");try{const r=await fetch('/api/admin/settings',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'دریافت تنظیمات ناموفق بود');setData({...initial,...d.settings,access:{...initial.access,...d.settings?.access}});setCanEdit(!!d.permissions?.canEdit);setRuntime(d.runtime||{});}catch(e:any){setError(e.message||'خطا در دریافت تنظیمات');}finally{setBusy(false);}}
 useEffect(()=>{load();},[]);
 const update=(group:keyof Settings,key:string,value:any)=>setData(old=>({...old,[group]:{...(old[group] as any),[key]:value}}));
 const togglePermission=(role:string,perm:string)=>setData(old=>{const current=old.access[role]||[];return {...old,access:{...old.access,[role]:current.includes(perm)?current.filter(x=>x!==perm):[...current,perm]}}});
 async function save(){setSaving(true);setError('');setSuccess('');try{const r=await fetch('/api/admin/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(!r.ok)throw new Error(d.error||'ذخیره انجام نشد');setData({...initial,...d.settings,access:{...initial.access,...d.settings.access}});setSuccess('تنظیمات با موفقیت در پایگاه داده ذخیره شد.');}catch(e:any){setError(e.message||'ذخیره تنظیمات ناموفق بود');}finally{setSaving(false);}}
 const tabs=[['general','تنظیمات عمومی',SlidersHorizontal],['frontend','فرانت‌اند',Monitor],['backend','بک‌اند و سرور',Server],['access','نقش‌ها و دسترسی‌ها',ShieldCheck]] as const;
 const roles=[['operator','اپراتور'],['finance','کارشناس مالی'],['support','پشتیبانی']];
 return <>
  <PageHeader title="تنظیمات سامانه" subtitle="مدیریت پیکربندی فروشگاه، سرویس‌های بک‌اند و سطح دسترسی نقش‌ها." eyebrow="SYSTEM CONFIGURATION" action={<Button onClick={load} variant="secondary" icon={<RefreshCw size={15}/>}>بارگذاری مجدد</Button>}/>
  {error&&<div className="settings-alert error">{error}</div>}{success&&<div className="settings-alert success">{success}</div>}
  <div className="settings-status-grid">
   <div className="settings-status"><Database size={19}/><span><b>پایگاه داده</b><small>{runtime?.databaseConfigured?'متغیر اتصال تعریف شده':'متغیر MONGODB_URI تنظیم نشده'}</small></span><Badge tone={runtime?.databaseConfigured?'success':'warning'}>{runtime?.databaseConfigured?'پیکربندی‌شده':'نیازمند تنظیم'}</Badge></div>
   <div className="settings-status"><ShieldCheck size={19}/><span><b>کلید نشست</b><small>{runtime?.sessionSecretConfigured?'کلید امنیتی تعریف شده':'SESSION_SECRET تنظیم نشده'}</small></span><Badge tone={runtime?.sessionSecretConfigured?'success':'warning'}>{runtime?.sessionSecretConfigured?'فعال':'نیازمند تنظیم'}</Badge></div>
   <div className="settings-status"><Server size={19}/><span><b>درگاه پرداخت</b><small>پرداخت آزمایشی؛ بدون تراکنش بانکی واقعی</small></span><Badge tone="info">Simulator</Badge></div>
  </div>
  <div className="settings-layout settings-layout-full">
   <nav className="settings-menu">{tabs.map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}><Icon size={16}/>{label}</button>)}</nav>
   <div className="settings-content">
    {busy?<Panel title="در حال دریافت تنظیمات"><p>لطفاً صبر کنید...</p></Panel>:<>
     {active==='general'&&<Panel title="تنظیمات عمومی" subtitle="اطلاعات پایه و وضعیت کلی سامانه.">
      <div className="settings-form-grid"><label>نام سامانه<input disabled={!canEdit} value={data.general.siteName||''} onChange={e=>update('general','siteName',e.target.value)}/></label><label>شماره تماس پشتیبانی<input disabled={!canEdit} dir="ltr" value={data.general.supportPhone||''} placeholder="021..." onChange={e=>update('general','supportPhone',e.target.value)}/></label></div>
      <SettingSwitch title="ثبت‌نام کاربران" desc="اجازه ساخت حساب جدید در فروشگاه." value={!!data.general.allowRegistration} disabled={!canEdit} onChange={v=>update('general','allowRegistration',v)}/><SettingSwitch title="حالت تعمیر و نگهداری" desc="برای زمان نگهداری سامانه؛ فعال‌سازی این گزینه به‌تنهایی مسیرها را مسدود نمی‌کند." value={!!data.general.maintenanceMode} disabled={!canEdit} onChange={v=>update('general','maintenanceMode',v)}/>
     </Panel>}
     {active==='frontend'&&<Panel title="تنظیمات فرانت‌اند" subtitle="کنترل قابلیت‌های قابل مشاهده در رابط فروشگاه.">
      <SettingSwitch title="فعال بودن فروشگاه" desc="نمایش و دسترسی به بخش فروشگاه." value={!!data.frontend.storeEnabled} disabled={!canEdit} onChange={v=>update('frontend','storeEnabled',v)}/><SettingSwitch title="فعال بودن اعتبار یار" desc="نمایش بخش خدمات اعتباری و خرید اقساطی." value={!!data.frontend.creditEnabled} disabled={!canEdit} onChange={v=>update('frontend','creditEnabled',v)}/><SettingSwitch title="نمایش موجودی انبار" desc="نمایش تعداد موجودی در کارت محصولات." value={!!data.frontend.showInventoryCount} disabled={!canEdit} onChange={v=>update('frontend','showInventoryCount',v)}/><SettingSwitch title="اعلان‌های مشتریان" desc="فعال بودن اعلان‌های درون‌برنامه‌ای." value={!!data.frontend.enableNotifications} disabled={!canEdit} onChange={v=>update('frontend','enableNotifications',v)}/>
      <div className="settings-form-grid"><label>تعداد محصولات در هر صفحه<input type="number" min="4" max="60" disabled={!canEdit} value={data.frontend.productsPerPage??12} onChange={e=>update('frontend','productsPerPage',Number(e.target.value))}/><small>مقدار مجاز: ۴ تا ۶۰</small></label></div>
     </Panel>}
     {active==='backend'&&<Panel title="تنظیمات بک‌اند و سرور" subtitle="تنظیمات عملیاتی API، نشست‌ها و ثبت رویدادها.">
      <SettingSwitch title="محدودسازی درخواست‌ها (Rate limit)" desc="فعال بودن کنترل نرخ درخواست در مسیرهای پشتیبانی‌شده." value={!!data.backend.rateLimitEnabled} disabled={!canEdit} onChange={v=>update('backend','rateLimitEnabled',v)}/><SettingSwitch title="ثبت رویدادهای مدیریتی" desc="ثبت تغییرات و عملیات مدیریتی برای پیگیری و حسابرسی." value={!!data.backend.auditLogEnabled} disabled={!canEdit} onChange={v=>update('backend','auditLogEnabled',v)}/><SettingSwitch title="اجازه پرداخت شبیه‌سازی‌شده" desc="درگاه فعلی Simulator است و پول واقعی جابه‌جا نمی‌کند." value={!!data.backend.allowDemoPayments} disabled={!canEdit} onChange={v=>update('backend','allowDemoPayments',v)}/>
      <div className="settings-form-grid"><label>حداکثر عمر نشست (ساعت)<input type="number" min="1" max="720" disabled={!canEdit} value={data.backend.sessionMaxAgeHours??24} onChange={e=>update('backend','sessionMaxAgeHours',Number(e.target.value))}/><small>بین ۱ تا ۷۲۰ ساعت</small></label></div>
      <div className="settings-note">اطلاعات حساس مانند رمز پایگاه داده و کلیدهای امنیتی از این صفحه خوانده یا نمایش داده نمی‌شوند؛ آن‌ها را فقط در فایل محیطی سرور (.env.local) تنظیم کن.</div>
     </Panel>}
     {active==='access'&&<Panel title="نقش‌ها و سطح دسترسی" subtitle="ماتریس مجوزهای قابل اختصاص به نقش‌های عملیاتی.">
      {roles.map(([role,label])=><section className="permission-role" key={role}><h3>{label}</h3><div className="permission-grid">{permissionList.map(([key,title])=><label key={key}><input type="checkbox" disabled={!canEdit} checked={(data.access[role]||[]).includes(key)} onChange={()=>togglePermission(role,key)}/>{title}</label>)}</div></section>)}
      <div className="settings-note">مدیر کل (Owner) همیشه دسترسی کامل دارد. ویرایش این ماتریس فقط برای مدیر کل مجاز است؛ اعمال مجوزها روی مسیرهای اختصاصی هر نقش باید هنگام انتساب نقش به حساب مدیر نیز بررسی شود.</div>
     </Panel>}
     <div className="settings-save-row">{!canEdit&&<span>حساب فعلی فقط اجازه مشاهده تنظیمات را دارد.</span>}<Button onClick={save} disabled={!canEdit||saving} icon={<Save size={16}/>}>{saving?'در حال ذخیره...':'ذخیره تغییرات'}</Button></div>
    </>}
   </div>
  </div>
 </>;
}
function SettingSwitch({title,desc,value,onChange,disabled}:{title:string;desc:string;value:boolean;onChange:(v:boolean)=>void;disabled:boolean}){return <div className="setting-row"><div><b>{title}</b><small>{desc}</small></div><button type="button" role="switch" aria-checked={value} disabled={disabled} className={`switch ${value?'on':''}`} onClick={()=>onChange(!value)}><i/></button></div>}
