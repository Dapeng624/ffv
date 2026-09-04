import { env } from "cloudflare:workers";
import { findCreditPackage } from "@/lib/credits";
import { requiredRuntimeEnv } from "@/lib/runtime-env";

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  payment_status?: string;
  payment_intent?: string;
  metadata?: Record<string, string>;
};

export async function createStripeCheckoutSession(input: { userId: string; packageId: string; origin: string }) {
  const selectedPackage = findCreditPackage(input.packageId);
  if (!selectedPackage) throw new Error("PACKAGE_NOT_FOUND");
  const appUrl = requiredRuntimeEnv("PUBLIC_APP_URL") || input.origin;
  const secretKey = requiredRuntimeEnv("STRIPE_SECRET_KEY");
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${appUrl.replace(/\/$/, "")}/account?checkout=success`);
  body.set("cancel_url", `${appUrl.replace(/\/$/, "")}/pricing?checkout=cancelled`);
  body.set("client_reference_id", input.userId);
  body.set("metadata[userId]", input.userId);
  body.set("metadata[packageId]", selectedPackage.id);
  body.set("metadata[credits]", String(selectedPackage.credits));
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", selectedPackage.currency);
  body.set("line_items[0][price_data][unit_amount]", String(selectedPackage.amount));
  body.set("line_items[0][price_data][product_data][name]", `映作 ${selectedPackage.name}`);
  body.set("line_items[0][price_data][product_data][description]", `${selectedPackage.credits} 积分，${selectedPackage.description}`);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = (await response.json()) as StripeCheckoutSession & { error?: { message?: string; code?: string } };
  if (!response.ok || !payload.id) throw new Error(payload.error?.code ?? payload.error?.message ?? "STRIPE_CHECKOUT_FAILED");
  return { session: payload, selectedPackage };
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
  return JSON.parse(payload) as {
    id: string;
    type: string;
    data: { object: StripeCheckoutSession };
  };
}

export async function recordPendingOrder(input: {
  userId: string;
  sessionId: string;
  packageId: string;
  credits: number;
  amount: number;
  currency: string;
}) {
  await env.DB.prepare(
    `INSERT INTO payment_orders
      (id, user_id, provider_session_id, package_id, credits, amount, currency, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
  )
    .bind(crypto.randomUUID(), input.userId, input.sessionId, input.packageId, input.credits, input.amount, input.currency)
    .run();
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
