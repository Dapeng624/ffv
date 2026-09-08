import {
  getSubscriptionByProviderId,
  type ProviderSubscriptionInput,
  type SubscriptionStatus,
} from "@/lib/membership";
import { findMembershipPlan, isMembershipPlanId, type MembershipPlanId } from "@/lib/membership-plans";
import { requiredRuntimeEnv, runtimeEnv } from "@/lib/runtime-env";

type CreemReference = string | { id: string };

type CreemProduct = {
  id: string;
  billing_period?: string;
};

type CreemCustomer = {
  id: string;
  email?: string;
  name?: string;
};

export type CreemSubscription = {
  id: string;
  status?: string;
  product?: CreemReference | CreemProduct;
  customer?: CreemReference | CreemCustomer;
  current_period_start_date?: string;
  current_period_end_date?: string;
  last_transaction_date?: string;
  next_transaction_date?: string;
  canceled_at?: string | null;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
};

export type CreemCheckout = {
  id: string;
  checkout_url?: string;
  request_id?: string;
  status?: string;
  product?: CreemReference | CreemProduct;
  customer?: CreemReference | CreemCustomer;
  subscription?: CreemReference | CreemSubscription | null;
  metadata?: Record<string, unknown>;
};

export type CreemEvent = {
  id: string;
  eventType: string;
  created_at?: number | string;
  object: Record<string, unknown>;
};

export async function createCreemSubscriptionCheckout(input: {
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  origin: string;
  customerId?: string | null;
}) {
  const plan = findMembershipPlan(input.planId);
  if (!plan) throw new Error("PLAN_NOT_FOUND");
  const productId = requiredRuntimeEnv(plan.creemProductEnvName);
  const appUrl = requiredRuntimeEnv("PUBLIC_APP_URL") || input.origin;
  const requestId = crypto.randomUUID();
  const customer = input.customerId
    ? { id: input.customerId }
    : { email: input.userEmail, name: input.userName };
  const session = await creemRequest<CreemCheckout>("/v1/checkouts", {
    method: "POST",
    body: {
      product_id: productId,
      request_id: requestId,
      units: 1,
      customer,
      success_url: `${appUrl.replace(/\/$/, "")}/account?checkout=success&provider=creem`,
      metadata: { userId: input.userId, planId: plan.id },
    },
  });
  if (!session.id || !session.checkout_url) throw new Error("CREEM_CHECKOUT_FAILED");
  return { session, plan };
}

export async function createCreemPortalSession(customerId: string) {
  const session = await creemRequest<{ customer_portal_link?: string }>("/v1/customers/billing", {
    method: "POST",
    body: { customer_id: customerId },
  });
  if (!session.customer_portal_link) throw new Error("CREEM_PORTAL_FAILED");
  return { url: session.customer_portal_link };
}

export function retrieveCreemSubscription(subscriptionId: string) {
  return creemRequest<CreemSubscription>(
    `/v1/subscriptions?subscription_id=${encodeURIComponent(subscriptionId)}`,
    { method: "GET" },
  );
}

export function retrieveCreemCheckout(checkoutId: string) {
  return creemRequest<CreemCheckout>(
    `/v1/checkouts?checkout_id=${encodeURIComponent(checkoutId)}`,
    { method: "GET" },
  );
}

export async function normalizeCreemSubscription(
  subscription: CreemSubscription,
  eventTime: Date,
  eventType: string,
  fallbackMetadata?: Record<string, unknown>,
): Promise<ProviderSubscriptionInput> {
  const existing = await getSubscriptionByProviderId("creem", subscription.id);
  const metadata = { ...(fallbackMetadata ?? {}), ...(subscription.metadata ?? {}) };
  const productId = referenceId(subscription.product);
  const planId = resolvePlanId(metadataValue(metadata, "planId", "plan_id"), productId, existing?.plan_id);
  const userId = metadataValue(metadata, "userId", "user_id") || existing?.user_id;
  const customerId = referenceId(subscription.customer) || existing?.provider_customer_id;
  const currentPeriodStart = subscription.current_period_start_date
    ?? subscription.last_transaction_date
    ?? subscription.created_at
    ?? existing?.current_period_start;
  const currentPeriodEnd = subscription.current_period_end_date
    ?? subscription.next_transaction_date
    ?? existing?.current_period_end;
  const startedAt = subscription.created_at ?? existing?.started_at ?? currentPeriodStart;
  const { status, cancelAtPeriodEnd } = normalizeStatus(subscription.status, eventType);

  if (!userId) throw new Error("SUBSCRIPTION_USER_MISSING");
  if (!customerId) throw new Error("SUBSCRIPTION_CUSTOMER_MISSING");
  if (!planId) throw new Error("SUBSCRIPTION_PLAN_MISSING");
  if (!currentPeriodStart || !currentPeriodEnd || !startedAt) throw new Error("SUBSCRIPTION_PERIOD_MISSING");

  return {
    provider: "creem",
    userId,
    providerSubscriptionId: subscription.id,
    providerCustomerId: customerId,
    planId,
    status,
    cancelAtPeriodEnd,
    startedAt: toIso(startedAt),
    currentPeriodStart: toIso(currentPeriodStart),
    currentPeriodEnd: toIso(currentPeriodEnd),
    providerEventCreatedAt: eventTime.toISOString(),
    endedAt: subscription.canceled_at ? toIso(subscription.canceled_at) : null,
  };
}

