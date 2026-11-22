import { isAdmin, unauthorized } from '@/lib/admin-guard';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  return Response.json({ email: String(process.env.ADMIN_EMAIL || '').trim() });
}
