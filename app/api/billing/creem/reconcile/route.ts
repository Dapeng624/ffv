import { ensureCoreSchema } from "@/db";
import { requireUser } from "@/lib/auth";
import { reconcileCreemCheckout } from "@/lib/creem-reconciliation";

export async function POST(request: Request) {
  try {
    await ensureCoreSchema();
    const user = await requireUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const checkoutId = typeof body.checkoutId === "string" ? body.checkoutId.trim() : "";
    if (!checkoutId.startsWith("ch_")) throw new Error("CREEM_CHECKOUT_ID_INVALID");

    const result = await reconcileCreemCheckout(checkoutId, user.id);
    return Response.json({ reconciled: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CREEM_RECONCILIATION_FAILED";
    const status = code === "AUTH_REQUIRED"
      ? 401
      : code === "CREEM_CHECKOUT_USER_MISMATCH"
        ? 403
        : code === "CREEM_CHECKOUT_ID_INVALID" || code === "CREEM_CHECKOUT_NOT_COMPLETED"
          ? 400
          : 502;
    return Response.json({ error: { code, message: friendlyMessage(code) } }, { status });
  }
}

function friendlyMessage(code: string) {
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "登录状态已失效，请重新登录后再同步会员",
    CREEM_CHECKOUT_ID_INVALID: "Creem 订单编号无效",
    CREEM_CHECKOUT_NOT_COMPLETED: "Creem 尚未确认付款完成",
    CREEM_CHECKOUT_USER_MISMATCH: "该订单不属于当前登录账户",
    CREEM_SUBSCRIPTION_MISSING: "Creem 订单尚未生成订阅",
  };
  return messages[code] ?? "会员同步失败，请稍后重试";
}
