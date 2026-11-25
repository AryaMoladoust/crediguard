// ساخت CSV امن. سلول متنی که با = + - @ (یا Tab/CR) شروع شود در Excel/Sheets به‌عنوان فرمول اجرا می‌شود
// (Formula Injection)؛ با افزودن « ' » در ابتدای آن، فقط به‌صورت متن نمایش داده می‌شود.
// نام و آدرس مشتری از فرم عمومی فروشگاه می‌آید، پس همه‌ی مقدارهای متنی باید از این تابع رد شوند.
const FORMULA_START = /^[\t\r]|^[\s\u200B-\u200F\uFEFF]*[=+\-@]/;

export function csvCell(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v); // عدد واقعی فرمول نیست (مثلاً -۵)
  let s = v == null ? '' : String(v);
  if (FORMULA_START.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}
export const csvRow = (cells) => cells.map(csvCell).join(',');

// پاسخ دانلود (با BOM تا Excel فارسی را درست بخواند)
export function csvResponse(rows, filename) {
  return new Response('\uFEFF' + rows.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store'
    }
  });
}
