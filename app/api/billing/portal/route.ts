import { ensureCoreSchema } from "@/db";
import { requireUser } from "@/lib/auth";
import { createSubscriptionPortal } from "@/lib/billing";
import { getMembershipSummary, getProviderCustomerId } from "@/lib/membership";

export async function POST(request: Request) {
  try {
    await ensureCoreSchema();
    const user = await requireUser(request);
    const membership = await getMembershipSummary(user.id);
    if (!membership) throw new Error("SUBSCRIPTION_NOT_FOUND");
    const customerId = await getProviderCustomerId(user.id, membership.provider);
    if (!customerId) throw new Error("SUBSCRIPTION_NOT_FOUND");
    const session = await createSubscriptionPortal(membership.provider, customerId, new URL(request.url).origin);
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
