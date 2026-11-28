"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bell, Mail, Boxes, ChevronDown, ChevronLeft, ClipboardList,
  CreditCard, Gauge, LayoutDashboard, LogOut, Menu, Moon, Search,
  Settings, ShieldCheck, ShoppingBag, Sparkles, Sun, Users, Wallet, X,
} from "lucide-react";
import { useAppSettings } from "@/admin/components/providers";
import { Localize } from "@/admin/components/ui";

const iconMap: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard, sales: ShoppingBag, customers: Users, installments: CreditCard,
  risk: ShieldCheck, inventory: Boxes, admins: Gauge, activity: ClipboardList, finance: Wallet,
  notifications: Bell, messages: Mail, settings: Settings,
};
const routes: { key: string; href: string; icon: string; ownerOnly?: boolean; children?: { labelFa: string; labelEn: string; href: string }[] }[] = [
  { key: "dashboard", href: "/admin", icon: "dashboard" },
  { key: "sales", href: "/admin/sales", icon: "sales" },
  { key: "customers", href: "/admin/customers", icon: "customers", children: [
    { labelFa: "همه مشتریان", labelEn: "All customers", href: "/admin/customers" },
    { labelFa: "مشتریان جدید", labelEn: "New customers", href: "/admin/customers/new" },
  ] },
  { key: "installments", href: "/admin/installments", icon: "installments" },
  { key: "risk", href: "/admin/risk", icon: "risk" },
  { key: "inventory", href: "/admin/inventory", icon: "inventory" },
  { key: "admins", href: "/admin/admins", icon: "admins", ownerOnly: true },
  { key: "activity", href: "/admin/activity", icon: "activity" },
  { key: "finance", href: "/admin/finance", icon: "finance" },
  { key: "notifications", href: "/admin/notifications", icon: "notifications" },
  { key: "messages", href: "/admin/messages", icon: "messages" },
  { key: "settings", href: "/admin/settings", icon: "settings" },
];
const searchable = [
  { title: "داشبورد", en: "Dashboard", href: "/admin", desc: "نمای کلی سامانه" },
  { title: "مشتریان", en: "Customers", href: "/admin/customers", desc: "خریداران فروشگاه" },
  { title: "افزودن محصول", en: "Add product", href: "/admin/inventory/new", desc: "ثبت کالای تازه در انبار" },
  { title: "مدیریت مالی", en: "Finance", href: "/admin/finance", desc: "گردش سفارش‌ها و خروجی اکسل" },
  { title: "فعالیت‌ها", en: "Activity", href: "/admin/activity", desc: "آخرین تغییرات سفارش‌ها" },
  { title: "سفارش‌ها", en: "Orders", href: "/admin/sales", desc: "فهرست و جزئیات سفارش‌ها" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, theme, setTheme, t } = useAppSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(pathname.startsWith("/admin/customers"));
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [me, setMe] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  useEffect(() => { fetch("/api/admin/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then(setMe).catch(() => {}); }, []);
  const isFa = locale === "fa";
  const filteredSearch = useMemo(() => searchable.filter(item => `${item.title} ${item.en} ${item.desc}`.toLowerCase().includes(search.toLowerCase())).slice(0, 6), [search]);
  async function logout(e: React.MouseEvent) {
    e.preventDefault();
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch {}
    window.location.href = "/admin/login";
  }

  return <div className={`app-frame ${mobileOpen ? "mobile-nav-open" : ""}`}>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="بستن منو"/>}
    <aside className="sidebar">
      <div className="brand-row"><img className="admin-brand-logo" src="/etebaryar-blue.jpeg" alt="لوگوی اعتبار یار"/><div className="brand-copy"><strong>{t("brand")}</strong><span>{isFa ? "مدیریت هوشمند فروشگاه" : "Smart store management"}</span></div><button className="mobile-close icon-button" onClick={() => setMobileOpen(false)}><X size={18}/></button></div>
      <div className="nav-caption">{isFa ? "فضای کاری" : "WORKSPACE"}</div>
      <nav className="side-nav">
        {routes.filter(item => !item.ownerOnly || me?.role === "owner").map(item => {
          const Icon = iconMap[item.icon];
          const active = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(item.href + "/");
          const label = t(item.key as any);
          return <div key={item.key}>
            <div className={`nav-line ${active ? "active" : ""}`}>
              <Link href={item.href} onClick={() => setMobileOpen(false)} className="nav-link"><span className="nav-icon"><Icon size={18}/></span><span>{label}</span></Link>
              {item.children && <button className="nav-expand" onClick={() => setCustomerOpen(!customerOpen)} aria-label="نمایش زیرمنو"><ChevronDown size={14} className={customerOpen ? "turned" : ""}/></button>}
            </div>
            {item.children && customerOpen && <div className="sub-nav">{item.children.map(sub => <Link key={sub.href} href={sub.href} onClick={() => setMobileOpen(false)} className={pathname === sub.href ? "sub-active" : ""}>{isFa ? sub.labelFa : sub.labelEn}</Link>)}</div>}
          </div>;
        })}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-user"><div className="user-avatar">{(me?.name || "م").trim().slice(0, 1)}</div><div className="user-meta"><b>{me?.name || (isFa ? "مدیر سیستم" : "System Admin")}</b><span>{me?.role === "owner" ? (isFa ? "مدیر کل" : "Owner") : me?.email || (isFa ? "مدیر" : "Admin")}</span></div><button className="icon-button" onClick={() => setProfileOpen(!profileOpen)}><ChevronDown size={16}/></button>{profileOpen && <div className="profile-popover"><Link href="/admin/settings"><Settings size={14}/>{isFa ? "تنظیمات حساب" : "Account settings"}</Link><a href="/admin/login" onClick={logout}><LogOut size={14}/>{t("logout")}</a></div>}</div></div>
    </aside>
    <main className="main-shell">
      <header className="topbar">
        <div className="topbar-leading"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)}><Menu size={19}/></button><div className="breadcrumb"><span>{t("brand")}</span><ChevronLeft size={13}/><b>{getCurrentTitle(pathname, isFa)}</b></div></div>
        <div className="topbar-tools">
          <div className="global-search-wrap"><label className="global-search"><Search size={17}/><input value={search} onFocus={() => setSearchOpen(true)} onChange={e => { setSearch(e.target.value); setSearchOpen(true); }} placeholder={t("search")}/></label>{searchOpen && <><button className="search-dismiss" onClick={() => setSearchOpen(false)} aria-label="بستن نتایج"/><div className="search-results">{filteredSearch.length ? filteredSearch.map(item => <button key={item.href} onClick={() => { router.push(item.href); setSearchOpen(false); setSearch(""); }}><span className="search-result-icon"><Search size={15}/></span><span><b>{isFa ? item.title : item.en}</b><small>{item.desc}</small></span><ChevronLeft size={14}/></button>) : <p>{isFa ? "نتیجه‌ای پیدا نشد" : "No results found"}</p>}</div></>}</div>
          <div className="tool-divider"/>
          <div className="toggle-group locale-toggle"><button className={locale === "fa" ? "chosen" : ""} onClick={() => setLocale("fa")}>FA</button><button className={locale === "en" ? "chosen" : ""} onClick={() => setLocale("en")}>EN</button></div>
          <button className="icon-button theme-switch" title={theme === "dark" ? t("light") : t("dark")} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button>
          <button className="icon-button notification-button" aria-label="اعلان‌ها" onClick={() => router.push("/admin/notifications")}><Bell size={18}/><i/></button>
          <div className="topbar-avatar">{(me?.name || "م").trim().slice(0, 1)}</div>
        </div>
      </header>
      <div className="page-content"><Localize>{children}</Localize></div>
      <footer className="app-footer"><span>© ۱۴۰۵ {isFa ? "موبایلر؛ تمام حقوق محفوظ است." : "Mobiler. All rights reserved."}</span><span><Sparkles size={13}/> {isFa ? "ساخته‌شده برای مدیریت هوشمند کسب‌وکار" : "Designed for smarter operations"}</span></footer>
    </main>
  </div>;
}
function getCurrentTitle(path: string, isFa: boolean) {
  path = path.replace(/^\/admin/, "") || "/";
  const map: [string, string, string][] = [
    ["/", "داشبورد", "Dashboard"], ["/sales/", "جزئیات سفارش", "Order details"], ["/sales", "فروش", "Sales"], ["/customers", "مشتریان", "Customers"],
    ["/installments", "مدیریت اقساط", "Installments"], ["/risk", "اعتبار و ریسک", "Credit & Risk"], ["/inventory", "مدیریت انبار", "Inventory"],
    ["/admins", "مدیریت مدیران", "Admin management"], ["/activity", "فعالیت‌ها و وظایف", "Activity & Tasks"], ["/finance", "مدیریت مالی", "Finance"],
    ["/notifications", "اعلان‌ها", "Notifications"], ["/messages", "پیام‌های مشتریان", "Customer messages"], ["/settings", "تنظیمات", "Settings"],
  ];
  const hit = map.find(([href]) => href === "/" ? path === "/" : path.startsWith(href));
  return hit ? (isFa ? hit[1] : hit[2]) : (isFa ? "جزئیات مشتری" : "Customer details");
}
