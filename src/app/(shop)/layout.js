import localFont from 'next/font/local';
import './globals.css';
import { SITE } from '@/lib/site';
import { getSettings } from '@/lib/settings';
import { getUser } from '@/lib/user-session';
import { StoreProvider } from '@/components/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// فونت وزیرمتن روی خود سرور است (بدون وابستگی به Google Fonts که در ایران گاهی فیلتر است)
const vazir = localFont({ src: '../../fonts/Vazirmatn-Variable.woff2', variable: '--font-vazir', display: 'swap', weight: '100 900' });

export async function generateMetadata() {
  const { siteName } = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: { default: `${siteName} | ${SITE.tagline}`, template: `%s | ${siteName}` },
    description: 'خرید گوشی موبایل، لپ‌تاپ، هدفون، پاور بانک و لوازم جانبی با ضمانت اصالت کالا، ارسال سریع و امکان خرید اقساطی.',
    applicationName: siteName,
    openGraph: { type: 'website', locale: 'fa_IR', siteName }
  };
}
export const viewport = { themeColor: '#f26a1b', width: 'device-width', initialScale: 1 };
export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }) {
  const [user, site] = await Promise.all([getUser(), getSettings()]);
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body data-hide-stock={site.showInventoryCount ? undefined : ''}>
        <StoreProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:right-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-pop">پرش به محتوای اصلی</a>
          <Header user={user ? { name: user.name } : null} site={site} />
          <main id="main" className="min-h-[60vh]">{children}</main>
          <Footer site={site} />
        </StoreProvider>
      </body>
    </html>
  );
}
