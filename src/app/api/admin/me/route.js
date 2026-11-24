import { getAdmin, unauthorized } from '@/lib/admin-guard';
export const dynamic = 'force-dynamic';
export async function GET() {
  const a = await getAdmin();
  if (!a) return unauthorized();
  return Response.json({ email: a.email, name: a.name, role: a.role });
}
