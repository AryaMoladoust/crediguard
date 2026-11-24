import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { getUser } from '@/lib/user-session';
export const metadata = { title: 'ورود به حساب' };
export default async function LoginPage() { if (await getUser()) redirect('/account'); return <AuthForm mode="login" />; }
