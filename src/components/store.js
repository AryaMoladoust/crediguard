'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

// سبد خرید و علاقه‌مندی‌ها در localStorage می‌مانند (با رفرش پاک نمی‌شوند و بین تب‌ها همگام‌اند).
const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function StoreProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wish, setWish] = useState([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const timer = useRef();

  useEffect(() => {
    setCart(read('mb_cart', [])); setWish(read('mb_wish', [])); setReady(true);
    const sync = (e) => { if (e.key === 'mb_cart') setCart(read('mb_cart', [])); if (e.key === 'mb_wish') setWish(read('mb_wish', [])); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => { if (ready) write('mb_cart', cart); }, [cart, ready]);
  useEffect(() => { if (ready) write('mb_wish', wish); }, [wish, ready]);

  const notify = useCallback((msg, type = 'ok') => {
    setToast({ msg, type }); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const add = useCallback((p, qty = 1) => {
    if (!p || p.stock <= 0) return notify('این کالا ناموجود است', 'err');
    setCart((old) => {
      const f = old.find((x) => x.id === p.id);
      const next = Math.min((f?.qty || 0) + qty, p.stock, 20);
      if (f) return old.map((x) => (x.id === p.id ? { ...x, qty: next, stock: p.stock, price: p.price } : x));
      return [...old, { id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images?.[0] || p.image || '', category: p.category, stock: p.stock, qty: Math.min(qty, p.stock, 20) }];
    });
    notify('به سبد خرید اضافه شد');
  }, [notify]);
  const setQty = useCallback((id, qty) => setCart((o) => o.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(qty, x.stock, 20)) } : x))), []);
  const remove = useCallback((id) => setCart((o) => o.filter((x) => x.id !== id)), []);
  const clear = useCallback(() => setCart([]), []);
  // همگام‌سازی قیمت/موجودی سبد با دیتابیس (صفحه‌ی سبد صدا می‌زند)
  const syncCart = useCallback((fresh) => setCart((old) => old.flatMap((x) => { const f = fresh[x.id]; if (!f) return []; return [{ ...x, price: f.price, stock: f.stock, name: f.name, image: f.images?.[0] || f.image || x.image, qty: Math.min(x.qty, Math.max(f.stock, 0)) }].filter((y) => y.qty > 0); })), []);
  const toggleWish = useCallback((id) => setWish((o) => { const has = o.includes(id); notify(has ? 'از علاقه‌مندی‌ها حذف شد' : 'به علاقه‌مندی‌ها اضافه شد'); return has ? o.filter((x) => x !== id) : [...o, id]; }), [notify]);

  const value = useMemo(() => ({
    ready, cart, wish, add, setQty, remove, clear, syncCart, toggleWish, notify,
    count: cart.reduce((n, x) => n + x.qty, 0), total: cart.reduce((n, x) => n + x.price * x.qty, 0)
  }), [ready, cart, wish, add, setQty, remove, clear, syncCart, toggleWish, notify]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex justify-center px-4 md:bottom-6">
        {toast && (
          <div className={`pointer-events-auto flex animate-up items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-pop ${toast.type === 'err' ? 'bg-red-600' : 'bg-ink'}`}>
            {toast.type === 'err' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-400" />}{toast.msg}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
