import { redirect } from 'next/navigation';
import { getUser } from '@/lib/user-session';
import AccountNav from '@/components/AccountNav';
import CreditDashboard from '@/components/CreditDashboard';
export const metadata = { title: 'اعتبار و اقساط' };
export const dynamic = 'force-dynamic';
export default async function CreditPage() {
  const user = await getUser();
  if (!user) redirect('/account/login');
  return (
    <div className="wrap py-8">
      <h1 className="text-2xl sm:text-3xl">اعتبار و اقساط</h1>
      <AccountNav active="/account/credit" />
      <CreditDashboard />
    </div>
  );
}