export function creemSubscriptionId(value: unknown) {
  return referenceId(value);
}

export function creemEventTime(value: number | string | undefined) {
  if (typeof value === "number") {
    const milliseconds = value < 10_000_000_000 ? value * 1000 : value;
    const date = new Date(milliseconds);
    return Number.isFinite(date.getTime()) ? date : new Date();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date;
  }
  return new Date();
}

export async function verifyCreemWebhook(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("creem-signature");
  if (!signature) throw new Error("CREEM_SIGNATURE_MISSING");
  const expected = await hmacSha256Hex(requiredRuntimeEnv("CREEM_WEBHOOK_SECRET"), payload);
  if (!timingSafeEqualHex(signature.toLowerCase(), expected)) throw new Error("CREEM_SIGNATURE_INVALID");
  const event = JSON.parse(payload) as CreemEvent;
  if (!event.id || !event.eventType || !event.object) throw new Error("CREEM_EVENT_INVALID");
  return event;
}

async function creemRequest<T>(path: string, init: { method: "GET" | "POST"; body?: Record<string, unknown> }) {
  const response = await fetch(`${creemApiBaseUrl()}${path}`, {
    method: init.method,
    headers: {
      "x-api-key": requiredRuntimeEnv("CREEM_API_KEY"),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const payload = (await response.json()) as T & {
    error?: string | { code?: string; message?: string };
    message?: string;
  };
  if (!response.ok) {
    const error = typeof payload.error === "string"
      ? payload.error
      : payload.error?.code ?? payload.error?.message ?? payload.message;
    throw new Error(error || "CREEM_REQUEST_FAILED");
  }
  return payload;
}

function creemApiBaseUrl() {
  const testMode = runtimeEnv("CREEM_TEST_MODE")?.toLowerCase();
  return testMode === "true" || testMode === "1"
    ? "https://test-api.creem.io"
    : "https://api.creem.io";
}

function resolvePlanId(metadataPlanId?: string, productId?: string | null, existingPlanId?: MembershipPlanId) {
  if (productId && productId === runtimeEnv("CREEM_MONTHLY_PRODUCT_ID")) return "monthly";
  if (productId && productId === runtimeEnv("CREEM_YEARLY_PRODUCT_ID")) return "yearly";
  if (metadataPlanId && isMembershipPlanId(metadataPlanId)) return metadataPlanId;
  return existingPlanId ?? null;
}

function normalizeStatus(value: string | undefined, eventType: string): {
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
} {
  if (eventType === "subscription.scheduled_cancel" || value === "scheduled_cancel") {
    return { status: "active", cancelAtPeriodEnd: true };
  }
  if (eventType === "subscription.canceled" || value === "cancelled") {
    return { status: "canceled", cancelAtPeriodEnd: false };
  }
  if (eventType === "subscription.past_due") return { status: "past_due", cancelAtPeriodEnd: false };
  if (eventType === "subscription.unpaid" || eventType === "subscription.expired") {
    return { status: "unpaid", cancelAtPeriodEnd: false };
  }
  const status = value === "scheduled_cancel" ? "active" : value;
  if (["incomplete", "incomplete_expired", "trialing", "active", "past_due", "canceled", "unpaid", "paused"].includes(status ?? "")) {
    return { status: status as SubscriptionStatus, cancelAtPeriodEnd: false };
  }
  if (eventType === "subscription.active" || eventType === "subscription.paid") {
    return { status: "active", cancelAtPeriodEnd: false };
  }
  throw new Error("SUBSCRIPTION_STATUS_INVALID");
}

function metadataValue(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (typeof metadata[key] === "string" && metadata[key]) return metadata[key];
  }
  return undefined;
}

function referenceId(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
  return null;
}

function toIso(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("SUBSCRIPTION_DATE_INVALID");
  return date.toISOString();
}

async function hmacSha256Hex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}
