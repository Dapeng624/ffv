import { env } from "cloudflare:workers";
import { ensureCoreSchema } from "@/db";
import { grantCredits } from "@/lib/credits";
import { verifyStripeWebhook } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    await ensureCoreSchema();
    const event = await verifyStripeWebhook(request);
    if (event.type !== "checkout.session.completed") return Response.json({ received: true });

    const session = event.data.object;
    if (session.payment_status && session.payment_status !== "paid") return Response.json({ received: true });
    const order = await env.DB.prepare(
      "SELECT id, user_id, credits, status FROM payment_orders WHERE provider_session_id = ? LIMIT 1",
    )
      .bind(session.id)
      .first<{ id: string; user_id: string; credits: number; status: string }>();
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status === "paid") return Response.json({ received: true });

    await env.DB.prepare(
      `UPDATE payment_orders
       SET status = 'paid', provider_payment_intent_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status != 'paid'`,
    )
      .bind(typeof session.payment_intent === "string" ? session.payment_intent : null, order.id)
      .run();
    await grantCredits({
      userId: order.user_id,
      amount: order.credits,
      type: "purchase",
      referenceType: "payment_order",
      referenceId: order.id,
      note: `Stripe Checkout ${session.id}`,
    });
    return Response.json({ received: true });
  } catch (error) {
    return Response.json(
      { error: { code: error instanceof Error ? error.message : "WEBHOOK_FAILED", message: "Webhook 处理失败" } },
      { status: 400 },
    );
  }
}
