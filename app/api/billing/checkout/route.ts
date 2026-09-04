import { ensureCoreSchema } from "@/db";
import { requireUser } from "@/lib/auth";
import { assertPaymentEnv } from "@/lib/credits";
import { createStripeCheckoutSession, recordPendingOrder } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    await ensureCoreSchema();
    const user = await requireUser(request);
    assertPaymentEnv();
    const body = (await request.json()) as Record<string, unknown>;
    const packageId = typeof body.packageId === "string" ? body.packageId : "";
    const { session, selectedPackage } = await createStripeCheckoutSession({
      userId: user.id,
      packageId,
      origin: new URL(request.url).origin,
    });
    await recordPendingOrder({
      userId: user.id,
      sessionId: session.id,
      packageId: selectedPackage.id,
      credits: selectedPackage.credits,
      amount: selectedPackage.amount,
      currency: selectedPackage.currency,
    });
    return Response.json({ url: session.url });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CHECKOUT_FAILED";
    const status = code === "AUTH_REQUIRED" ? 401 : code === "PACKAGE_NOT_FOUND" ? 404 : code.startsWith("ENV_") ? 503 : 500;
    return Response.json({ error: { code, message: friendlyMessage(code) } }, { status });
  }
}

function friendlyMessage(code: string) {
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "请先登录后再购买积分",
    PACKAGE_NOT_FOUND: "套餐不存在",
    ENV_STRIPE_SECRET_KEY_REQUIRED: "尚未配置 Stripe Secret Key",
    ENV_PUBLIC_APP_URL_REQUIRED: "尚未配置线上网站地址",
  };
  return messages[code] ?? "暂时无法创建支付订单";
}
