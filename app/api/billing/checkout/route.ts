import { ensureCoreSchema } from "@/db";
import { requireUser } from "@/lib/auth";
import {
  getStripeCustomerId,
  hasManageableSubscription,
  recordSubscriptionCheckout,
} from "@/lib/membership";
import { createStripeSubscriptionCheckout } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    await ensureCoreSchema();
    const user = await requireUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const planId = typeof body.planId === "string" ? body.planId : "";
    if (await hasManageableSubscription(user.id)) throw new Error("SUBSCRIPTION_EXISTS");
    const { session, plan } = await createStripeSubscriptionCheckout({
      userId: user.id,
      userEmail: user.email,
      planId,
      origin: new URL(request.url).origin,
      customerId: await getStripeCustomerId(user.id),
    });
    await recordSubscriptionCheckout({
      userId: user.id,
      sessionId: session.id,
      planId: plan.id,
    });
    return Response.json({ url: session.url });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CHECKOUT_FAILED";
    const status = code === "AUTH_REQUIRED"
      ? 401
      : code === "PLAN_NOT_FOUND"
        ? 404
        : code === "SUBSCRIPTION_EXISTS"
          ? 409
          : code.startsWith("ENV_")
            ? 503
            : 500;
    return Response.json({ error: { code, message: friendlyMessage(code) } }, { status });
  }
}

function friendlyMessage(code: string) {
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "请先登录后再订阅会员",
    PLAN_NOT_FOUND: "会员套餐不存在",
    SUBSCRIPTION_EXISTS: "你已有会员订阅，请前往账户中心管理",
    ENV_STRIPE_SECRET_KEY_REQUIRED: "尚未配置 Stripe Secret Key",
    ENV_STRIPE_MONTHLY_PRICE_ID_REQUIRED: "尚未配置 Stripe 月度会员 Price ID",
    ENV_STRIPE_YEARLY_PRICE_ID_REQUIRED: "尚未配置 Stripe 年度会员 Price ID",
    ENV_PUBLIC_APP_URL_REQUIRED: "尚未配置线上网站地址",
  };
  return messages[code] ?? "暂时无法创建会员订阅";
}
