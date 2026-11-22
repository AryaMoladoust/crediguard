"use client";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, PackagePlus, Palette, RotateCcw, Save } from "lucide-react";
import { Button, PageHeader, Panel } from "@/admin/components/ui";

export type ProductData = { id: string; sku: string; name: string; category: string; brand: string; price: number; oldPrice: number; stock: number; minStock: number; colors: string[]; colorHex: string; isOffer: boolean; image: string; description: string };
const CATS: [string, string][] = [["mobile", "گوشی"], ["laptop", "لپ‌تاپ"], ["headphone", "هدفون"], ["powerbank", "پاور بانک"], ["accessory", "لوازم جانبی"]];
const swatches = ["#111827","#334155","#64748b","#94a3b8","#cbd5e1","#ffffff","#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#10b981","#14b8a6","#06b6d4","#0ea5e9","#3b82f6","#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#f43f5e","#7c2d12"];
const toLatin = (s: string) => s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
const num = (s: string) => (s.trim() === "" ? NaN : Number(toLatin(s).replace(/[,٬\s]/g, "")));
const hexToRgb = (hex: string) => { const h = hex.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgbToHex = (r: number, g: number, b: number) => "#" + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("").toUpperCase();

export function ProductForm({ product }: { product?: ProductData }) {
  const router = useRouter();
  const edit = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [category, setCategory] = useState(product?.category ?? "accessory");
  const [brand, setBrand] = useState(product?.brand && product.brand !== "—" ? product.brand : "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [oldPrice, setOldPrice] = useState(product?.oldPrice ? String(product.oldPrice) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "1");
  const [minStock, setMinStock] = useState(product ? String(product.minStock) : "5");
  const [description, setDescription] = useState(product?.description ?? "");
  const [image, setImage] = useState(product?.image && !/^\/img\/[a-z-]+\.svg$/.test(product.image) ? product.image : "");
  const [isOffer, setIsOffer] = useState(product?.isOffer ?? false);
  const [color, setColor] = useState(product?.colorHex || "#477EF4");
  const [colorName, setColorName] = useState(product?.colors?.[0] ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const rgb = useMemo(() => hexToRgb(color), [color]);
  const setRgb = (i: number, v: number) => { const n = [...rgb]; n[i] = v; setColor(rgbToHex(n[0], n[1], n[2])); };
  const catName = CATS.find(c => c[0] === category)?.[1] ?? "";

  async function submit(e: FormEvent) {
    e.preventDefault();
    const p = num(price), op = oldPrice.trim() ? num(oldPrice) : 0, st = num(stock), ms = num(minStock);
    if (!name.trim()) return setError("نام محصول الزامی است.");
    if (!edit && !sku.trim()) return setError("کد کالا الزامی است.");
    if (!Number.isInteger(p) || p < 1) return setError("قیمت فروش باید عدد صحیح بزرگ‌تر از صفر باشد.");
    if (!Number.isInteger(op) || op < 0) return setError("قیمت قبلی نامعتبر است.");
    if (op && op <= p) return setError("قیمت قبلی (قبل از تخفیف) باید بیشتر از قیمت فروش باشد، یا خالی بماند.");
    if (!Number.isInteger(st) || st < 0 || !Number.isInteger(ms) || ms < 0) return setError("موجودی و نقطه سفارش باید عدد صحیح ۰ یا بیشتر باشند.");
    setBusy(true); setError("");
    const body: Record<string, unknown> = { name: name.trim(), category, brand: brand.trim(), price: p, oldPrice: op, stock: st, minStock: ms, description, image: image.trim(), isOffer, colorName: colorName.trim(), hex: color };
    if (!edit) body.sku = sku.trim();
    try {
      const res = await fetch(edit ? `/api/admin/products/${product!.id}` : "/api/admin/products", { method: edit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      if (!res.ok) { setError(data.error || "ثبت محصول ناموفق بود."); setBusy(false); return; }
      setSaved(true); setTimeout(() => router.push("/admin/inventory"), 600);
    } catch { setError("ارتباط با سرور برقرار نشد."); setBusy(false); }
  }

  return <>
    <PageHeader title={edit ? "ویرایش محصول" : "افزودن محصول جدید"} subtitle={edit ? "تغییرات بلافاصله در فروشگاه و انبار اعمال می‌شود." : "کالا مستقیم در دیتابیس ثبت می‌شود و هم در فروشگاه و هم در انبار نمایش داده می‌شود."} eyebrow={edit ? "INVENTORY / EDIT PRODUCT" : "INVENTORY / NEW PRODUCT"} action={<Button variant="secondary" href="/admin/inventory" icon={<ArrowRight size={15}/>}>بازگشت به انبار</Button>}/>
    {error && <div className="form-error">{error}</div>}
    {saved && <div className="inline-notice"><Check size={15}/>ذخیره شد؛ در حال بازگشت به فهرست انبار...</div>}
    <form onSubmit={submit} className="product-form-layout">
      <div className="product-form-main">
        <Panel title="اطلاعات پایه محصول" subtitle="این اطلاعات در فروشگاه و سفارش‌ها نمایش داده می‌شود.">
          <div className="form-grid">
            <label className="form-field span-2"><span>نام محصول <i>*</i></span><input value={name} onChange={e => setName(e.target.value)} placeholder="مثلاً Samsung Galaxy A55" required maxLength={120}/></label>
            <label className="form-field"><span>کد کالا / SKU {!edit && <i>*</i>}</span><input value={sku} onChange={e => setSku(e.target.value)} placeholder="PH-3012 (حروف انگلیسی، عدد، - و _)" disabled={edit} dir="ltr" required={!edit}/>{edit && <small>کد کالا بعد از ثبت قابل تغییر نیست.</small>}</label>
            <label className="form-field"><span>برند</span><input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Samsung، Sony، ..."/></label>
            <label className="form-field"><span>دسته‌بندی</span><select value={category} onChange={e => setCategory(e.target.value)}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="form-field"><span>قیمت فروش (تومان) <i>*</i></span><input inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} placeholder="مثلاً 19000000" required/></label>
            <label className="form-field"><span>قیمت قبل از تخفیف (اختیاری)</span><input inputMode="numeric" value={oldPrice} onChange={e => setOldPrice(e.target.value)} placeholder="برای نمایش درصد تخفیف"/></label>
            <label className="form-field"><span>موجودی</span><input inputMode="numeric" value={stock} onChange={e => setStock(e.target.value)}/></label>
            <label className="form-field"><span>نقطه سفارش مجدد</span><input inputMode="numeric" value={minStock} onChange={e => setMinStock(e.target.value)}/><small>با رسیدن موجودی به این عدد، هشدار کمبود نمایش داده می‌شود.</small></label>
            <label className="form-field"><span>آدرس تصویر</span><input dir="ltr" value={image} onChange={e => setImage(e.target.value)} placeholder="/img/products/a55.jpg  یا  https://..."/><small>خالی = تصویر پیش‌فرض دسته. فایل را در public/img/products بگذارید.</small></label>
            <label className="form-field" style={{ justifyContent: "flex-end" }}><span>پیشنهاد ویژه</span><span style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={isOffer} onChange={e => setIsOffer(e.target.checked)}/> نمایش به‌عنوان پیشنهاد ویژه</span></label>
            <label className="form-field span-2"><span>توضیحات محصول</span><textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} placeholder="توضیحات و ویژگی‌های کلیدی..."/></label>
          </div>
        </Panel>
        <Panel title="رنگ محصول" subtitle="رنگ با پالت یا مقدار RGB انتخاب می‌شود.">
          <div className="color-picker-layout">
            <div className="color-picker-preview"><div className="color-preview-block" style={{ background: color }}><span>PREVIEW</span></div><div><b>{colorName || "بدون نام"}</b><small className="mono">{color.toUpperCase()}</small></div></div>
            <div className="color-picker-controls">
              <div className="palette-head"><span><Palette size={15}/> پالت رنگ</span><input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="انتخاب رنگ دلخواه"/></div>
              <div className="swatch-grid">{swatches.map(s => <button type="button" key={s} onClick={() => setColor(s)} className={color.toLowerCase() === s.toLowerCase() ? "swatch selected" : "swatch"} style={{ background: s }} aria-label={s}/>)}</div>
              <div className="rgb-controls">{["R", "G", "B"].map((c, i) => <label key={c}><span>{c}</span><input type="range" min="0" max="255" value={rgb[i]} onChange={e => setRgb(i, Number(e.target.value))}/><input className="rgb-number" type="number" min="0" max="255" value={rgb[i]} onChange={e => setRgb(i, Number(e.target.value))}/></label>)}</div>
              <div className="color-name-row"><label className="form-field"><span>نام رنگ</span><input value={colorName} onChange={e => setColorName(e.target.value)} placeholder="مثلاً آبی اقیانوسی"/></label><button type="button" className="btn btn-ghost" onClick={() => { setColor("#477EF4"); setColorName(""); }}><RotateCcw size={14}/> بازنشانی</button></div>
            </div>
          </div>
        </Panel>
      </div>
      <aside className="product-form-side">
        <Panel title="پیش‌نمایش" subtitle="نمای ساده از کارت کالا">
          <div className="product-preview-card">
            <div className="product-preview-image" style={{ background: `linear-gradient(145deg, ${color}22, ${color}44)` }}>{image ? <img src={image} alt="" style={{ maxWidth: "70%", maxHeight: "70%", objectFit: "contain" }}/> : <div className="preview-product-shape" style={{ borderColor: color }}><PackagePlus size={42} color={color}/></div>}<span>{edit ? "EDIT" : "NEW ITEM"}</span></div>
            <div className="product-preview-info"><span className="preview-category">{catName}</span><h3>{name || "نام محصول"}</h3><p>{brand || "نام برند"}</p><strong>{Number.isFinite(num(price)) ? num(price).toLocaleString("fa-IR") : "۰"} تومان</strong>{colorName && <div className="preview-color-line"><i style={{ background: color }}/>{colorName}</div>}</div>
          </div>
        </Panel>
        <Button type="submit" icon={<Save size={16}/>} className="full-submit" disabled={busy}>{edit ? "ذخیره تغییرات" : "ثبت محصول در دیتابیس"}</Button>
        <Button type="button" variant="secondary" className="full-submit" onClick={() => router.push("/admin/inventory")}>انصراف</Button>
      </aside>
    </form>
  </>;
}
