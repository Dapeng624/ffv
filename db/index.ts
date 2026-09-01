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
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_generation_tasks_guest_created ON generation_tasks (guest_id, created_at)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_generation_tasks_guest_status ON generation_tasks (guest_id, status)"),
  ]);
}
