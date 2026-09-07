import { env } from "cloudflare:workers";
import {
  MEMBERSHIP_CREDITS_PER_MONTH,
  findMembershipPlan,
  type MembershipPlanId,
} from "@/lib/membership-plans";
import type { PaymentProvider } from "@/lib/payment-providers";

export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export type ProviderSubscriptionInput = {
  provider: PaymentProvider;
  userId: string;
  providerSubscriptionId: string;
  providerCustomerId: string;
  planId: MembershipPlanId;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  providerEventCreatedAt: string;
  endedAt?: string | null;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  provider: PaymentProvider;
  provider_subscription_id: string;
  provider_customer_id: string;
  plan_id: MembershipPlanId;
  status: SubscriptionStatus;
  cancel_at_period_end: number;
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  next_credit_grant_at: string;
  credits_granted_periods: number;
  ended_at: string | null;
  provider_event_created_at: string;
  updated_at: string;
};

const CREDITS_PER_MONTH = MEMBERSHIP_CREDITS_PER_MONTH;
const ACTIVE_STATUSES = new Set<SubscriptionStatus>(["active", "trialing"]);

export function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return ["incomplete", "incomplete_expired", "trialing", "active", "past_due", "canceled", "unpaid", "paused"].includes(value);
}

export async function recordSubscriptionCheckout(input: {
  provider: PaymentProvider;
  userId: string;
  sessionId: string;
  planId: MembershipPlanId;
}) {
  await env.DB.prepare(
    `INSERT INTO subscription_checkouts (id, user_id, provider, provider_session_id, plan_id)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(crypto.randomUUID(), input.userId, input.provider, input.sessionId, input.planId)
    .run();
}

export async function completeSubscriptionCheckout(provider: PaymentProvider, sessionId: string) {
  await env.DB.prepare(
    `UPDATE subscription_checkouts SET status = 'completed', updated_at = CURRENT_TIMESTAMP
     WHERE provider = ? AND provider_session_id = ?`,
  )
    .bind(provider, sessionId)
    .run();
}

export async function expireSubscriptionCheckout(provider: PaymentProvider, sessionId: string) {
  await env.DB.prepare(
    `UPDATE subscription_checkouts SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE provider = ? AND provider_session_id = ?`,
  )
    .bind(provider, sessionId)
    .run();
}

export async function getProviderCustomerId(userId: string, provider: PaymentProvider) {
  const row = await env.DB.prepare(
    `SELECT provider_customer_id FROM subscriptions
     WHERE user_id = ? AND provider = ? ORDER BY updated_at DESC LIMIT 1`,
  )
    .bind(userId, provider)
    .first<{ provider_customer_id: string }>();
  return row?.provider_customer_id ?? null;
}

export async function getSubscriptionByProviderId(provider: PaymentProvider, providerSubscriptionId: string) {
  return env.DB.prepare(
    "SELECT * FROM subscriptions WHERE provider = ? AND provider_subscription_id = ? LIMIT 1",
  )
    .bind(provider, providerSubscriptionId)
    .first<SubscriptionRow>();
}

export async function hasManageableSubscription(userId: string) {
  const row = await env.DB.prepare(
    `SELECT id FROM (
       SELECT id, updated_at FROM subscriptions
       WHERE user_id = ? AND status IN ('incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'paused')
       UNION ALL
       SELECT id, updated_at FROM subscription_checkouts
       WHERE user_id = ? AND status = 'pending' AND created_at >= datetime('now', '-30 minutes')
     ) ORDER BY updated_at DESC LIMIT 1`,
  )
    .bind(userId, userId)
    .first<{ id: string }>();
  return Boolean(row);
}

export async function upsertProviderSubscription(input: ProviderSubscriptionInput) {
  const existing = await getSubscriptionByProviderId(input.provider, input.providerSubscriptionId);
  const id = existing?.id ?? crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO subscriptions
      (id, user_id, provider, provider_subscription_id, provider_customer_id, plan_id, status,
       cancel_at_period_end, started_at, current_period_start, current_period_end,
       next_credit_grant_at, credits_granted_periods, ended_at, provider_event_created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
     ON CONFLICT(provider_subscription_id) DO UPDATE SET
       user_id = excluded.user_id,
       provider = excluded.provider,
       provider_customer_id = excluded.provider_customer_id,
       plan_id = excluded.plan_id,
       status = excluded.status,
       cancel_at_period_end = excluded.cancel_at_period_end,
       current_period_start = excluded.current_period_start,
       current_period_end = excluded.current_period_end,
       ended_at = excluded.ended_at,
       provider_event_created_at = excluded.provider_event_created_at,
       updated_at = CURRENT_TIMESTAMP
     WHERE excluded.provider_event_created_at >= subscriptions.provider_event_created_at`,
    )
    .bind(
      id,
      input.userId,
      input.provider,
      input.providerSubscriptionId,
      input.providerCustomerId,
      input.planId,
      input.status,
      input.cancelAtPeriodEnd ? 1 : 0,
      input.startedAt,
      input.currentPeriodStart,
      input.currentPeriodEnd,
      input.startedAt,
      input.endedAt ?? null,
      input.providerEventCreatedAt,
    )
    .run();
  return id;
}

export async function reconcileSubscriptionCredits(userId: string, now = new Date()) {
  const subscriptions = await env.DB.prepare(
    `SELECT * FROM subscriptions
     WHERE user_id = ? AND status IN ('active', 'trialing')
     ORDER BY updated_at DESC`,
  )
    .bind(userId)
    .all<SubscriptionRow>();

  let granted = 0;
  for (const subscription of subscriptions.results) {
    granted += await reconcileOneSubscription(subscription, now);
  }
  return granted;
}

export async function reconcileAllDueSubscriptionCredits(now = new Date()) {
  const dueUsers = await env.DB.prepare(
    `SELECT DISTINCT user_id FROM subscriptions
     WHERE status IN ('active', 'trialing')
       AND next_credit_grant_at <= ?
       AND next_credit_grant_at < current_period_end
     LIMIT 500`,
  )
    .bind(now.toISOString())
    .all<{ user_id: string }>();
  let granted = 0;
  for (const row of dueUsers.results) {
    try {
      granted += await reconcileSubscriptionCredits(row.user_id, now);
    } catch (error) {
      console.error("Subscription credit reconciliation failed", row.user_id, error);
    }
  }
  return granted;
}

export async function reconcileSubscriptionCreditsByProviderId(
  provider: PaymentProvider,
  providerSubscriptionId: string,
  now = new Date(),
) {
  const subscription = await getSubscriptionByProviderId(provider, providerSubscriptionId);
  if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) return 0;
  return reconcileOneSubscription(subscription, now);
}

