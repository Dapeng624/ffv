import { paymentProviders } from "@/lib/payment-providers";
import { runtimeEnv } from "@/lib/runtime-env";

export async function GET() {
  const appUrlConfigured = Boolean(runtimeEnv("PUBLIC_APP_URL"));
  return Response.json({
    providers: paymentProviders({
      creem: appUrlConfigured && hasRuntimeEnv(
        "CREEM_API_KEY",
        "CREEM_WEBHOOK_SECRET",
        "CREEM_MONTHLY_PRODUCT_ID",
        "CREEM_YEARLY_PRODUCT_ID",
      ),
      stripe: appUrlConfigured && hasRuntimeEnv(
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_MONTHLY_PRICE_ID",
        "STRIPE_YEARLY_PRICE_ID",
      ),
    }),
  });
}

function hasRuntimeEnv(...names: string[]) {
  return names.every((name) => Boolean(runtimeEnv(name)));
}
