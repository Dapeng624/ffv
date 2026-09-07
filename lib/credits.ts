import { env } from "cloudflare:workers";

export const SIGNUP_BONUS_CREDITS = 20;

export type CreditTransactionType =
  | "signup_bonus"
  | "purchase"
  | "subscription_grant"
  | "generation_debit"
  | "generation_refund"
  | "admin_adjustment";

export async function grantCredits(input: {
  userId: string;
  amount: number;
  type: CreditTransactionType;
  referenceType?: string;
  referenceId?: string;
  note?: string;
}) {
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new Error("INVALID_CREDIT_AMOUNT");
  const transactionId = crypto.randomUUID();
  const updated = await env.DB.prepare(
    "UPDATE users SET credit_balance = credit_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING credit_balance",
  )
    .bind(input.amount, input.userId)
    .first<{ credit_balance: number }>();
  if (!updated) throw new Error("USER_NOT_FOUND");
  await env.DB.prepare(
    `INSERT INTO credit_transactions
      (id, user_id, amount, balance_after, type, reference_type, reference_id, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      transactionId,
      input.userId,
      input.amount,
      updated.credit_balance,
      input.type,
      input.referenceType ?? null,
      input.referenceId ?? null,
      input.note ?? "",
    )
    .run();
  return { transactionId, balanceAfter: updated.credit_balance };
}

export async function debitCredits(input: { userId: string; amount: number; referenceType: string; referenceId: string; note?: string }) {
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new Error("INVALID_CREDIT_AMOUNT");
  const transactionId = crypto.randomUUID();
  const updated = await env.DB.prepare(
    `UPDATE users
     SET credit_balance = credit_balance - ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND credit_balance >= ?
     RETURNING credit_balance`,
  )
    .bind(input.amount, input.userId, input.amount)
    .first<{ credit_balance: number }>();
  if (!updated) throw new Error("INSUFFICIENT_CREDITS");
  await env.DB.prepare(
    `INSERT INTO credit_transactions
      (id, user_id, amount, balance_after, type, reference_type, reference_id, note)
     VALUES (?, ?, ?, ?, 'generation_debit', ?, ?, ?)`,
  )
    .bind(transactionId, input.userId, -input.amount, updated.credit_balance, input.referenceType, input.referenceId, input.note ?? "")
    .run();
  return { transactionId, balanceAfter: updated.credit_balance };
}

export async function refundGenerationCredits(input: { taskId: string; userId: string; amount: number; reason: string }) {
  if (!Number.isInteger(input.amount) || input.amount <= 0) return null;
  const task = await env.DB.prepare("SELECT credits_refunded_at FROM generation_tasks WHERE id = ? AND guest_id = ? LIMIT 1")
    .bind(input.taskId, input.userId)
    .first<{ credits_refunded_at: string | null }>();
  if (!task || task.credits_refunded_at) return null;

  const result = await grantCredits({
    userId: input.userId,
    amount: input.amount,
    type: "generation_refund",
    referenceType: "generation_task",
    referenceId: input.taskId,
    note: input.reason,
  });
  await env.DB.prepare("UPDATE generation_tasks SET credits_refunded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(input.taskId)
    .run();
  return result;
}

export async function getCreditSummary(userId: string) {
  const user = await env.DB.prepare("SELECT credit_balance FROM users WHERE id = ? LIMIT 1")
    .bind(userId)
    .first<{ credit_balance: number }>();
  const transactions = await env.DB.prepare(
    `SELECT id, amount, balance_after, type, reference_type, reference_id, note, created_at
     FROM credit_transactions
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 30`,
  )
    .bind(userId)
    .all();
  return {
    balance: user?.credit_balance ?? 0,
    transactions: transactions.results,
  };
}
