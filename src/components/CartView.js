'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Truck } from 'lucide-react';
import { useStore } from './store';
import SmartImg from './SmartImg';
import { SITE } from '@/lib/site';

export default function CartView() {
  const { ready, cart, total, count, setQty, remove, syncCart } = useStore();
  // قیمت و موجودی سبد با دیتابیس همگام می‌شود
  useEffect(() => {
    if (!ready || !cart.length) return;
    const controller = new AbortController();
    fetch(`/api/products?ids=${cart.map((x) => encodeURIComponent(x.id)).join(',')}&limit=100`, { cache: 'no-store', signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // خطای API یا پاسخ ناقص نباید کالاهای ذخیره‌شده را ناموجود کند.
        if (d && Array.isArray(d.items) && d.items.length) syncCart(Object.fromEntries(d.items.map((p) => [String(p.id), p])));
      }).catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) return <div className="wrap py-16 text-center text-ink-500">در حال بارگذاری سبد خرید...</div>;
  if (!cart.length) return (
    <div className="wrap py-16"><div className="card mx-auto grid max-w-md place-items-center gap-3 p-10 text-center"><ShoppingBag size={44} className="text-ink-400" /><h1 className="text-xl">سبد خرید شما خالی است</h1><p className="text-sm text-ink-500">از بین محصولات، کالای مورد نظرتان را انتخاب کنید.</p><Link href="/products" className="btn btn-primary mt-2">رفتن به فروشگاه</Link></div></div>
  );
  const left = Math.max(SITE.freeShipping - total, 0);
  return (
    <div className="wrap py-8">
      <h1 className="text-2xl sm:text-3xl">سبد خرید <span className="text-base font-semibold text-ink-500">({count.toLocaleString('fa-IR')} کالا)</span></h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="space-y-3">
          {cart.map((x) => (
            <li key={x.id} className="card flex gap-4 p-4">
              <Link href={`/product/${x.slug}`} className="size-24 shrink-0 rounded-xl bg-ink-50 p-2"><SmartImg src={x.image} alt={x.name} category={x.category} className="h-full w-full object-contain" /></Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/product/${x.slug}`} className="line-clamp-2 text-sm font-bold leading-6 hover:text-brand-600">{x.name}</Link>
                {x.stock <= 0 && <small className="font-semibold text-red-600">موجودی این کالا در حال حاضر صفر است.</small>}
                {x.stock > 0 && x.qty > x.stock && <small className="font-semibold text-amber-700">فقط {x.stock.toLocaleString('fa-IR')} عدد موجود است؛ تعداد را کاهش دهید.</small>}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center rounded-xl ring-1 ring-ink-200">
                    <button type="button" className="grid size-9 place-items-center disabled:opacity-40" disabled={x.qty <= 1} onClick={() => setQty(x.id, x.qty - 1)} aria-label="کم کردن"><Minus size={15} /></button>
                    <output className="w-7 text-center text-sm font-bold">{x.qty.toLocaleString('fa-IR')}</output>
                    <button type="button" className="grid size-9 place-items-center disabled:opacity-40" disabled={x.qty >= Math.min(x.stock, 20)} onClick={() => setQty(x.id, x.qty + 1)} aria-label="زیاد کردن"><Plus size={15} /></button>
                  </div>
                  <div className="text-left"><b className="block">{(x.price * x.qty).toLocaleString('fa-IR')} تومان</b>{x.qty > 1 && <small className="text-ink-400">هر عدد {x.price.toLocaleString('fa-IR')}</small>}</div>
                  <button type="button" onClick={() => remove(x.id)} className="grid size-9 place-items-center rounded-lg text-red-600 hover:bg-red-50" aria-label={`حذف ${x.name}`}><Trash2 size={17} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <h2 className="text-lg">خلاصه سفارش</h2>
          <div className="flex justify-between text-sm"><span className="text-ink-500">جمع کالاها</span><b>{total.toLocaleString('fa-IR')} تومان</b></div>
          <div className="flex justify-between text-sm"><span className="text-ink-500">هزینه ارسال</span><b>{left === 0 ? 'رایگان' : 'محاسبه در مرحله بعد'}</b></div>
          {left > 0 && <p className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-xs font-semibold leading-6 text-brand-700"><Truck size={16} className="mt-0.5 shrink-0" />با {left.toLocaleString('fa-IR')} تومان خرید بیشتر، ارسال رایگان می‌شود.</p>}
          <div className="flex justify-between border-t border-ink-100 pt-4"><span className="font-bold">مبلغ قابل پرداخت</span><b className="text-lg">{total.toLocaleString('fa-IR')} تومان</b></div>
          {cart.some((x) => x.stock <= 0 || x.qty > x.stock)
            ? <button type="button" disabled className="btn btn-primary w-full !min-h-12 opacity-50">ابتدا تعداد کالاهای دارای کمبود موجودی را اصلاح کنید</button>
            : <Link href="/checkout" className="btn btn-primary w-full !min-h-12">ادامه و ثبت سفارش <ArrowLeft size={18} /></Link>}
        </aside>
      </div>
    </div>
  );
}
