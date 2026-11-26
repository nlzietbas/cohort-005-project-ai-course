ALTER TABLE `users` ADD `slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_slug_unique` ON `users` (`slug`);--> statement-breakpoint
CREATE TRIGGER `users_assign_slug_on_insert` AFTER INSERT ON `users` FOR EACH ROW WHEN NEW.slug IS NULL
BEGIN
  UPDATE `users` SET `slug` = (
    SELECT CASE
      WHEN NOT EXISTS (SELECT 1 FROM `users` WHERE `slug` = b.base) THEN b.base
      WHEN NOT EXISTS (SELECT 1 FROM `users` WHERE `slug` = b.base || '-' || NEW.id) THEN b.base || '-' || NEW.id
      ELSE b.base || '-' || NEW.id || '-' || lower(hex(randomblob(3)))
    END
    FROM (SELECT coalesce(nullif(trim(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(trim(NEW.name)), '''', ''), '"', ''), '`', ''), '?', ''), '#', ''), '%', ''), '(', ''), ')', ''), '[', ''), ']', ''), '{', ''), '}', ''), '!', ''), '@', ''), '*', ''), '$', ''), '^', ''), '<', ''), '>', ''), ' ', '-'), '.', '-'), '_', '-'), '/', '-'), '\', '-'), '&', '-'), '+', '-'), ',', '-'), ';', '-'), ':', '-'), '=', '-'), '|', '-'), '~', '-'), char(9), '-'), '--', '-'), '--', '-'), '--', '-'), '--', '-'), '-'), ''), 'user') AS base) AS b
  ) WHERE `id` = NEW.id;
END;
--> statement-breakpoint
CREATE TRIGGER `users_assign_slug_on_clear` AFTER UPDATE OF `slug` ON `users` FOR EACH ROW WHEN NEW.slug IS NULL
BEGIN
  UPDATE `users` SET `slug` = (
    SELECT CASE
      WHEN NOT EXISTS (SELECT 1 FROM `users` WHERE `slug` = b.base) THEN b.base
      WHEN NOT EXISTS (SELECT 1 FROM `users` WHERE `slug` = b.base || '-' || NEW.id) THEN b.base || '-' || NEW.id
      ELSE b.base || '-' || NEW.id || '-' || lower(hex(randomblob(3)))
    END
    FROM (SELECT coalesce(nullif(trim(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(trim(NEW.name)), '''', ''), '"', ''), '`', ''), '?', ''), '#', ''), '%', ''), '(', ''), ')', ''), '[', ''), ']', ''), '{', ''), '}', ''), '!', ''), '@', ''), '*', ''), '$', ''), '^', ''), '<', ''), '>', ''), ' ', '-'), '.', '-'), '_', '-'), '/', '-'), '\', '-'), '&', '-'), '+', '-'), ',', '-'), ';', '-'), ':', '-'), '=', '-'), '|', '-'), '~', '-'), char(9), '-'), '--', '-'), '--', '-'), '--', '-'), '--', '-'), '-'), ''), 'user') AS base) AS b
  ) WHERE `id` = NEW.id;
END;
--> statement-breakpoint
UPDATE `users` SET `slug` = NULL;
