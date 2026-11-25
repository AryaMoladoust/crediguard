"use client";
import { useCallback, useEffect, useState } from "react";
import { STATUS_LABEL } from "@/lib/order-flow";

export const fa = (n: number) => Math.round(n || 0).toLocaleString("fa-IR");
export const money = (n: number) => `${fa(n)} تومان`;
export const jDate = (d: string | Date) => new Date(d).toLocaleDateString("fa-IR");
export const jDateTime = (d: string | Date) => new Date(d).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" });
export const ago = (d: string) => { const m = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000)); return m < 1 ? "هم‌اکنون" : m < 60 ? `${fa(m)} دقیقه پیش` : m < 1440 ? `${fa(m / 60)} ساعت پیش` : `${fa(m / 1440)} روز پیش`; };
export const ORDER_STATUS: Record<string, string> = STATUS_LABEL;
export const METHOD: Record<string, string> = { cash: "نقدی", installment: "اقساطی" };
export const CATEGORY: Record<string, string> = { mobile: "گوشی", laptop: "لپ‌تاپ", headphone: "هدفون", powerbank: "پاور بانک", accessory: "لوازم جانبی" };
export const statusTone = (s: string) => (s === "completed" || s === "confirmed" ? "success" : s === "shipped" ? "info" : s === "pending" ? "warning" : "danger") as "success" | "warning" | "danger" | "info";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "completed" | "cancelled";
export type Order = { id: string; code: string; customer: string; phone: string; address: string; product: string; categories: string[]; total: number; method: "cash" | "installment"; status: OrderStatus; paid: boolean; createdAt: string; updatedAt: string };
export type StatusSummary = Record<OrderStatus, { count: number; sum: number }>;
// پاسخ صفحه‌بندی‌شده‌ی سرور
export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number; pages: number };
export type OrdersPage = Paged<Order> & { summary: { byStatus: StatusSummary } };
export type CustomersPage = Paged<Customer> & { summary: { customers: number; repeat: number; installmentBuyers: number; spent: number } };
export type Customer = { id: string; phone: string; name: string; address: string; orders: number; activeOrders: number; spent: number; installmentOrders: number; first: string; last: string };

// خواندن از API ادمین با تازه‌سازی دوره‌ای؛ در صورت 401 به صفحه ورود می‌رود
export function useApi<T>(url: string, intervalMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!url) { setLoading(false); return; }
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "خطا در دریافت اطلاعات");
      setData(d); setError("");
    } catch (e: any) { setError(e.message || "دریافت اطلاعات ممکن نشد"); }
    finally { setLoading(false); }
  }, [url]);
  useEffect(() => { load(); if (!intervalMs) return; const t = setInterval(() => { if (!document.hidden) load(); }, intervalMs); return () => clearInterval(t); }, [load, intervalMs]);
  return { data, error, loading, reload: load };
}

// ساخت query-string (مقدارهای خالی حذف می‌شوند)
export const qs = (p: Record<string, string | number | undefined | null>) => {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : "";
};
// برای جست‌وجوی زنده: بعد از مکث کوتاه تایپ، مقدار تازه می‌شود تا به ازای هر حرف درخواست نرود
export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
