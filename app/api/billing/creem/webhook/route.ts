import { ensureCoreSchema } from "@/db";
import {
  creemEventTime,
  creemSubscriptionId,
  retrieveCreemSubscription,
  verifyCreemWebhook,
  type CreemCheckout,
  type CreemSubscription,
} from "@/lib/creem";
import {
  isCompleteSubscription,
  mergeCheckoutReferences,
  syncCreemSubscription,
} from "@/lib/creem-reconciliation";
import {
  claimPaymentEvent,
  completeSubscriptionCheckout,
  expireSubscriptionCheckout,
  markPaymentEventFailed,
  markPaymentEventProcessed,
} from "@/lib/membership";

export async function POST(request: Request) {
  let eventId = "";
  try {
    await ensureCoreSchema();
    const event = await verifyCreemWebhook(request);
    eventId = event.id;
    if (!(await claimPaymentEvent("creem", event.id, event.eventType))) {
      return Response.json({ received: true });
    }

    const eventTime = creemEventTime(event.created_at);
    if (event.eventType === "checkout.completed") {
      const checkout = event.object as CreemCheckout;
      const subscriptionId = creemSubscriptionId(checkout.subscription);
      if (subscriptionId) {
        const subscription = isCompleteSubscription(checkout.subscription)
          ? checkout.subscription
          : await retrieveCreemSubscription(subscriptionId);
        await syncCreemSubscription(
          mergeCheckoutReferences(subscription, checkout),
          eventTime,
          event.eventType,
          checkout.metadata,
        );
      }
      await completeSubscriptionCheckout("creem", checkout.id);
    } else if (event.eventType === "checkout.expired") {
      await expireSubscriptionCheckout("creem", String(event.object.id ?? ""));
    } else if (event.eventType.startsWith("subscription.")) {
      await syncCreemSubscription(event.object as CreemSubscription, eventTime, event.eventType);
    }

    await markPaymentEventProcessed("creem", event.id);
    return Response.json({ received: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "WEBHOOK_FAILED";
    if (eventId) await markPaymentEventFailed("creem", eventId, code).catch(() => undefined);
    return Response.json({ error: { code, message: "Webhook 处理失败" } }, { status: 400 });
  }
}
