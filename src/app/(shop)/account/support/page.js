import { redirect } from 'next/navigation';
import { getUser } from '@/lib/user-session';
import AccountNav from '@/components/AccountNav';
import SupportChat from '@/components/SupportChat';
export const metadata = { title: 'پشتیبانی' };
export const dynamic = 'force-dynamic';
export default async function SupportPage() {
  const user = await getUser();
  if (!user) redirect('/account/login');
  return (
    <div className="wrap py-8">
      <h1 className="text-2xl sm:text-3xl">پشتیبانی</h1>
      <AccountNav active="/account/support" />
      <div className="mt-6 max-w-3xl"><SupportChat /></div>
    </div>
  );
}
