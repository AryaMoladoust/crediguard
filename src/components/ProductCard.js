'use client';
import Link from 'next/link';
import { Heart, Plus } from 'lucide-react';
import { useStore } from './store';
import SmartImg from './SmartImg';
import { money, discountOf, catName } from '@/lib/format';

export default function ProductCard({ p, priority }) {
  const { add, wish, toggleWish } = useStore();
  const off = discountOf(p);
  const liked = wish.includes(p.id);
  const href = `/product/${p.slug}`;
  return (
    <article className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="relative">
        <Link href={href} className="block aspect-square bg-gradient-to-br from-ink-50 to-brand-50/60 p-4" aria-label={p.name}>
          <SmartImg src={p.images?.[0] || p.image} alt={p.name} category={p.category} eager={priority} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" />
        </Link>
        {off > 0 && <span className="absolute right-3 top-3 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">{off.toLocaleString('fa-IR')}٪ تخفیف</span>}
        <button type="button" onClick={() => toggleWish(p.id)} aria-pressed={liked} aria-label={liked ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 shadow-card backdrop-blur transition hover:scale-110">
          <Heart size={17} className={liked ? 'fill-brand text-brand' : 'text-ink-500'} />
        </button>
        {p.stock <= 0 && <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1 text-center text-xs font-bold text-white">ناموجود</span>}
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <span className="text-xs font-semibold text-ink-400">{p.brand && p.brand !== '—' ? p.brand : catName(p.category)}</span>
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.8rem] text-sm font-bold leading-6">
          <Link href={href} className="hover:text-brand-600">{p.name}</Link>
        </h3>
        {p.stock > 0 && p.stock <= 5 && <span className="mt-1 text-xs font-semibold text-amber-600">فقط {p.stock.toLocaleString('fa-IR')} عدد در انبار مانده</span>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            {off > 0 && <div className="text-xs text-ink-400 line-through">{p.oldPrice.toLocaleString('fa-IR')}</div>}
            <div className="text-[15px] font-extrabold">{p.price.toLocaleString('fa-IR')} <span className="text-xs font-semibold text-ink-500">تومان</span></div>
          </div>
          <button type="button" disabled={p.stock <= 0} onClick={() => add(p)} aria-label={`افزودن ${p.name} به سبد خرید`} className="btn btn-primary !min-h-10 !w-10 !px-0">
            <Plus size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}
