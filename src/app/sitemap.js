import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
export const dynamic = 'force-dynamic';
export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const pages = ['', '/products', '/about', '/contact', '/faq', '/track'].map((p) => ({ url: base + p }));
  try { await connectDB(); const items = await Product.find().select('slug updatedAt').limit(5000).lean(); return [...pages, ...items.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt }))]; } catch { return pages; }
}
