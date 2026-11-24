'use client';
import { useState } from 'react';
import { defaultImage } from '@/lib/format';

// تصویر با جایگزین خودکار دسته‌بندی وقتی آدرس خراب یا خالی است
export default function SmartImg({ src, alt, category, className = '', eager = false }) {
  const [bad, setBad] = useState(false);
  const url = !src || bad ? defaultImage(category) : src;
  return <img src={url} alt={alt || ''} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setBad(true)} className={className} />;
}
