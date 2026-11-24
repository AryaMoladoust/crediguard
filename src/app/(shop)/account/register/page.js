import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { getUser } from '@/lib/user-session';
export const metadata = { title: 'ثبت‌نام' };
export default async function RegisterPage() { if (await getUser()) redirect('/account'); return <AuthForm mode="register" />; }
