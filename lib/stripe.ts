import {
  getSubscriptionByProviderId,
  isSubscriptionStatus,
  type StripeSubscriptionInput,
} from "@/lib/membership";
import { findMembershipPlan, isMembershipPlanId, type MembershipPlanId } from "@/lib/membership-plans";
import { requiredRuntimeEnv, runtimeEnv } from "@/lib/runtime-env";

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  mode?: string;
  payment_status?: string;
  payment_intent?: string | { id: string } | null;
  subscription?: string | { id: string } | null;
  customer?: string | { id: string } | null;
  metadata?: Record<string, string>;
};

export type StripeSubscription = {
  id: string;
  customer: string | { id: string };
  status: string;
  cancel_at_period_end?: boolean;
  created?: number;
  start_date?: number;
  current_period_start?: number;
  current_period_end?: number;
  canceled_at?: number | null;
  ended_at?: number | null;
  metadata?: Record<string, string>;
  items?: {
    data?: Array<{
      current_period_start?: number;
      current_period_end?: number;
      price?: { id?: string; recurring?: { interval?: string } };
    }>;
  };
};

export type StripeEvent = {
  id: string;
  type: string;
  created?: number;
  data: { object: Record<string, unknown> };
};

export async function createStripeSubscriptionCheckout(input: {
  userId: string;
  userEmail: string;
  planId: string;
  origin: string;
  customerId?: string | null;
}) {
  const plan = findMembershipPlan(input.planId);
  if (!plan) throw new Error("PLAN_NOT_FOUND");
  const priceId = requiredRuntimeEnv(plan.priceEnvName);
  const appUrl = requiredRuntimeEnv("PUBLIC_APP_URL") || input.origin;
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("success_url", `${appUrl.replace(/\/$/, "")}/account?checkout=success`);
  body.set("cancel_url", `${appUrl.replace(/\/$/, "")}/pricing?checkout=cancelled`);
  body.set("client_reference_id", input.userId);
  body.set("metadata[userId]", input.userId);
  body.set("metadata[planId]", plan.id);
  body.set("subscription_data[metadata][userId]", input.userId);
  body.set("subscription_data[metadata][planId]", plan.id);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price]", priceId);
  body.set("billing_address_collection", "auto");
  body.set("locale", "auto");
  if (input.customerId) body.set("customer", input.customerId);
  else body.set("customer_email", input.userEmail);

  const session = await stripeRequest<StripeCheckoutSession>("/v1/checkout/sessions", { method: "POST", body });
  if (!session.id || !session.url) throw new Error("STRIPE_CHECKOUT_FAILED");
  return { session, plan };
}

export async function createStripePortalSession(customerId: string, origin: string) {
  const appUrl = requiredRuntimeEnv("PUBLIC_APP_URL") || origin;
  const body = new URLSearchParams();
  body.set("customer", customerId);
  body.set("return_url", `${appUrl.replace(/\/$/, "")}/account`);
  const session = await stripeRequest<{ id: string; url: string }>("/v1/billing_portal/sessions", { method: "POST", body });
  if (!session.url) throw new Error("STRIPE_PORTAL_FAILED");
  return session;
}

export function retrieveStripeSubscription(subscriptionId: string) {
  return stripeRequest<StripeSubscription>(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: "GET" });
}

export async function normalizeStripeSubscription(subscription: StripeSubscription, eventTime: Date): Promise<StripeSubscriptionInput> {
  const existing = await getSubscriptionByProviderId(subscription.id);
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.id;
  const metadata = subscription.metadata ?? {};
  const planId = resolvePlanId(metadata.planId, priceId, existing?.plan_id);
  const userId = metadata.userId || existing?.user_id;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  const status = subscription.status;
  const currentPeriodStart = subscription.current_period_start ?? item?.current_period_start ?? subscription.start_date;
  const currentPeriodEnd = subscription.current_period_end ?? item?.current_period_end;
  const startedAt = subscription.start_date ?? subscription.created ?? currentPeriodStart;

  if (!userId) throw new Error("SUBSCRIPTION_USER_MISSING");
  if (!customerId) throw new Error("SUBSCRIPTION_CUSTOMER_MISSING");
  if (!planId) throw new Error("SUBSCRIPTION_PLAN_MISSING");
  if (!isSubscriptionStatus(status)) throw new Error("SUBSCRIPTION_STATUS_INVALID");
  if (!currentPeriodStart || !currentPeriodEnd || !startedAt) throw new Error("SUBSCRIPTION_PERIOD_MISSING");

  return {
    userId,
    providerSubscriptionId: subscription.id,
    providerCustomerId: customerId,
    planId,
    status,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    startedAt: unixToIso(startedAt),
    currentPeriodStart: unixToIso(currentPeriodStart),
    currentPeriodEnd: unixToIso(currentPeriodEnd),
    providerEventCreatedAt: eventTime.toISOString(),
    endedAt: subscription.ended_at || subscription.canceled_at
      ? unixToIso(subscription.ended_at ?? subscription.canceled_at ?? 0)
      : null,
  };
}

export function stripeSubscriptionId(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
  return null;
}

export function subscriptionIdFromInvoice(invoice: Record<string, unknown>) {
  const direct = stripeSubscriptionId(invoice.subscription);
  if (direct) return direct;
  const parent = asRecord(invoice.parent);
  const details = asRecord(parent?.subscription_details);
  return stripeSubscriptionId(details?.subscription);
}

export async function verifyStripeWebhook(request: Request) {
  const payload = await request.text();
  const header = request.headers.get("stripe-signature");
  const secret = requiredRuntimeEnv("STRIPE_WEBHOOK_SECRET");
  if (!header) throw new Error("STRIPE_SIGNATURE_MISSING");

  const timestamp = header.match(/(?:^|,)t=([^,]+)/)?.[1];
  const signature = header.match(/(?:^|,)v1=([^,]+)/)?.[1];
  if (!timestamp || !signature) throw new Error("STRIPE_SIGNATURE_INVALID");
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) throw new Error("STRIPE_SIGNATURE_EXPIRED");

  const expected = await hmacSha256Hex(secret, `${timestamp}.${payload}`);
  if (!timingSafeEqualHex(signature, expected)) throw new Error("STRIPE_SIGNATURE_INVALID");
  return JSON.parse(payload) as StripeEvent;
}

async function stripeRequest<T>(path: string, init: { method: "GET" | "POST"; body?: URLSearchParams }) {
  const secretKey = requiredRuntimeEnv("STRIPE_SECRET_KEY");
  const response = await fetch(`https://api.stripe.com${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(init.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: init.body,
  });
  const payload = (await response.json()) as T & { error?: { message?: string; code?: string } };
  if (!response.ok) throw new Error(payload.error?.code ?? payload.error?.message ?? "STRIPE_REQUEST_FAILED");
  return payload;
}

function resolvePlanId(metadataPlanId?: string, priceId?: string, existingPlanId?: MembershipPlanId) {
  if (priceId && priceId === runtimeEnv("STRIPE_MONTHLY_PRICE_ID")) return "monthly";
  if (priceId && priceId === runtimeEnv("STRIPE_YEARLY_PRICE_ID")) return "yearly";
  if (metadataPlanId && isMembershipPlanId(metadataPlanId)) return metadataPlanId;
  return existingPlanId ?? null;
}

function unixToIso(seconds: number) {
  const date = new Date(seconds * 1000);
  if (!Number.isFinite(date.getTime())) throw new Error("SUBSCRIPTION_DATE_INVALID");
  return date.toISOString();
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

async function hmacSha256Hex(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}
