import { Phone, Mail, MapPin, Clock3 } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import { SITE } from '@/lib/site';
import { getSettings } from '@/lib/settings';
export const metadata = { title: 'تماس با ما' };
export default async function Contact() {
  const { supportPhone } = await getSettings();
  const rows = [[Phone, 'تلفن پشتیبانی', supportPhone], [Mail, 'ایمیل', SITE.email], [MapPin, 'نشانی', SITE.address], [Clock3, 'ساعت پاسخ‌گویی', SITE.hours]];
  return (
    <div className="wrap py-10">
      <h1 className="text-2xl sm:text-3xl">تماس با ما</h1>
      <p className="mt-1 text-sm text-ink-500">پرسش یا پیشنهادی دارید؟ پیام بگذارید یا مستقیم تماس بگیرید.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <ContactForm />
        <ul className="space-y-3">{rows.map(([I, t, v]) => <li key={t} className="card flex items-start gap-3 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><I size={19} /></span><span className="text-sm leading-6"><b className="block">{t}</b><span className="text-ink-500">{v}</span></span></li>)}</ul>
      </div>
    </div>
  );
}
