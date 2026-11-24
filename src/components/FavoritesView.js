'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useStore } from './store';
import ProductCard from './ProductCard';

export default function FavoritesView() {
  const { ready, wish } = useStore();
  const [items, setItems] = useState(null);
  useEffect(() => {
    if (!ready) return;
    if (!wish.length) { setItems([]); return; }
    const controller = new AbortController();
    fetch(`/api/products?ids=${wish.map(encodeURIComponent).join(',')}&limit=100`, { cache: 'no-store', signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error('دریافت علاقه‌مندی‌ها ناموفق بود'); return r.json(); })
      .then((d) => setItems(Array.isArray(d.items) ? d.items : []))
      .catch((e) => { if (e.name !== 'AbortError') setItems([]); });
    return () => controller.abort();
  }, [ready, wish]);
  if (items === null) return <p className="py-10 text-center text-ink-500">در حال بارگذاری...</p>;
  if (!items.length) return <div className="card mx-auto grid max-w-md place-items-center gap-3 p-10 text-center"><Heart size={40} className="text-ink-400" /><b>فهرست علاقه‌مندی‌های شما خالی است</b><p className="text-sm text-ink-500">روی قلب کنار هر کالا بزنید تا اینجا ذخیره شود.</p><Link href="/products" className="btn btn-primary">دیدن محصولات</Link></div>;
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">{items.filter((p) => wish.includes(String(p.id))).map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}
