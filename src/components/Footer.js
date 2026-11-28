import Link from 'next/link';
import { Phone, Mail, MapPin, Clock3, ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';
import { SITE } from '@/lib/site';
import { CATEGORIES } from '@/lib/format';

const PERKS = [[ShieldCheck, 'ضمانت اصالت کالا', 'خرید با اطمینان کامل'], [Truck, 'ارسال سریع', 'تحویل در سراسر ایران'], [RotateCcw, '۷ روز ضمانت بازگشت', 'بدون دغدغه خرید کنید'], [Headphones, 'پشتیبانی واقعی', 'همیشه کنار شما هستیم']];

export default function Footer({ site }) {
  const siteName = site?.siteName || SITE.name, phone = site?.supportPhone || SITE.phone, phoneRaw = site?.phoneRaw || SITE.phoneRaw;
  return (
    <footer className="mt-16 pb-16 md:pb-0">
      <div className="wrap"><div className="grid grid-cols-2 gap-4 rounded-3xl bg-white p-5 shadow-card ring-1 ring-ink-100 lg:grid-cols-4">
        {PERKS.map(([I, t, s]) => <div key={t} className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><I size={22} /></span><p className="leading-5"><b className="block text-sm">{t}</b><small className="text-ink-500">{s}</small></p></div>)}
      </div></div>
      <div className="mt-10 bg-ink text-white/80">
        <div className="wrap grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-xl font-black text-white"><span className="grid size-9 place-items-center rounded-xl bg-brand">م</span>{siteName}</div>
            <p className="mt-4 text-sm leading-7">{SITE.tagline}؛ گوشی، لپ‌تاپ و لوازم دیجیتال اصل با قیمت شفاف و پشتیبانی واقعی.</p>
          </div>
          <div><b className="text-white">دسته‌بندی‌ها</b><ul className="mt-3 space-y-2 text-sm">{CATEGORIES.map((c) => <li key={c.slug}><Link href={`/products?category=${c.slug}`} className="hover:text-white">{c.name}</Link></li>)}</ul></div>
          <div><b className="text-white">راهنمای مشتری</b><ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/track" className="hover:text-white">پیگیری سفارش</Link></li><li><Link href="/faq" className="hover:text-white">پرسش‌های متداول</Link></li>
            <li><Link href="/about" className="hover:text-white">درباره ما</Link></li><li><Link href="/contact" className="hover:text-white">تماس با ما</Link></li><li><Link href="/account" className="hover:text-white">حساب کاربری</Link></li></ul></div>
          <div><b className="text-white">تماس با ما</b><ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex gap-2"><Phone size={16} className="mt-1 shrink-0" /><a href={`tel:${phoneRaw}`} className="hover:text-white">{phone}</a></li>
            <li className="flex gap-2"><Mail size={16} className="mt-1 shrink-0" />{SITE.email}</li>
            <li className="flex gap-2"><MapPin size={16} className="mt-1 shrink-0" />{SITE.address}</li>
            <li className="flex gap-2"><Clock3 size={16} className="mt-1 shrink-0" />{SITE.hours}</li></ul></div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">© {new Date().toLocaleDateString('fa-IR-u-ca-persian', { year: 'numeric' })} {siteName}؛ تمامی حقوق محفوظ است.</div>
      </div>
    </footer>
  );
}
