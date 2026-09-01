import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_generation_tasks_guest_created").on(table.guestId, table.createdAt),
    index("idx_generation_tasks_guest_status").on(table.guestId, table.status),
  ],
);

export type Asset = typeof assets.$inferSelect;
export type GenerationTask = typeof generationTasks.$inferSelect;
