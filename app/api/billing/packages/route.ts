import { membershipPlans } from "@/lib/membership-plans";

export async function GET() {
  return Response.json({ plans: membershipPlans() });
}
