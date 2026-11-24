import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { getProductBySlug, listProducts } from '@/lib/queries';
import { catName, discountOf, money } from '@/lib/format';
import Gallery from '@/components/Gallery';
import AddToCart from '@/components/AddToCart';
import ProductCard from '@/components/ProductCard';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: 'محصول پیدا نشد' };
  return { title: p.name, description: (p.caption || p.description || `خرید ${p.name} از ${SITE.name}`).slice(0, 150), openGraph: { images: p.images[0] ? [p.images[0]] : [] } };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const { items: related } = await listProducts({ category: p.category, _id: { $ne: p.id }, stock: { $gt: 0 } }, { sold: -1 }, 4);
  const off = discountOf(p);
  const specs = [...(p.specs || []).filter((s) => s.v && s.v !== '—'), ...(p.colors.length ? [{ k: 'رنگ', v: p.colors.join('، ') }] : []), ...(p.sku ? [{ k: 'کد کالا', v: p.sku }] : [])];
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, image: p.images, description: p.description || p.caption, sku: p.sku, brand: p.brand !== '—' ? { '@type': 'Brand', name: p.brand } : undefined, offers: { '@type': 'Offer', priceCurrency: 'IRR', price: p.price * 10, availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } };

  return (
    <div className="wrap py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <nav aria-label="مسیر صفحه" className="mb-5 text-sm text-ink-500"><Link href="/" className="hover:text-brand-600">خانه</Link> / <Link href={`/products?category=${p.category}`} className="hover:text-brand-600">{catName(p.category)}</Link> / <span className="text-ink">{p.name}</span></nav>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery images={p.images} name={p.name} category={p.category} />
        <div>
          {p.brand && p.brand !== '—' && <Link href={`/products?q=${encodeURIComponent(p.brand)}`} className="kicker hover:underline">{p.brand}</Link>}
          <h1 className="text-2xl leading-[1.6] sm:text-3xl">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{p.stock > 0 ? (p.stock <= 5 ? `فقط ${p.stock.toLocaleString('fa-IR')} عدد باقی مانده` : 'موجود در انبار') : 'ناموجود'}</span>
            {p.colorHex && <span className="flex items-center gap-1.5 text-ink-500"><i className="size-4 rounded-full ring-1 ring-ink-200" style={{ background: p.colorHex }} />{p.colors[0]}</span>}
          </div>
          <div className="mt-6 flex items-end gap-3">
            <div className="text-3xl font-black">{p.price.toLocaleString('fa-IR')} <span className="text-base font-semibold text-ink-500">تومان</span></div>
            {off > 0 && <><s className="pb-1 text-ink-400">{p.oldPrice.toLocaleString('fa-IR')}</s><span className="mb-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">{off.toLocaleString('fa-IR')}٪ تخفیف</span></>}
          </div>
          {p.caption && <p className="mt-4 leading-8 text-ink-500">{p.caption}</p>}
          <div className="mt-6"><AddToCart p={{ id: p.id, slug: p.slug, name: p.name, price: p.price, stock: p.stock, image: p.image, images: p.images, category: p.category }} /></div>
          <ul className="mt-7 grid gap-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-ink-100 sm:grid-cols-3">
            {[[ShieldCheck, 'ضمانت اصالت کالا'], [Truck, p.price >= SITE.freeShipping ? 'ارسال رایگان' : 'ارسال سریع به سراسر ایران'], [RotateCcw, '۷ روز ضمانت بازگشت']].map(([I, t]) => <li key={t} className="flex items-center gap-2 font-semibold"><I size={18} className="shrink-0 text-brand" />{t}</li>)}
          </ul>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="card p-6"><h2 className="text-lg">معرفی محصول</h2><p className="mt-3 whitespace-pre-line leading-8 text-ink-500">{p.description || 'توضیحاتی برای این کالا ثبت نشده است.'}</p></section>
        <section className="card p-6"><h2 className="text-lg">مشخصات</h2>
          <dl className="mt-3 divide-y divide-ink-100 text-sm">{specs.map((s) => <div key={s.k} className="flex justify-between gap-4 py-2.5"><dt className="text-ink-500">{s.k}</dt><dd className="font-semibold">{s.v}</dd></div>)}<div className="flex justify-between gap-4 py-2.5"><dt className="text-ink-500">دسته‌بندی</dt><dd className="font-semibold">{catName(p.category)}</dd></div></dl></section>
      </div>

      {related.length > 0 && <section className="mt-14"><h2 className="section-title mb-5">کالاهای مرتبط</h2><div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></section>}
    </div>
  );
}
