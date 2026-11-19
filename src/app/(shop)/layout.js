import { Vazirmatn } from 'next/font/google';
import './globals.css';

const vazir = Vazirmatn({ subsets: ['arabic', 'latin'], variable: '--font-vazir' });
export const metadata = {
  title: 'موبایلر | فروشگاه لوازم الکترونیکی',
  description: 'فروشگاه نمایشی موبایلر؛ گوشی، لپ‌تاپ، هدفون و لوازم جانبی با نمایش موجودی انبار'
};

// هدر و فوتر اختصاصی داخل Storefront قرار دارند؛ از نمایش نسخه قدیمی و تکراری جلوگیری می‌کنیم.
export default function ShopRootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazir.variable} font-sans`}>{children}</body>
    </html>
  );
}
