import { ensureCoreSchema } from "@/db";
import {
  claimStripeEvent,
  completeSubscriptionCheckout,
  expireSubscriptionCheckout,
  markStripeEventFailed,
  markStripeEventProcessed,
  reconcileSubscriptionCredits,
  reconcileSubscriptionCreditsByProviderId,
  upsertStripeSubscription,
} from "@/lib/membership";
import {
  normalizeStripeSubscription,
  retrieveStripeSubscription,
  stripeSubscriptionId,
  subscriptionIdFromInvoice,
  verifyStripeWebhook,
  type StripeCheckoutSession,
  type StripeSubscription,
} from "@/lib/stripe";

export async function POST(request: Request) {
  let eventId = "";
  try {
    await ensureCoreSchema();
    const event = await verifyStripeWebhook(request);
    eventId = event.id;
    if (!(await claimStripeEvent(event.id, event.type))) return Response.json({ received: true });

    const eventTime = event.created ? new Date(event.created * 1000) : new Date();
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as StripeCheckoutSession;
      const subscriptionId = stripeSubscriptionId(session.subscription);
      if (session.mode === "subscription" && subscriptionId) {
        await syncSubscription(await retrieveStripeSubscription(subscriptionId), eventTime);
        await completeSubscriptionCheckout(session.id);
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as StripeCheckoutSession;
      await expireSubscriptionCheckout(session.id);
    } else if (event.type.startsWith("customer.subscription.")) {
      await syncSubscription(event.data.object as unknown as StripeSubscription, eventTime);
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const subscriptionId = subscriptionIdFromInvoice(event.data.object);
      if (subscriptionId) await syncSubscription(await retrieveStripeSubscription(subscriptionId), eventTime);
    }

    await markStripeEventProcessed(event.id);
    return Response.json({ received: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "WEBHOOK_FAILED";
    if (eventId) await markStripeEventFailed(eventId, code).catch(() => undefined);
    return Response.json({ error: { code, message: "Webhook 处理失败" } }, { status: 400 });
  }
}

async function syncSubscription(subscription: StripeSubscription, eventTime: Date) {
  await reconcileSubscriptionCreditsByProviderId(subscription.id, eventTime);
  const normalized = await normalizeStripeSubscription(subscription, eventTime);
  await upsertStripeSubscription(normalized);
  await reconcileSubscriptionCredits(normalized.userId, eventTime);
}
