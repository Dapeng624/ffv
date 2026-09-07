import { ensureCoreSchema } from "@/db";
import { requireUser } from "@/lib/auth";
import { createSubscriptionCheckout } from "@/lib/billing";
import {
  getProviderCustomerId,
  hasManageableSubscription,
  recordSubscriptionCheckout,
} from "@/lib/membership";
import { isPaymentProvider } from "@/lib/payment-providers";

export async function POST(request: Request) {
  try {
    await ensureCoreSchema();
    const user = await requireUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const planId = typeof body.planId === "string" ? body.planId : "";
    const providerValue = typeof body.provider === "string" ? body.provider : "stripe";
    if (!isPaymentProvider(providerValue)) throw new Error("PAYMENT_PROVIDER_INVALID");
    if (await hasManageableSubscription(user.id)) throw new Error("SUBSCRIPTION_EXISTS");
    const { sessionId, url, plan } = await createSubscriptionCheckout(providerValue, {
      userId: user.id,
      userEmail: user.email,
      userName: user.displayName,
      planId,
      origin: new URL(request.url).origin,
      customerId: await getProviderCustomerId(user.id, providerValue),
    });
    await recordSubscriptionCheckout({
      provider: providerValue,
      userId: user.id,
      sessionId,
      planId: plan.id,
    });
    return Response.json({ url });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CHECKOUT_FAILED";
    const status = code === "AUTH_REQUIRED"
      ? 401
      : code === "PLAN_NOT_FOUND"
        ? 404
        : code === "PAYMENT_PROVIDER_INVALID"
          ? 400
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
    PAYMENT_PROVIDER_INVALID: "不支持该支付方式",
    SUBSCRIPTION_EXISTS: "你已有会员订阅，请前往账户中心管理",
    ENV_STRIPE_SECRET_KEY_REQUIRED: "尚未配置 Stripe Secret Key",
    ENV_STRIPE_MONTHLY_PRICE_ID_REQUIRED: "尚未配置 Stripe 月度会员 Price ID",
    ENV_STRIPE_YEARLY_PRICE_ID_REQUIRED: "尚未配置 Stripe 年度会员 Price ID",
    ENV_CREEM_API_KEY_REQUIRED: "尚未配置 Creem API Key",
    ENV_CREEM_MONTHLY_PRODUCT_ID_REQUIRED: "尚未配置 Creem 月度会员 Product ID",
    ENV_CREEM_YEARLY_PRODUCT_ID_REQUIRED: "尚未配置 Creem 年度会员 Product ID",
    ENV_PUBLIC_APP_URL_REQUIRED: "尚未配置线上网站地址",
  };
  return messages[code] ?? "暂时无法创建会员订阅";
}
