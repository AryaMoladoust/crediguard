"use client";
import { useMemo } from "react";
import { CATEGORY, METHOD, ORDER_STATUS, Order, useApi } from "@/admin/lib/api";

// هر سفارش یک «تراکنش» است؛ داده‌ای جز سفارش‌های واقعی در دیتابیس وجود ندارد
export type Tx = { id: string; date: string; ts: number; customer: string; category: string; type: string; status: string; statusKey: string; amount: number };
export function useTransactions() {
  const { data, error, loading } = useApi<Order[]>("/api/admin/orders", 30000);
  const txs = useMemo<Tx[]>(() => (data ?? []).map(o => ({
    id: o.code, ts: new Date(o.createdAt).getTime(), date: new Date(o.createdAt).toLocaleDateString("fa-IR"),
    customer: o.customer, category: o.categories.map(c => CATEGORY[c] || c).join("، ") || "—",
    type: METHOD[o.method], status: ORDER_STATUS[o.status], statusKey: o.status, amount: o.total,
  })), [data]);
  return { txs, error, loading };
}
export const amountBand = (a: number) => a < 10_000_000 ? "کمتر از ۱۰ میلیون" : a < 25_000_000 ? "۱۰ تا ۲۵ میلیون" : a < 50_000_000 ? "۲۵ تا ۵۰ میلیون" : "بیشتر از ۵۰ میلیون";
export const statusTone = (k: string) => (k === "completed" || k === "confirmed" ? "success" : k === "pending" ? "warning" : "danger") as "success" | "warning" | "danger";
