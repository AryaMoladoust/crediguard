'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Heart } from 'lucide-react';
import { useStore } from './store';

export default function AddToCart({ p }) {
  const { add, wish, toggleWish } = useStore();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const max = Math.min(p.stock, 20);
  const liked = wish.includes(p.id);
  if (p.stock <= 0) return <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">این کالا فعلاً ناموجود است.</div>;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-xl bg-white ring-1 ring-ink-200" role="group" aria-label="تعداد">
        <button type="button" className="grid size-11 place-items-center disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty(qty - 1)} aria-label="کم کردن"><Minus size={16} /></button>
        <output className="w-8 text-center font-bold">{qty.toLocaleString('fa-IR')}</output>
        <button type="button" className="grid size-11 place-items-center disabled:opacity-40" disabled={qty >= max} onClick={() => setQty(qty + 1)} aria-label="زیاد کردن"><Plus size={16} /></button>
      </div>
      <button type="button" className="btn btn-primary flex-1 sm:flex-none sm:px-8" onClick={() => add(p, qty)}><ShoppingBag size={18} /> افزودن به سبد خرید</button>
      <button type="button" className="btn btn-line !px-3" aria-pressed={liked} aria-label="علاقه‌مندی" onClick={() => toggleWish(p.id)}><Heart size={19} className={liked ? 'fill-brand text-brand' : ''} /></button>
      <button type="button" className="btn btn-soft w-full sm:w-auto" onClick={() => { add(p, qty); router.push('/checkout'); }}>خرید سریع</button>
    </div>
  );
}
