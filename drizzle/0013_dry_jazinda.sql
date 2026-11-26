PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_id` integer NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`video_url` text,
	`github_repo_url` text,
	`position` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_lessons`("id", "module_id", "title", "content", "video_url", "github_repo_url", "position", "duration_minutes", "created_at") SELECT "id", "module_id", "title", "content", "video_url", "github_repo_url", "position", CASE WHEN "duration_minutes" IS NULL OR "duration_minutes" < 1 THEN 1 ELSE "duration_minutes" END, "created_at" FROM `lessons`;--> statement-breakpoint
DROP TABLE `lessons`;--> statement-breakpoint
ALTER TABLE `__new_lessons` RENAME TO `lessons`;--> statement-breakpoint
CREATE TABLE `__new_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`notes` text,
	`sales_copy` text NOT NULL,
	`instructor_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`status` text NOT NULL,
	`cover_image_url` text,
	`price` integer DEFAULT 0 NOT NULL,
	`ppp_enabled` integer DEFAULT true NOT NULL,
	`weekly_commitment_min_minutes` integer NOT NULL,
	`weekly_commitment_max_minutes` integer NOT NULL,
	`duration_weeks` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_courses`("id", "title", "slug", "description", "notes", "sales_copy", "instructor_id", "category_id", "status", "cover_image_url", "price", "ppp_enabled", "weekly_commitment_min_minutes", "weekly_commitment_max_minutes", "duration_weeks", "created_at", "updated_at") SELECT "id", "title", "slug", "description", "notes", "sales_copy", "instructor_id", "category_id", "status", "cover_image_url", "price", "ppp_enabled", "min_minutes", MAX("min_minutes", CAST("video" * 2.5 / "weeks" + 0.5 AS INTEGER)), "weeks", "created_at", "updated_at" FROM (SELECT *, MAX(1, CAST("video" * 1.5 / "weeks" + 0.5 AS INTEGER)) AS "min_minutes" FROM (SELECT *, MAX(1, ("video" * 2 + 179) / 180) AS "weeks" FROM (SELECT `courses`.*, (SELECT COALESCE(SUM(`lessons`.`duration_minutes`), 0) FROM `lessons` JOIN `modules` ON `modules`.`id` = `lessons`.`module_id` WHERE `modules`.`course_id` = `courses`.`id`) AS "video" FROM `courses`)));--> statement-breakpoint
DROP TABLE `courses`;--> statement-breakpoint
ALTER TABLE `__new_courses` RENAME TO `courses`;--> statement-breakpoint
CREATE UNIQUE INDEX `courses_slug_unique` ON `courses` (`slug`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
