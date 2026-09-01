CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`object_key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`kind` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assets_object_key_unique` ON `assets` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_assets_guest_created` ON `assets` (`guest_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `generation_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`mode` text NOT NULL,
	`model` text NOT NULL,
	`prompt` text NOT NULL,
	`negative_prompt` text DEFAULT '' NOT NULL,
	`aspect_ratio` text NOT NULL,
	`duration_seconds` integer NOT NULL,
	`camera_motion` text DEFAULT 'auto' NOT NULL,
	`motion_strength` integer DEFAULT 50 NOT NULL,
	`input_asset_id` text,
	`end_asset_id` text,
	`motion_asset_id` text,
	`provider_task_id` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`output_url` text,
	`error_code` text,
	`error_message` text,
	`credit_cost` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`input_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`end_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`motion_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_generation_tasks_guest_created` ON `generation_tasks` (`guest_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_generation_tasks_guest_status` ON `generation_tasks` (`guest_id`,`status`);