import {
  creemSubscriptionId,
  normalizeCreemSubscription,
  retrieveCreemCheckout,
  retrieveCreemSubscription,
  type CreemCheckout,
  type CreemSubscription,
} from "@/lib/creem";
import {
  completeSubscriptionCheckout,
  reconcileSubscriptionCredits,
  reconcileSubscriptionCreditsByProviderId,
  upsertProviderSubscription,
} from "@/lib/membership";

export async function reconcileCreemCheckout(checkoutId: string, userId: string) {
  const checkout = await retrieveCreemCheckout(checkoutId);
  if (checkout.status !== "completed") throw new Error("CREEM_CHECKOUT_NOT_COMPLETED");
  if (checkout.metadata?.userId !== userId) throw new Error("CREEM_CHECKOUT_USER_MISMATCH");

  const subscriptionId = creemSubscriptionId(checkout.subscription);
  if (!subscriptionId) throw new Error("CREEM_SUBSCRIPTION_MISSING");
  const subscription = isCompleteSubscription(checkout.subscription)
    ? checkout.subscription
    : await retrieveCreemSubscription(subscriptionId);

  const granted = await syncCreemSubscription(
    mergeCheckoutReferences(subscription, checkout),
    new Date(),
    "checkout.completed",
    checkout.metadata,
  );
  await completeSubscriptionCheckout("creem", checkout.id);
  return { checkoutId: checkout.id, subscriptionId, granted };
}

export async function syncCreemSubscription(
  subscription: CreemSubscription,
  eventTime: Date,
  eventType: string,
  fallbackMetadata?: Record<string, unknown>,
) {
  await reconcileSubscriptionCreditsByProviderId("creem", subscription.id, eventTime);
  const normalized = await normalizeCreemSubscription(subscription, eventTime, eventType, fallbackMetadata);
  await upsertProviderSubscription(normalized);
  return reconcileSubscriptionCredits(normalized.userId, eventTime);
}

export function isCompleteSubscription(value: CreemCheckout["subscription"]): value is CreemSubscription {
  return Boolean(
    value
    && typeof value === "object"
    && "id" in value
    && ("current_period_end_date" in value || "next_transaction_date" in value),
  );
}

export function mergeCheckoutReferences(subscription: CreemSubscription, checkout: CreemCheckout): CreemSubscription {
  return {
    ...subscription,
    customer: subscription.customer ?? checkout.customer,
    product: subscription.product ?? checkout.product,
  };
}
