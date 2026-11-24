import Link from 'next/link';
import { SlidersHorizontal, SearchX } from 'lucide-react';
import { listProducts } from '@/lib/queries';
import { CATEGORIES, catName } from '@/lib/format';
import { toInt, CATEGORY_SLUGS } from '@/lib/catalog';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';
const PER = 12;
const SORTS = { popular: ['پرفروش‌ترین', { sold: -1, createdAt: -1 }], newest: ['جدیدترین', { createdAt: -1 }], cheap: ['ارزان‌ترین', { price: 1 }], expensive: ['گران‌ترین', { price: -1 }] };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  return { title: sp.q ? `جستجوی «${String(sp.q).slice(0, 40)}»` : CATEGORY_SLUGS.includes(sp.category) ? catName(sp.category) : 'همه محصولات' };
}

export default async function Products({ searchParams }) {
  const sp = await searchParams;
  const one = (k) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) || '';
  const category = CATEGORY_SLUGS.includes(one('category')) ? one('category') : '';
  const q = one('q').trim().slice(0, 60);
  const sort = SORTS[one('sort')] ? one('sort') : 'popular';
  const min = toInt(one('min'), 0, 1e11), max = toInt(one('max'), 0, 1e11);
  const stock = one('stock') === '1', offer = one('offer') === '1';
  const page = Math.max(parseInt(one('page'), 10) || 1, 1);

  const filter = {};
  if (category) filter.category = category;
  if (q) { const r = { $regex: esc(q), $options: 'i' }; filter.$or = [{ name: r }, { brand: r }, { caption: r }]; }
  if (min !== null || max !== null) filter.price = { ...(min !== null && { $gte: min }), ...(max !== null && { $lte: max }) };
  if (stock) filter.stock = { $gt: 0 };
  if (offer) filter.isOffer = true;
  const { items, total, failed } = await listProducts(filter, SORTS[sort][1], PER, (page - 1) * PER);
  const pages = Math.max(Math.ceil(total / PER), 1);

  const href = (over) => {
    const p = new URLSearchParams();
    const cur = { category, q, sort: sort === 'popular' ? '' : sort, min: min ?? '', max: max ?? '', stock: stock ? '1' : '', offer: offer ? '1' : '', page: '' };
    for (const [k, v] of Object.entries({ ...cur, ...over })) if (v !== '' && v !== null && v !== undefined) p.set(k, String(v));
    const s = p.toString(); return s ? `/products?${s}` : '/products';
  };
  const hasFilter = category || q || min !== null || max !== null || stock || offer;

  return (
    <div className="wrap py-8">
      <nav aria-label="مسیر صفحه" className="mb-4 text-sm text-ink-500"><Link href="/" className="hover:text-brand-600">خانه</Link> / <span className="text-ink">{category ? catName(category) : 'همه محصولات'}</span></nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl sm:text-3xl">{q ? `نتایج جستجو برای «${q}»` : category ? catName(category) : 'همه محصولات'}</h1>
          <p className="mt-1 text-sm text-ink-500">{total.toLocaleString('fa-IR')} کالا پیدا شد</p></div>
      </div>
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        <Link href={href({ category: '', page: '' })} className={`chip shrink-0 ${!category ? 'chip-on' : ''}`}>همه</Link>
        {CATEGORIES.map((c) => <Link key={c.slug} href={href({ category: c.slug, page: '' })} className={`chip shrink-0 ${category === c.slug ? 'chip-on' : ''}`}>{c.short}</Link>)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr]">
        <details className="card h-fit p-4 lg:open:block" open>
          <summary className="flex cursor-pointer list-none items-center gap-2 font-extrabold"><SlidersHorizontal size={18} className="text-brand" /> فیلتر و مرتب‌سازی</summary>
          <form method="get" action="/products" className="mt-4 space-y-4">
            {category && <input type="hidden" name="category" value={category} />}
            <label className="field">جستجو در نام و برند<input className="input" name="q" defaultValue={q} placeholder="مثلاً Galaxy" /></label>
            <label className="field">مرتب‌سازی
              <select className="input" name="sort" defaultValue={sort}>{Object.entries(SORTS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="field">از قیمت<input className="input" name="min" inputMode="numeric" defaultValue={min ?? ''} placeholder="تومان" /></label>
              <label className="field">تا قیمت<input className="input" name="max" inputMode="numeric" defaultValue={max ?? ''} placeholder="تومان" /></label>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="stock" value="1" defaultChecked={stock} className="size-4 accent-brand" /> فقط کالاهای موجود</label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="offer" value="1" defaultChecked={offer} className="size-4 accent-brand" /> فقط پیشنهادهای ویژه</label>
            <div className="flex gap-2"><button className="btn btn-primary flex-1">اعمال فیلتر</button>{hasFilter && <Link href="/products" className="btn btn-line">حذف</Link>}</div>
          </form>
        </details>

        <div>
          {failed && <div className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">اتصال به پایگاه داده برقرار نشد.</div>}
          {items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">{items.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 3} />)}</div>
          ) : (
            <div className="card grid place-items-center gap-2 p-12 text-center"><SearchX size={36} className="text-ink-400" /><b>{hasFilter ? 'محصولی با این فیلترها پیدا نشد' : 'هنوز محصولی ثبت نشده است'}</b>{hasFilter && <Link href="/products" className="btn btn-soft mt-2">حذف فیلترها</Link>}</div>
          )}
          {pages > 1 && (
            <nav aria-label="صفحه‌بندی" className="mt-8 flex flex-wrap justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <Link key={n} href={href({ page: n === 1 ? '' : n })} aria-current={n === page ? 'page' : undefined} className={`grid size-10 place-items-center rounded-xl text-sm font-bold ring-1 ${n === page ? 'bg-ink text-white ring-ink' : 'bg-white ring-ink-200 hover:ring-brand'}`}>{n.toLocaleString('fa-IR')}</Link>)}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
