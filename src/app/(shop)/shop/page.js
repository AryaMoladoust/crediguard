import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import Storefront from '@/components/Storefront';
import { DEMO_PRODUCTS } from '@/lib/demo-products';

export const dynamic = 'force-dynamic';
const plain = (d) => JSON.parse(JSON.stringify(d));

export default async function Home() {
  let products = [];
  let failed = false;
  try {
    await connectDB();
    products = plain(await Product.find().sort({ sold: -1, createdAt: -1 }).limit(100).lean());
  } catch (error) {
    console.error('storefront database error:', error?.message);
    failed = true;
  }
  const usingDemoCatalog = failed || products.length === 0;
  return <Storefront initialProducts={usingDemoCatalog ? DEMO_PRODUCTS : products} databaseError={usingDemoCatalog} />;
}
