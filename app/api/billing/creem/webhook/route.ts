import { ensureCoreSchema } from "@/db";
import {
  creemEventTime,
  creemSubscriptionId,
  normalizeCreemSubscription,
  retrieveCreemSubscription,
  verifyCreemWebhook,
  type CreemCheckout,
  type CreemSubscription,
} from "@/lib/creem";
import {
  claimPaymentEvent,
  completeSubscriptionCheckout,
  expireSubscriptionCheckout,
  markPaymentEventFailed,
  markPaymentEventProcessed,
  reconcileSubscriptionCredits,
  reconcileSubscriptionCreditsByProviderId,
  upsertProviderSubscription,
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
        await syncSubscription(
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
      await syncSubscription(event.object as CreemSubscription, eventTime, event.eventType);
    }

    await markPaymentEventProcessed("creem", event.id);
    return Response.json({ received: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "WEBHOOK_FAILED";
    if (eventId) await markPaymentEventFailed("creem", eventId, code).catch(() => undefined);
    return Response.json({ error: { code, message: "Webhook 处理失败" } }, { status: 400 });
  }
}

async function syncSubscription(
  subscription: CreemSubscription,
  eventTime: Date,
  eventType: string,
  fallbackMetadata?: Record<string, unknown>,
) {
  await reconcileSubscriptionCreditsByProviderId("creem", subscription.id, eventTime);
  const normalized = await normalizeCreemSubscription(subscription, eventTime, eventType, fallbackMetadata);
  await upsertProviderSubscription(normalized);
  await reconcileSubscriptionCredits(normalized.userId, eventTime);
}

function isCompleteSubscription(value: CreemCheckout["subscription"]): value is CreemSubscription {
  return Boolean(
    value
    && typeof value === "object"
    && "id" in value
    && ("current_period_end_date" in value || "next_transaction_date" in value),
  );
}

function mergeCheckoutReferences(subscription: CreemSubscription, checkout: CreemCheckout): CreemSubscription {
  return {
    ...subscription,
    customer: subscription.customer ?? checkout.customer,
    product: subscription.product ?? checkout.product,
  };
}
