import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    guestId: text("guest_id").notNull(),
    objectKey: text("object_key").notNull().unique(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    kind: text("kind", { enum: ["image", "video"] }).notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_assets_guest_created").on(table.guestId, table.createdAt)],
);

export const generationTasks = sqliteTable(
  "generation_tasks",
  {
    id: text("id").primaryKey(),
    guestId: text("guest_id").notNull(),
    mode: text("mode", {
      enum: ["text-to-video", "image-to-video", "first-last-frame", "motion-control", "video-to-video"],
    }).notNull(),
    model: text("model").notNull(),
    prompt: text("prompt").notNull(),
    negativePrompt: text("negative_prompt").notNull().default(""),
    aspectRatio: text("aspect_ratio").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    cameraMotion: text("camera_motion").notNull().default("auto"),
    motionStrength: integer("motion_strength").notNull().default(50),
    inputAssetId: text("input_asset_id").references(() => assets.id),
    endAssetId: text("end_asset_id").references(() => assets.id),
    motionAssetId: text("motion_asset_id").references(() => assets.id),
    providerTaskId: text("provider_task_id"),
    status: text("status", { enum: ["queued", "processing", "succeeded", "failed"] })
      .notNull()
      .default("queued"),
    progress: integer("progress").notNull().default(0),
    outputUrl: text("output_url"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    creditCost: integer("credit_cost").notNull().default(0),
    creditTransactionId: text("credit_transaction_id"),
    creditsRefundedAt: text("credits_refunded_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_generation_tasks_guest_created").on(table.guestId, table.createdAt),
    index("idx_generation_tasks_guest_status").on(table.guestId, table.status),
  ],
);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    creditBalance: integer("credit_balance").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_users_email").on(table.email)],
);

export const authSessions = sqliteTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_auth_sessions_token_hash").on(table.tokenHash),
    index("idx_auth_sessions_user_expires").on(table.userId, table.expiresAt),
  ],
);

export const creditTransactions = sqliteTable(
  "credit_transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    type: text("type", { enum: ["signup_bonus", "purchase", "subscription_grant", "generation_debit", "generation_refund", "admin_adjustment"] }).notNull(),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    note: text("note").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_credit_transactions_user_created").on(table.userId, table.createdAt),
    index("idx_credit_transactions_reference").on(table.referenceType, table.referenceId),
  ],
);

export const paymentOrders = sqliteTable(
  "payment_orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    provider: text("provider").notNull().default("stripe"),
    providerSessionId: text("provider_session_id").unique(),
    providerPaymentIntentId: text("provider_payment_intent_id"),
    packageId: text("package_id").notNull(),
    credits: integer("credits").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    status: text("status", { enum: ["pending", "paid", "failed", "cancelled"] }).notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_payment_orders_user_created").on(table.userId, table.createdAt),
    index("idx_payment_orders_session").on(table.providerSessionId),
  ],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    provider: text("provider").notNull().default("stripe"),
    providerSubscriptionId: text("provider_subscription_id").notNull().unique(),
    providerCustomerId: text("provider_customer_id").notNull(),
    planId: text("plan_id", { enum: ["monthly", "yearly"] }).notNull(),
    status: text("status", {
      enum: ["incomplete", "incomplete_expired", "trialing", "active", "past_due", "canceled", "unpaid", "paused"],
    }).notNull(),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
    startedAt: text("started_at").notNull(),
    currentPeriodStart: text("current_period_start").notNull(),
    currentPeriodEnd: text("current_period_end").notNull(),
    nextCreditGrantAt: text("next_credit_grant_at").notNull(),
    creditsGrantedPeriods: integer("credits_granted_periods").notNull().default(0),
    endedAt: text("ended_at"),
    providerEventCreatedAt: text("provider_event_created_at").notNull().default("1970-01-01T00:00:00.000Z"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_subscriptions_user_updated").on(table.userId, table.updatedAt),
    index("idx_subscriptions_customer").on(table.providerCustomerId),
  ],
);

export const subscriptionCreditGrants = sqliteTable(
  "subscription_credit_grants",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id),
    userId: text("user_id").notNull().references(() => users.id),
    periodKey: text("period_key").notNull(),
    installmentNumber: integer("installment_number").notNull(),
    credits: integer("credits").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_subscription_grants_period").on(table.subscriptionId, table.periodKey),
    index("idx_subscription_grants_user_created").on(table.userId, table.createdAt),
  ],
);

export const subscriptionCheckouts = sqliteTable(
  "subscription_checkouts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    providerSessionId: text("provider_session_id").notNull().unique(),
    planId: text("plan_id", { enum: ["monthly", "yearly"] }).notNull(),
    status: text("status", { enum: ["pending", "completed", "expired"] }).notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_subscription_checkouts_user_created").on(table.userId, table.createdAt)],
);

export const stripeWebhookEvents = sqliteTable("stripe_webhook_events", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  status: text("status", { enum: ["pending", "processing", "processed", "failed"] }).notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Asset = typeof assets.$inferSelect;
export type GenerationTask = typeof generationTasks.$inferSelect;
export type User = typeof users.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