async function reconcileOneSubscription(initial: SubscriptionRow, now: Date) {
  let granted = 0;
  for (let guard = 0; guard < 24; guard += 1) {
    const subscription = guard === 0
      ? initial
      : await getSubscriptionByProviderId(initial.provider, initial.provider_subscription_id);
    if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) break;

    const dueAt = new Date(subscription.next_credit_grant_at);
    const periodEnd = new Date(subscription.current_period_end);
    if (!isValidDate(dueAt) || !isValidDate(periodEnd) || dueAt > now || dueAt >= periodEnd) break;

    const installmentNumber = subscription.credits_granted_periods + 1;
    const nextGrantAt = addCalendarMonths(new Date(subscription.started_at), installmentNumber).toISOString();
    const periodKey = dueAt.toISOString();
    const grantId = `${subscription.id}:${installmentNumber}`;
    try {
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO subscription_credit_grants
            (id, subscription_id, user_id, period_key, installment_number, credits)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(grantId, subscription.id, subscription.user_id, periodKey, installmentNumber, CREDITS_PER_MONTH),
        env.DB.prepare(
          "UPDATE users SET credit_balance = credit_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        ).bind(CREDITS_PER_MONTH, subscription.user_id),
        env.DB.prepare(
          `INSERT INTO credit_transactions
            (id, user_id, amount, balance_after, type, reference_type, reference_id, note)
           SELECT ?, id, ?, credit_balance, 'subscription_grant', 'subscription_period', ?, ?
           FROM users WHERE id = ?`,
        ).bind(
          `credit:${grantId}`,
          CREDITS_PER_MONTH,
          grantId,
          `${findMembershipPlan(subscription.plan_id)?.name ?? "会员"}第 ${installmentNumber} 期积分`,
          subscription.user_id,
        ),
        env.DB.prepare(
          `UPDATE subscriptions
           SET next_credit_grant_at = ?, credits_granted_periods = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND next_credit_grant_at = ?`,
        ).bind(nextGrantAt, installmentNumber, subscription.id, subscription.next_credit_grant_at),
      ]);
      granted += CREDITS_PER_MONTH;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      const existing = await env.DB.prepare(
        `SELECT installment_number FROM subscription_credit_grants
         WHERE subscription_id = ? AND period_key = ? LIMIT 1`,
      )
        .bind(subscription.id, periodKey)
        .first<{ installment_number: number }>();
      if (!existing) throw error;
      await env.DB.prepare(
        `UPDATE subscriptions
         SET credits_granted_periods = MAX(credits_granted_periods, ?), next_credit_grant_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
        .bind(existing.installment_number, addCalendarMonths(new Date(subscription.started_at), existing.installment_number).toISOString(), subscription.id)
        .run();
    }
  }
  return granted;
}

export async function getMembershipSummary(userId: string) {
  const row = await env.DB.prepare(
    `SELECT * FROM subscriptions WHERE user_id = ?
     ORDER BY CASE status
       WHEN 'active' THEN 0 WHEN 'trialing' THEN 1 WHEN 'past_due' THEN 2
       WHEN 'unpaid' THEN 3 WHEN 'paused' THEN 4 ELSE 5 END,
       updated_at DESC LIMIT 1`,
  )
    .bind(userId)
    .first<SubscriptionRow>();
  if (!row) return null;
  const plan = findMembershipPlan(row.plan_id);
  return {
    id: row.id,
    provider: row.provider,
    planId: row.plan_id,
    planName: plan?.name ?? row.plan_id,
    status: row.status,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    nextCreditGrantAt: row.next_credit_grant_at,
    creditsPerMonth: plan?.creditsPerMonth ?? CREDITS_PER_MONTH,
    creditsPerYear: plan?.creditsPerYear ?? CREDITS_PER_MONTH * 12,
  };
}

export async function claimPaymentEvent(provider: PaymentProvider, eventId: string, eventType: string) {
  const id = `${provider}:${eventId}`;
  await env.DB.prepare(
    `INSERT OR IGNORE INTO payment_webhook_events
      (id, provider, provider_event_id, event_type, status)
     VALUES (?, ?, ?, ?, 'pending')`,
  )
    .bind(id, provider, eventId, eventType)
    .run();
  const claimed = await env.DB.prepare(
    `UPDATE payment_webhook_events
     SET status = 'processing', attempts = attempts + 1, last_error = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND (
       status IN ('pending', 'failed') OR
       (status = 'processing' AND updated_at < datetime('now', '-10 minutes'))
     )
     RETURNING provider_event_id`,
  )
    .bind(id)
    .first<{ provider_event_id: string }>();
  return Boolean(claimed);
}

export async function markPaymentEventProcessed(provider: PaymentProvider, eventId: string) {
  await env.DB.prepare(
    "UPDATE payment_webhook_events SET status = 'processed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  )
    .bind(`${provider}:${eventId}`)
    .run();
}

export async function markPaymentEventFailed(provider: PaymentProvider, eventId: string, error: string) {
  await env.DB.prepare(
    `UPDATE payment_webhook_events
     SET status = 'failed', last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  )
    .bind(error.slice(0, 500), `${provider}:${eventId}`)
    .run();
}

function addCalendarMonths(anchor: Date, months: number) {
  if (!isValidDate(anchor)) throw new Error("SUBSCRIPTION_DATE_INVALID");
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth() + months;
  const day = anchor.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(
    year,
    month,
    Math.min(day, lastDay),
    anchor.getUTCHours(),
    anchor.getUTCMinutes(),
    anchor.getUTCSeconds(),
    anchor.getUTCMilliseconds(),
  ));
}

function isValidDate(value: Date) {
  return Number.isFinite(value.getTime());
}

function isUniqueConstraintError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("unique constraint") || message.toLowerCase().includes("constraint failed");
}
