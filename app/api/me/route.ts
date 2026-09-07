import { ensureCoreSchema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getCreditSummary } from "@/lib/credits";
import { getMembershipSummary, reconcileSubscriptionCredits } from "@/lib/membership";

export async function GET(request: Request) {
  await ensureCoreSchema();
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ user: null, credits: null, membership: null });
  await reconcileSubscriptionCredits(user.id);
  const [credits, membership] = await Promise.all([
    getCreditSummary(user.id),
    getMembershipSummary(user.id),
  ]);
  return Response.json({
    user: { ...user, creditBalance: credits.balance },
    credits,
    membership,
  });
}
