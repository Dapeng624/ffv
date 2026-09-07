import { membershipPlans } from "@/lib/membership-plans";
import { paymentProviders } from "@/lib/payment-providers";

export async function GET() {
  return Response.json({ plans: membershipPlans(), providers: paymentProviders() });
}
