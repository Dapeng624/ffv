import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

let initialization: Promise<void> | null = null;

export function ensureCoreSchema(): Promise<void> {
  initialization ??= initializeCoreSchema();
  return initialization;
}

async function initializeCoreSchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");

  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY NOT NULL,
      guest_id TEXT NOT NULL,
      object_key TEXT NOT NULL UNIQUE,
      file_name TEXT NOT NULL,
      content_type TEXT NOT NULL,
      byte_size INTEGER NOT NULL,
      kind TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_assets_guest_created ON assets (guest_id, created_at)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS generation_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      guest_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt TEXT NOT NULL,
      negative_prompt TEXT NOT NULL DEFAULT '',
      aspect_ratio TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      camera_motion TEXT NOT NULL DEFAULT 'auto',
      motion_strength INTEGER NOT NULL DEFAULT 50,
      input_asset_id TEXT REFERENCES assets(id),
      end_asset_id TEXT REFERENCES assets(id),
      motion_asset_id TEXT REFERENCES assets(id),
      provider_task_id TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      progress INTEGER NOT NULL DEFAULT 0,
      output_url TEXT,
      error_code TEXT,
      error_message TEXT,
      credit_cost INTEGER NOT NULL DEFAULT 0,
      credit_transaction_id TEXT,
      credits_refunded_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_generation_tasks_guest_created ON generation_tasks (guest_id, created_at)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_generation_tasks_guest_status ON generation_tasks (guest_id, status)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      credit_balance INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions (token_hash)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_expires ON auth_sessions (user_id, expires_at)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      type TEXT NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON credit_transactions (user_id, created_at)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference ON credit_transactions (reference_type, reference_id)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      provider TEXT NOT NULL DEFAULT 'stripe',
      provider_session_id TEXT UNIQUE,
      provider_payment_intent_id TEXT,
      package_id TEXT NOT NULL,
      credits INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_payment_orders_user_created ON payment_orders (user_id, created_at)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_payment_orders_session ON payment_orders (provider_session_id)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      provider TEXT NOT NULL DEFAULT 'stripe',
      provider_subscription_id TEXT NOT NULL UNIQUE,
      provider_customer_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      status TEXT NOT NULL,
      cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      current_period_start TEXT NOT NULL,
      current_period_end TEXT NOT NULL,
      next_credit_grant_at TEXT NOT NULL,
      credits_granted_periods INTEGER NOT NULL DEFAULT 0,
      ended_at TEXT,
      provider_event_created_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_subscriptions_user_updated ON subscriptions (user_id, updated_at)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions (provider_customer_id)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS subscription_credit_grants (
      id TEXT PRIMARY KEY NOT NULL,
      subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      period_key TEXT NOT NULL,
      installment_number INTEGER NOT NULL,
      credits INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_grants_period ON subscription_credit_grants (subscription_id, period_key)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_subscription_grants_user_created ON subscription_credit_grants (user_id, created_at)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS subscription_checkouts (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      provider_session_id TEXT NOT NULL UNIQUE,
      plan_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_subscription_checkouts_user_created ON subscription_checkouts (user_id, created_at)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS stripe_webhook_events (
      event_id TEXT PRIMARY KEY NOT NULL,
      event_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
  ]);

  await addColumnIfMissing("generation_tasks", "credit_transaction_id", "TEXT");
  await addColumnIfMissing("generation_tasks", "credits_refunded_at", "TEXT");
  await addColumnIfMissing("subscriptions", "provider_event_created_at", "TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'");
}

async function addColumnIfMissing(table: string, column: string, definition: string) {
  try {
    await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("duplicate column")) throw error;
  }
}
