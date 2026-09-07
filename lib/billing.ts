import { createCreemPortalSession, createCreemSubscriptionCheckout } from "@/lib/creem";
import type { PaymentProvider } from "@/lib/payment-providers";
import { createStripePortalSession, createStripeSubscriptionCheckout } from "@/lib/stripe";

type CheckoutInput = {
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  origin: string;
  customerId?: string | null;
};

export async function createSubscriptionCheckout(provider: PaymentProvider, input: CheckoutInput) {
  if (provider === "creem") {
    const { session, plan } = await createCreemSubscriptionCheckout(input);
    return { sessionId: session.id, url: session.checkout_url!, plan };
  }
  const { session, plan } = await createStripeSubscriptionCheckout(input);
  return { sessionId: session.id, url: session.url!, plan };
}

export async function createSubscriptionPortal(provider: PaymentProvider, customerId: string, origin: string) {
  if (provider === "creem") return createCreemPortalSession(customerId);
  return createStripePortalSession(customerId, origin);
}
