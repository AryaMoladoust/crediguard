import TrackForm from '@/components/TrackForm';
export const metadata = { title: 'پیگیری سفارش' };
export default async function TrackPage({ searchParams }) {
  const sp = await searchParams;
  return (
    <div className="wrap py-10">
      <div className="mx-auto mb-6 max-w-2xl"><h1 className="text-2xl sm:text-3xl">پیگیری سفارش</h1><p className="mt-1 text-sm text-ink-500">کد سفارش و شماره موبایلی که هنگام خرید وارد کرده‌اید را بنویسید.</p></div>
      <TrackForm initialCode={typeof sp.code === 'string' ? sp.code.slice(0, 12) : ''} />
    </div>
  );
}
