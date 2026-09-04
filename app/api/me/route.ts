import { ensureCoreSchema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getCreditSummary } from "@/lib/credits";

export async function GET(request: Request) {
  await ensureCoreSchema();
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ user: null, credits: null });
  return Response.json({ user, credits: await getCreditSummary(user.id) });
}
