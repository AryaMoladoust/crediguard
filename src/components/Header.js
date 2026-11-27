'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingBag, Heart, Menu, X, UserRound, Home, LayoutGrid, Phone } from 'lucide-react';
import { useStore } from './store';
import { SITE } from '@/lib/site';
import { CATEGORIES } from '@/lib/format';
import SmartImg from './SmartImg';

const NAV = [['خانه', '/'], ['همه محصولات', '/products'], ['پیگیری سفارش', '/track'], ['درباره ما', '/about'], ['تماس با ما', '/contact']];

export default function Header({ user }) {
  const { count, wish, ready } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState([]);
  const [focus, setFocus] = useState(false);
  const box = useRef();

  useEffect(() => { setOpen(false); setFocus(false); }, [path]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  // جستجوی زنده با تأخیر کوتاه
  useEffect(() => {
    const s = q.trim();
    if (s.length < 2) { setHits([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(() => fetch(`/api/products?q=${encodeURIComponent(s)}&limit=5`, { signal: ctl.signal }).then((r) => r.json()).then((d) => setHits(d.items || [])).catch(() => {}), 250);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);
  useEffect(() => {
    const off = (e) => { if (box.current && !box.current.contains(e.target)) setFocus(false); };
    document.addEventListener('mousedown', off); return () => document.removeEventListener('mousedown', off);
  }, []);

  const submit = (e) => { e.preventDefault(); if (q.trim()) { setFocus(false); router.push(`/products?q=${encodeURIComponent(q.trim())}`); } };
  const active = (h) => (h === '/' ? path === '/' || path === '/shop' : path.startsWith(h));
  const badge = (n) => n > 0 && <span className="absolute -left-1 -top-1 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-5 text-white">{n.toLocaleString('fa-IR')}</span>;

  return (
    <>
      <div className="hidden bg-ink text-xs text-white/85 sm:block"><div className="wrap flex h-9 items-center justify-between">
        <span>ارسال رایگان برای سفارش‌های بالای {(SITE.freeShipping / 1_000_000).toLocaleString('fa-IR')} میلیون تومان</span>
        <a href={`tel:${SITE.phoneRaw}`} className="flex items-center gap-1.5 hover:text-white"><Phone size={13} /> مشاوره خرید: {SITE.phone}</a>
      </div></div>
      <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/90 backdrop-blur-lg">
        <div className="wrap flex h-16 items-center gap-3 sm:gap-5">
          <button type="button" className="grid size-10 place-items-center rounded-xl hover:bg-ink-50 lg:hidden" onClick={() => setOpen(true)} aria-label="باز کردن منو"><Menu /></button>
          <Link href="/" className="flex items-center gap-2 text-xl font-black" aria-label={`${SITE.name} — صفحه اصلی`}>
            <img src="/mobiler-logo.jpeg" alt="لوگوی موبایلر" className="h-11 w-11 rounded-xl object-contain" />
            <span className="hidden sm:inline">{SITE.name}</span>
          </Link>
          <nav className="mr-4 hidden items-center gap-1 lg:flex" aria-label="منوی اصلی">
            {NAV.map(([t, h]) => <Link key={h} href={h} className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-ink-50 ${active(h) ? 'text-brand-600' : 'text-ink-700'}`}>{t}</Link>)}
          </nav>
          <div ref={box} className="relative mr-auto hidden max-w-md flex-1 md:block">
            <form onSubmit={submit} role="search" className="flex items-center gap-2 rounded-xl bg-ink-50 px-3 ring-1 ring-transparent focus-within:bg-white focus-within:ring-brand">
              <Search size={18} className="text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} type="search" aria-label="جستجو" placeholder="جستجوی گوشی، لپ‌تاپ، هدفون..." className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-ink-400" />
            </form>
            {focus && q.trim().length >= 2 && (
              <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-ink-100">
                {hits.length ? hits.map((p) => (
                  <Link key={p.id} href={`/product/${p.slug}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-ink-50">
                    <SmartImg src={p.images?.[0] || p.image} alt="" category={p.category} className="size-11 rounded-lg bg-ink-50 object-contain" />
                    <span className="min-w-0 flex-1"><b className="block truncate text-sm">{p.name}</b><small className="text-ink-500">{p.price.toLocaleString('fa-IR')} تومان</small></span>
                  </Link>
                )) : <p className="p-4 text-sm text-ink-500">نتیجه‌ای پیدا نشد.</p>}
                <Link href={`/products?q=${encodeURIComponent(q.trim())}`} className="block border-t border-ink-100 p-3 text-center text-sm font-bold text-brand-600 hover:bg-brand-50">مشاهده همه نتایج</Link>
              </div>
            )}
          </div>
          <div className="mr-auto flex items-center gap-1 md:mr-0">
            <Link href="/favorites" className="relative hidden size-10 place-items-center rounded-xl hover:bg-ink-50 sm:grid" aria-label="علاقه‌مندی‌ها"><Heart size={20} />{ready && badge(wish.length)}</Link>
            <Link href={user ? '/account' : '/account/login'} className="flex h-10 items-center gap-2 rounded-xl px-2.5 hover:bg-ink-50" aria-label="حساب کاربری"><UserRound size={20} /><span className="hidden text-sm font-semibold xl:inline">{user ? user.name.split(' ')[0] : 'ورود | ثبت‌نام'}</span></Link>
            <Link href="/cart" className="btn btn-dark relative !min-h-10 !px-3.5" aria-label="سبد خرید"><ShoppingBag size={19} /><span className="hidden sm:inline">سبد خرید</span>{ready && badge(count)}</Link>
          </div>
        </div>
        <form onSubmit={submit} role="search" className="wrap pb-3 md:hidden">
          <div className="flex items-center gap-2 rounded-xl bg-ink-50 px-3"><Search size={18} className="text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="جستجو" placeholder="جستجو در موبایلر..." className="h-11 w-full bg-transparent text-sm outline-none" /></div>
        </form>
      </header>

      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="منو">
          <button type="button" className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} aria-label="بستن منو" />
          <aside className="absolute right-0 top-0 flex h-full w-[84%] max-w-sm animate-up flex-col bg-white p-5 shadow-pop">
            <div className="flex items-center justify-between"><b className="text-lg">منو</b><button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-xl hover:bg-ink-50" aria-label="بستن"><X /></button></div>
            <nav className="mt-4 flex flex-col gap-1" aria-label="منوی موبایل">
              {NAV.map(([t, h]) => <Link key={h} href={h} className={`rounded-xl px-3 py-3 font-semibold ${active(h) ? 'bg-brand-50 text-brand-700' : 'hover:bg-ink-50'}`}>{t}</Link>)}
              <Link href="/favorites" className="rounded-xl px-3 py-3 font-semibold hover:bg-ink-50">علاقه‌مندی‌ها</Link>
            </nav>
            <div className="mt-5 border-t border-ink-100 pt-4"><b className="text-sm text-ink-500">دسته‌بندی‌ها</b>
              <div className="mt-2 flex flex-wrap gap-2">{CATEGORIES.map((c) => <Link key={c.slug} href={`/products?category=${c.slug}`} className="chip">{c.short}</Link>)}</div></div>
          </aside>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="ناوبری سریع">
        {[[Home, 'خانه', '/'], [LayoutGrid, 'محصولات', '/products'], [Heart, 'علاقه‌مندی', '/favorites'], [UserRound, user ? 'حساب من' : 'ورود', user ? '/account' : '/account/login']].map(([I, t, h]) => (
          <Link key={h} href={h} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active(h) ? 'text-brand-600' : 'text-ink-500'}`}><I size={21} />{t}</Link>
        ))}
      </nav>
    </>
  );
}
