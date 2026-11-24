import Link from 'next/link';
import { SITE } from '@/lib/site';
export const metadata = { title: 'درباره ما' };
export default function About() {
  return (
    <div className="wrap py-10">
      <div className="mx-auto max-w-3xl">
        <span className="kicker">داستان {SITE.name}</span>
        <h1 className="text-3xl leading-[1.6] sm:text-4xl">تکنولوژی باید برای همه ساده باشد</h1>
        <div className="prose-fa mt-6">
          <p>{SITE.name} یک فروشگاه تخصصی کالای دیجیتال است؛ جایی برای کشف، مقایسه و خرید گوشی، لپ‌تاپ، هدفون و لوازم جانبی. هدف ما این است که تجربه‌ی خرید آنلاین را شفاف، سریع و قابل اعتماد کنیم.</p>
          <p>موجودی و قیمت کالاها مستقیم از انبار خوانده می‌شود، بنابراین آنچه می‌بینید همان چیزی است که می‌خرید. برای کالاهای گران‌قیمت، امکان ثبت درخواست خرید اقساطی هم فراهم است.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[['اصالت کالا', 'همه‌ی کالاها با ضمانت اصالت و سلامت فیزیکی عرضه می‌شوند.'], ['قیمت شفاف', 'قیمت و تخفیف هر کالا روشن و بدون هزینه‌ی پنهان است.'], ['پشتیبانی واقعی', 'قبل و بعد از خرید، کارشناسان پاسخ‌گوی شما هستند.']].map(([t, d]) => <div key={t} className="card p-5"><b>{t}</b><p className="mt-2 text-sm leading-7 text-ink-500">{d}</p></div>)}
        </div>
        <div className="mt-8 flex gap-3"><Link href="/products" className="btn btn-primary">مشاهده محصولات</Link><Link href="/contact" className="btn btn-line">تماس با ما</Link></div>
      </div>
    </div>
  );
}
