import Link from 'next/link';
import { ArrowLeft, Smartphone, Laptop, Headphones, Zap, Watch, BadgePercent, CreditCard } from 'lucide-react';
import { listProducts } from '@/lib/queries';
import { CATEGORIES } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
import SmartImg from '@/components/SmartImg';

export const dynamic = 'force-dynamic';
const ICONS = { mobile: Smartphone, laptop: Laptop, headphone: Headphones, powerbank: Zap, accessory: Watch };

function Row({ title, kicker, href, items }) {
  if (!items.length) return null;
  return (
    <section className="wrap mt-14">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div><span className="kicker">{kicker}</span><h2 className="section-title">{title}</h2></div>
        <Link href={href} className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">مشاهده همه <ArrowLeft size={16} /></Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  );
}

export default async function Home() {
  const [best, offers, fresh] = await Promise.all([
    listProducts({ stock: { $gt: 0 } }, { sold: -1, createdAt: -1 }, 8),
    listProducts({ isOffer: true, stock: { $gt: 0 } }, { createdAt: -1 }, 4),
    listProducts({}, { createdAt: -1 }, 4)
  ]);
  const showcase = best.items.slice(0, 3);
  const empty = !best.failed && !fresh.items.length;
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-brand/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 right-10 size-96 rounded-full bg-brand-700/30 blur-3xl" aria-hidden />
        <div className="wrap relative grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:py-20">
          <div className="animate-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold ring-1 ring-white/15"><BadgePercent size={14} className="text-brand-200" /> ضمانت اصالت و سلامت فیزیکی کالا</span>
            <h1 className="mt-5 text-3xl leading-[1.5] sm:text-5xl sm:leading-[1.45]">تکنولوژی روز،<br /><span className="text-brand">با خیال راحت</span> بخرید</h1>
            <p className="mt-4 max-w-lg text-base leading-8 text-white/75">گوشی، لپ‌تاپ، هدفون و لوازم جانبی اصل؛ با قیمت شفاف، موجودی لحظه‌ای و امکان خرید اقساطی.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="btn btn-primary !min-h-12 px-7">مشاهده محصولات <ArrowLeft size={18} /></Link>
              <Link href="/products?category=mobile" className="btn !min-h-12 bg-white/10 px-6 text-white ring-1 ring-white/20 hover:bg-white/20">گوشی‌های موبایل</Link>
            </div>
          </div>
          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-3">
            {(showcase.length ? showcase : [null, null, null]).map((p, i) => (
              <Link key={p?.id || i} href={p ? `/product/${p.slug}` : '/products'} className={`group relative grid place-items-center overflow-hidden rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur transition hover:bg-white/15 ${i === 0 ? 'row-span-2 min-h-64' : 'aspect-[4/3]'}`}>
                <SmartImg src={p?.images?.[0] || p?.image} alt={p?.name || 'محصول'} category={p?.category || CATEGORIES[i].slug} className="h-full max-h-44 w-full object-contain transition group-hover:scale-105" eager />
                {p && <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/80 to-transparent px-3 pb-2 pt-6 text-xs font-bold">{p.name}</span>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap -mt-6 relative z-10" aria-label="دسته‌بندی‌ها">
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {CATEGORIES.map((c) => { const I = ICONS[c.slug]; return (
            <Link key={c.slug} href={`/products?category=${c.slug}`} className="card group flex min-w-40 flex-1 items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-pop">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand group-hover:text-white"><I size={24} /></span>
              <span className="leading-5"><b className="block text-sm">{c.name}</b><small className="text-ink-500">{c.sub}</small></span>
            </Link>); })}
        </div>
      </section>

      {best.failed && <div className="wrap mt-10"><div className="rounded-2xl bg-amber-50 p-5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">اتصال به پایگاه داده برقرار نشد؛ لطفاً چند دقیقه دیگر دوباره تلاش کنید.</div></div>}
      {empty && <div className="wrap mt-10"><div className="card p-10 text-center"><h2 className="text-lg">هنوز محصولی ثبت نشده است</h2><p className="mt-2 text-sm text-ink-500">محصولات را از «پنل مدیریت ← انبار ← افزودن محصول» اضافه کنید.</p></div></div>}

      <Row kicker="تخفیف‌های ویژه" title="پیشنهادهای شگفت‌انگیز" href="/products?offer=1" items={offers.items} />
      <Row kicker="محبوب‌ترین‌ها" title="پرفروش‌ترین کالاها" href="/products?sort=popular" items={best.items} />

      <section className="wrap mt-14">
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/products?category=mobile" className="group relative overflow-hidden rounded-3xl bg-gradient-to-l from-brand to-brand-700 p-7 text-white sm:p-9">
            <CreditCard className="absolute -left-4 -top-4 size-32 rotate-12 text-white/10" aria-hidden />
            <h3 className="relative text-xl sm:text-2xl">خرید اقساطی گوشی و لپ‌تاپ</h3>
            <p className="relative mt-2 max-w-xs text-sm leading-7 text-white/85">در مرحله‌ی ثبت سفارش «درخواست اقساطی» را انتخاب کنید؛ کارشناسان برای بررسی اعتبار با شما تماس می‌گیرند.</p>
            <span className="relative mt-5 inline-flex items-center gap-1 text-sm font-bold">شروع خرید <ArrowLeft size={16} className="transition group-hover:-translate-x-1" /></span>
          </Link>
          <Link href="/track" className="group relative overflow-hidden rounded-3xl bg-ink p-7 text-white sm:p-9">
            <h3 className="text-xl sm:text-2xl">سفارشتان به کجا رسید؟</h3>
            <p className="mt-2 max-w-xs text-sm leading-7 text-white/75">با کد سفارش و شماره موبایل، وضعیت سفارش را لحظه‌ای پیگیری کنید.</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand">پیگیری سفارش <ArrowLeft size={16} className="transition group-hover:-translate-x-1" /></span>
          </Link>
        </div>
      </section>

      <Row kicker="تازه‌ها" title="جدیدترین محصولات" href="/products?sort=newest" items={fresh.items} />
    </>
  );
}
