# آپلود تصویر کالا از پنل ادمین

- در فرم افزودن/ویرایش کالا دکمه‌ی «انتخاب تصویر از سیستم» اضافه شد؛ دیگر نیازی به URL نیست (فیلد URL هنوز به‌عنوان گزینه‌ی جایگزین هست).
- تصویر در مرورگر بهینه می‌شود (حداکثر ۱۴۰۰ پیکسل، WebP) و به `/api/admin/upload` (فقط ادمین) ارسال می‌شود.
- تصویر در MongoDB (کالکشن `productimages`) ذخیره می‌شود، چون روی Vercel نوشتن روی دیسک ماندگار نیست. آدرس نهایی: `/api/images/<id>` (عمومی، با کش طولانی).
- فقط JPG/PNG/WebP/GIF؛ نوع فایل از روی بایت‌ها بررسی می‌شود. SVG عمداً مجاز نیست. سقف حجم: ۳ مگابایت.
- با حذف کالا یا تعویض تصویر، تصویر آپلودیِ قبلی از دیتابیس پاک می‌شود.
- فایل‌های جدید: `src/models/ProductImage.js`، `src/lib/images.js`، `src/app/api/admin/upload/route.js`، `src/app/api/images/[id]/route.js`
- فایل‌های تغییریافته: `src/admin/components/product-form.tsx`، `src/admin/globals.css`، `src/app/api/admin/products/[id]/route.js`
