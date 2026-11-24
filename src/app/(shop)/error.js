'use client';
export default function Error({ reset }) {
  return <div className="wrap grid min-h-[55vh] place-items-center py-16 text-center"><div><h1 className="text-2xl">مشکلی پیش آمد</h1><p className="mt-2 text-sm text-ink-500">لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت با پشتیبانی تماس بگیرید.</p><button onClick={() => reset()} className="btn btn-primary mt-6">تلاش دوباره</button></div></div>;
}
