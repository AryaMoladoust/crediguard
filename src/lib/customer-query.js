import Order, { AWAITING_PAYMENT } from '@/models/Order';
import { escapeRegex } from './paging';

const NEW_DAYS = 30;
const live = { $ne: ['$status', 'cancelled'] };
const SORTS = { recent: { last: -1, _id: 1 }, spent: { spent: -1, _id: 1 }, orders: { orders: -1, _id: 1 } };

// مشتریان از روی سفارش‌ها ساخته می‌شوند (گروه‌بندی بر اساس شماره موبایل)
export const groupByPhone = [
  { $sort: { createdAt: 1 } },
  { $group: {
    _id: '$customer.phone',
    name: { $last: '$customer.name' },
    address: { $last: '$customer.address' },
    orders: { $sum: 1 },
    activeOrders: { $sum: { $cond: [live, 1, 0] } },
    spent: { $sum: { $cond: [live, '$total', 0] } },
    installmentOrders: { $sum: { $cond: [{ $and: [{ $eq: ['$method', 'installment'] }, live] }, 1, 0] } },
    first: { $min: '$createdAt' },
    last: { $max: '$createdAt' }
  } }
];
export const shapeCustomer = (c) => ({ id: c._id, phone: c._id, name: c.name || '—', address: c.address || '', orders: c.orders, activeOrders: c.activeOrders, spent: c.spent, installmentOrders: c.installmentOrders, first: c.first, last: c.last });

// فیلتر روی خروجی گروه‌بندی (نام/موبایل/«جدید»)؛ فیلتر قبل از گروه‌بندی جمع‌ها را اشتباه می‌کرد
function rowMatch(sp) {
  const and = [];
  const q = (sp.get('q') || '').trim().slice(0, 80);
  if (q) { const re = new RegExp(escapeRegex(q), 'i'); and.push({ $or: [{ name: re }, { _id: re }] }); }
  if (sp.get('mode') === 'new') and.push({ first: { $gte: new Date(Date.now() - NEW_DAYS * 86400000) } });
  const kind = sp.get('kind');
  if (kind === 'repeat') and.push({ activeOrders: { $gt: 1 } });
  if (kind === 'installment') and.push({ installmentOrders: { $gt: 0 } });
  if (kind === 'cash') and.push({ installmentOrders: 0, activeOrders: { $gt: 0 } });
  return and.length ? { $and: and } : {};
}
export const sortOf = (sp) => SORTS[sp.get('sort')] || SORTS.recent;

// صفحه‌ای از مشتریان + خلاصه‌ی کل (روی همه‌ی مشتریان، مستقل از جست‌وجو و صفحه)
export async function customersPage(sp, { page, pageSize }) {
  const run = async (p) => {
    const [r] = await Order.aggregate([
      { $match: { status: { $ne: AWAITING_PAYMENT } } },
      ...groupByPhone,
      { $facet: {
        summary: [{ $group: { _id: null, customers: { $sum: 1 }, repeat: { $sum: { $cond: [{ $gt: ['$activeOrders', 1] }, 1, 0] } }, installmentBuyers: { $sum: { $cond: [{ $gt: ['$installmentOrders', 0] }, 1, 0] } }, spent: { $sum: '$spent' } } }],
        count: [{ $match: rowMatch(sp) }, { $count: 'n' }],
        rows: [{ $match: rowMatch(sp) }, { $sort: sortOf(sp) }, { $skip: (p - 1) * pageSize }, { $limit: pageSize }]
      } }
    ]);
    return r;
  };
  let r = await run(page);
  const total = r.count[0]?.n || 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (page > pages) { page = pages; r = await run(page); } // صفحه‌ی خالی‌شده → آخرین صفحه
  const s = r.summary[0] || { customers: 0, repeat: 0, installmentBuyers: 0, spent: 0 };
  return { items: r.rows.map(shapeCustomer), total, page, pageSize, pages, summary: { customers: s.customers, repeat: s.repeat, installmentBuyers: s.installmentBuyers, spent: s.spent } };
}

// همه‌ی مشتریانِ مطابق فیلتر برای خروجی CSV (سقف ۲۰٬۰۰۰)
export async function customersForExport(sp) {
  const rows = await Order.aggregate([
    { $match: { status: { $ne: AWAITING_PAYMENT } } },
    ...groupByPhone,
    { $match: rowMatch(sp) }, { $sort: sortOf(sp) }, { $limit: 20000 }
  ]);
  return rows.map(shapeCustomer);
}
