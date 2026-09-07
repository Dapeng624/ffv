import { ensureCoreSchema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getStripeCustomerId } from "@/lib/membership";
import { createStripePortalSession } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    await ensureCoreSchema();
    const user = await requireUser(request);
    const customerId = await getStripeCustomerId(user.id);
    if (!customerId) throw new Error("SUBSCRIPTION_NOT_FOUND");
    const session = await createStripePortalSession(customerId, new URL(request.url).origin);
    return Response.json({ url: session.url });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PORTAL_FAILED";
    const status = code === "AUTH_REQUIRED" ? 401 : code === "SUBSCRIPTION_NOT_FOUND" ? 404 : code.startsWith("ENV_") ? 503 : 500;
    const message = code === "AUTH_REQUIRED"
      ? "请先登录"
      : code === "SUBSCRIPTION_NOT_FOUND"
        ? "尚未找到会员订阅"
        : "暂时无法打开会员管理，请稍后重试";
    return Response.json({ error: { code, message } }, { status });
  }
}
