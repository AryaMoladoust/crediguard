"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EmptyState } from "@/admin/components/ui";
import { ProductForm, ProductData } from "@/admin/components/product-form";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/admin/products/${id}`, { cache: "no-store" }).then(async r => {
      if (r.status === 401) { window.location.href = "/admin/login"; return; }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "خطا");
      setProduct(d);
    }).catch(e => setError(e.message || "دریافت محصول ممکن نشد"));
  }, [id]);
  if (error) return <EmptyState title="محصول پیدا نشد" desc={error}/>;
  if (!product) return <EmptyState title="در حال بارگذاری..."/>;
  return <ProductForm product={product}/>;
}
