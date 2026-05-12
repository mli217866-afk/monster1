CREATE TABLE `collection_items` (
	`collection_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`collection_id`, `prompt_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collection_items_prompt_id_idx` ON `collection_items` (`prompt_id`);--> statement-breakpoint
CREATE INDEX `collection_items_collection_created_idx` ON `collection_items` (`collection_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collections_user_id_idx` ON `collections` (`user_id`);--> statement-breakpoint
CREATE INDEX `collections_user_default_idx` ON `collections` (`user_id`,`is_default`);--> statement-breakpoint
CREATE TABLE `likes` (
	`user_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `prompt_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `likes_prompt_id_idx` ON `likes` (`prompt_id`);--> statement-breakpoint
CREATE TABLE `models` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`icon_url` text,
	`category` text DEFAULT 'text' NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `models_slug_unique` ON `models` (`slug`);--> statement-breakpoint
CREATE INDEX `models_active_sort_idx` ON `models` (`is_active`,`sort_order`);--> statement-breakpoint
CREATE INDEX `models_category_idx` ON `models` (`category`);--> statement-breakpoint
CREATE TABLE `prompt_images` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`url` text NOT NULL,
	`thumb_url` text,
	`r2_key` text,
	`width` integer,
	`height` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `prompt_images_prompt_id_idx` ON `prompt_images` (`prompt_id`);--> statement-breakpoint
CREATE INDEX `prompt_images_prompt_sort_idx` ON `prompt_images` (`prompt_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `prompt_models` (
	`prompt_id` text NOT NULL,
	`model_id` text NOT NULL,
	PRIMARY KEY(`prompt_id`, `model_id`),
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `prompt_models_model_id_idx` ON `prompt_models` (`model_id`,`prompt_id`);--> statement-breakpoint
CREATE TABLE `prompt_tags` (
	`prompt_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`prompt_id`, `tag_id`),
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `prompt_tags_tag_id_idx` ON `prompt_tags` (`tag_id`,`prompt_id`);--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`description` text NOT NULL,
	`search_text` text DEFAULT '' NOT NULL,
	`source_url` text,
	`source_author` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`author_id` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`collect_count` integer DEFAULT 0 NOT NULL,
	`copy_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompts_slug_unique` ON `prompts` (`slug`);--> statement-breakpoint
CREATE INDEX `prompts_status_published_at_idx` ON `prompts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `prompts_status_like_count_idx` ON `prompts` (`status`,`like_count`);--> statement-breakpoint
CREATE INDEX `prompts_author_id_idx` ON `prompts` (`author_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE INDEX `tags_usage_count_idx` ON `tags` (`usage_count`);
--> statement-breakpoint
INSERT INTO `models`
	(`id`, `slug`, `name`, `category`, `is_active`, `sort_order`, `created_at`, `updated_at`)
VALUES
	('model_gpt_5', 'gpt-5', 'GPT-5', 'text', true, 0, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
	('model_claude', 'claude', 'Claude', 'text', true, 1, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
	('model_midjourney', 'midjourney', 'Midjourney', 'image', true, 2, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
	('model_sora', 'sora', 'Sora', 'video', true, 3, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
	('model_jimeng', 'jimeng', '即梦', 'image', true, 4, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
	('model_kling', 'kling', '可灵', 'video', true, 5, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer));
--> statement-breakpoint
INSERT INTO `tags`
	(`id`, `slug`, `name`, `description`, `usage_count`, `created_at`, `updated_at`)
VALUES
	('tag_portrait', 'portrait', '人像', '人像与角色类提示词', 0, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
	('tag_writing', 'writing', '写作', '写作、改写和内容创作', 0, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
	('tag_marketing', 'marketing', '营销', '营销文案和增长内容', 0, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
	('tag_design', 'design', '设计', '视觉设计和创意方向', 0, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
	('tag_video', 'video', '视频', '视频生成和分镜脚本', 0, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
	('tag_productivity', 'productivity', '效率', '工作流和效率提升', 0, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer));
