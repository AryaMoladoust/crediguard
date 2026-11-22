import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import Storefront from '@/components/Storefront';

export const dynamic = 'force-dynamic';
const plain = (d) => JSON.parse(JSON.stringify(d));

// فقط داده‌ی واقعی دیتابیس؛ هیچ کاتالوگ نمایشی‌ای جایگزین نمی‌شود
export default async function Home() {
  let products = [];
  let failed = false;
  try {
    await connectDB();
    products = plain(await Product.find().sort({ sold: -1, createdAt: -1 }).limit(200).lean());
  } catch (error) {
    console.error('storefront database error:', error?.message);
    failed = true;
  }
  return <Storefront initialProducts={products} databaseError={failed} />;
}
