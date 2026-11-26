'use client';
import Link from 'next/link';
import { UserRound, ShieldCheck, MessagesSquare, Bell } from 'lucide-react';
const TABS = [['/account', UserRound, 'حساب و سفارش‌ها'], ['/account/credit', ShieldCheck, 'اعتبار و اقساط'], ['/account/support', MessagesSquare, 'پشتیبانی'], ['/account/notifications', Bell, 'اعلان‌ها']];
export default function AccountNav({ active }) {
  return (
    <nav aria-label="بخش‌های حساب" className="mt-5 flex gap-2 overflow-x-auto pb-1">
      {TABS.map(([href, Icon, label]) => (
        <Link key={href} href={href} aria-current={active === href ? 'page' : undefined} className={`btn !min-h-10 shrink-0 ${active === href ? 'btn-primary' : 'btn-line'}`}><Icon size={16} />{label}</Link>
      ))}
    </nav>
  );
}
