import { clearUserCookie } from '@/lib/user-session';
export const dynamic = 'force-dynamic';
export async function POST() { await clearUserCookie(); return Response.json({ ok: true }); }
