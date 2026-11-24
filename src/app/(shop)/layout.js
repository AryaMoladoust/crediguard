import localFont from 'next/font/local';
import './globals.css';
import { SITE } from '@/lib/site';
import { getUser } from '@/lib/user-session';
import { StoreProvider } from '@/components/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// فونت وزیرمتن روی خود سرور است (بدون وابستگی به Google Fonts که در ایران گاهی فیلتر است)
const vazir = localFont({ src: '../../fonts/Vazirmatn-Variable.woff2', variable: '--font-vazir', display: 'swap', weight: '100 900' });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: `${SITE.name} | ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: 'خرید گوشی موبایل، لپ‌تاپ، هدفون، پاور بانک و لوازم جانبی با ضمانت اصالت کالا، ارسال سریع و امکان خرید اقساطی.',
  applicationName: SITE.name,
  openGraph: { type: 'website', locale: 'fa_IR', siteName: SITE.name }
};
export const viewport = { themeColor: '#f26a1b', width: 'device-width', initialScale: 1 };
export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }) {
  const user = await getUser();
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body>
        <StoreProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:right-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-pop">پرش به محتوای اصلی</a>
          <Header user={user ? { name: user.name } : null} />
          <main id="main" className="min-h-[60vh]">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
