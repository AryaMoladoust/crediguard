"use client";
import { useCallback, useEffect, useState } from "react";

export const fa = (n: number) => Math.round(n || 0).toLocaleString("fa-IR");
export const money = (n: number) => `${fa(n)} تومان`;
export const jDate = (d: string | Date) => new Date(d).toLocaleDateString("fa-IR");
export const jDateTime = (d: string | Date) => new Date(d).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" });
export const ago = (d: string) => { const m = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000)); return m < 1 ? "هم‌اکنون" : m < 60 ? `${fa(m)} دقیقه پیش` : m < 1440 ? `${fa(m / 60)} ساعت پیش` : `${fa(m / 1440)} روز پیش`; };
export const ORDER_STATUS: Record<string, string> = { pending: "در انتظار", confirmed: "تأییدشده", completed: "تکمیل‌شده", cancelled: "لغوشده" };
export const METHOD: Record<string, string> = { cash: "نقدی", installment: "اقساطی" };
export const CATEGORY: Record<string, string> = { mobile: "گوشی", laptop: "لپ‌تاپ", headphone: "هدفون", powerbank: "پاور بانک", accessory: "لوازم جانبی" };
export const statusTone = (s: string) => (s === "completed" || s === "confirmed" ? "success" : s === "pending" ? "warning" : "danger") as "success" | "warning" | "danger";

export type Order = { id: string; code: string; customer: string; phone: string; address: string; product: string; categories: string[]; total: number; method: "cash" | "installment"; status: "pending" | "confirmed" | "completed" | "cancelled"; createdAt: string; updatedAt: string };
export type Customer = { id: string; phone: string; name: string; address: string; orders: number; activeOrders: number; spent: number; installmentOrders: number; first: string; last: string };

// خواندن از API ادمین با تازه‌سازی دوره‌ای؛ در صورت 401 به صفحه ورود می‌رود
export function useApi<T>(url: string, intervalMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
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
