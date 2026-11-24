import Link from 'next/link';
export default function NotFound() {
  return <div className="wrap grid min-h-[55vh] place-items-center py-16 text-center"><div><b className="text-7xl font-black text-brand">۴۰۴</b><h1 className="mt-3 text-2xl">صفحه‌ی مورد نظر پیدا نشد</h1><p className="mt-2 text-sm text-ink-500">ممکن است آدرس اشتباه باشد یا کالا حذف شده باشد.</p><div className="mt-6 flex justify-center gap-3"><Link href="/" className="btn btn-primary">صفحه اصلی</Link><Link href="/products" className="btn btn-line">همه محصولات</Link></div></div></div>;
}
