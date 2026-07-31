CREATE TABLE `accounts` (
	`user_id` varchar(36) NOT NULL,
	`type` varchar(64) NOT NULL,
	`provider` varchar(128) NOT NULL,
	`provider_account_id` varchar(191) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(64),
	`scope` varchar(512),
	`id_token` text,
	`session_state` varchar(512),
	CONSTRAINT `accounts_provider_provider_account_id_pk` PRIMARY KEY(`provider`,`provider_account_id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` varchar(36) NOT NULL,
	`will_id` varchar(36) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`type` enum('real_estate','bank_account','shares','business','vehicle','digital','insurance','other') NOT NULL,
	`description` varchar(512) NOT NULL,
	`institution` varchar(191),
	`identifier` varchar(191),
	`estimated_value_kobo` bigint,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`action` varchar(96) NOT NULL,
	`entity_type` varchar(64),
	`entity_id` varchar(36),
	`ip_address` varchar(64),
	`user_agent` varchar(512),
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`purpose` enum('email_verification','password_reset','phone_otp','two_factor') NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`consumed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `auth_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beneficiaries` (
	`id` varchar(36) NOT NULL,
	`will_id` varchar(36) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`full_name` varchar(191) NOT NULL,
	`relationship` varchar(96) NOT NULL,
	`email` varchar(191),
	`phone` varchar(32),
	`address` varchar(512),
	`share_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
	`is_contingent` boolean NOT NULL DEFAULT false,
	`notes` varchar(512),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `beneficiaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bequests` (
	`id` varchar(36) NOT NULL,
	`will_id` varchar(36) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`item_description` varchar(512) NOT NULL,
	`recipient_name` varchar(191) NOT NULL,
	`recipient_relationship` varchar(96),
	`notes` varchar(512),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `bequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` varchar(36) NOT NULL,
	`name` varchar(191) NOT NULL,
	`email` varchar(191) NOT NULL,
	`phone` varchar(32),
	`subject` varchar(191) NOT NULL,
	`message` text NOT NULL,
	`status` enum('new','in_progress','closed') NOT NULL DEFAULT 'new',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`will_id` varchar(36),
	`kind` enum('identity_document','passport_photograph','supporting_document','generated_will','signed_will') NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`mime_type` varchar(128) NOT NULL,
	`size_bytes` int NOT NULL,
	`storage_provider` enum('local','s3','gdrive') NOT NULL,
	`storage_key` varchar(512) NOT NULL,
	`is_encrypted` boolean NOT NULL DEFAULT true,
	`checksum` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `executors` (
	`id` varchar(36) NOT NULL,
	`will_id` varchar(36) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_alternate` boolean NOT NULL DEFAULT false,
	`full_name` varchar(191) NOT NULL,
	`relationship` varchar(96),
	`email` varchar(191),
	`phone` varchar(32),
	`address` varchar(512) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `executors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guardians` (
	`id` varchar(36) NOT NULL,
	`will_id` varchar(36) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_alternate` boolean NOT NULL DEFAULT false,
	`full_name` varchar(191) NOT NULL,
	`relationship` varchar(96),
	`phone` varchar(32),
	`address` varchar(512) NOT NULL,
	`children_covered` varchar(512),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `guardians_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`type` enum('system','will_review','payment','reminder','security') NOT NULL DEFAULT 'system',
	`title` varchar(191) NOT NULL,
	`body` varchar(1024) NOT NULL,
	`href` varchar(512),
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`will_id` varchar(36),
	`plan_id` varchar(36),
	`reference` varchar(128) NOT NULL,
	`provider` enum('paystack','flutterwave','bank_transfer') NOT NULL,
	`amount_kobo` bigint NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'NGN',
	`status` enum('pending','success','failed','abandoned','refunded') NOT NULL DEFAULT 'pending',
	`paid_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(96) NOT NULL,
	`tagline` varchar(191),
	`description` text,
	`price_kobo` bigint NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'NGN',
	`features` json NOT NULL,
	`is_popular` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(96) NOT NULL,
	`excerpt` varchar(512) NOT NULL,
	`body` text NOT NULL,
	`reading_minutes` int NOT NULL DEFAULT 4,
	`is_published` boolean NOT NULL DEFAULT true,
	`published_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_token` varchar(255) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`expires` datetime NOT NULL,
	CONSTRAINT `sessions_session_token` PRIMARY KEY(`session_token`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(128) NOT NULL,
	`value` json NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(191),
	`email` varchar(191) NOT NULL,
	`email_verified_at` timestamp,
	`password_hash` varchar(255),
	`phone` varchar(32),
	`phone_verified_at` timestamp,
	`image` varchar(512),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`status` enum('active','suspended','deleted') NOT NULL DEFAULT 'active',
	`two_factor_enabled` boolean NOT NULL DEFAULT false,
	`two_factor_secret` varchar(255),
	`last_login_at` timestamp,
	`failed_login_attempts` int NOT NULL DEFAULT 0,
	`locked_until` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` varchar(191) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` datetime NOT NULL,
	CONSTRAINT `verification_tokens_identifier_token_pk` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
CREATE TABLE `will_revisions` (
	`id` varchar(36) NOT NULL,
	`will_id` varchar(36) NOT NULL,
	`version` int NOT NULL,
	`snapshot` json NOT NULL,
	`summary` varchar(512),
	`changed_by_user_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `will_revisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `will_revisions_will_version_unique` UNIQUE(`will_id`,`version`)
);
--> statement-breakpoint
CREATE TABLE `wills` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`reference` varchar(32) NOT NULL,
	`title` varchar(191) NOT NULL,
	`status` enum('draft','submitted','under_review','approved','executed','archived') NOT NULL DEFAULT 'draft',
	`version` int NOT NULL DEFAULT 1,
	`current_step` int NOT NULL DEFAULT 1,
	`completion_percent` int NOT NULL DEFAULT 0,
	`full_legal_name` varchar(191),
	`date_of_birth` varchar(10),
	`nationality` varchar(96) DEFAULT 'Nigerian',
	`marital_status` enum('single','married','divorced','widowed'),
	`occupation` varchar(191),
	`national_id` varchar(64),
	`address_line1` varchar(255),
	`address_line2` varchar(255),
	`city` varchar(96),
	`state` varchar(96),
	`declared_last_will` boolean NOT NULL DEFAULT false,
	`revokes_prior_wills` boolean NOT NULL DEFAULT false,
	`confirmed_sound_mind` boolean NOT NULL DEFAULT false,
	`has_minor_children` boolean,
	`funeral_preference` enum('burial','cremation','other'),
	`funeral_instructions` text,
	`residuary_estate` text,
	`special_instructions` text,
	`confirmed_accurate` boolean NOT NULL DEFAULT false,
	`submitted_at` timestamp,
	`approved_at` timestamp,
	`last_generated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wills_id` PRIMARY KEY(`id`),
	CONSTRAINT `wills_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `witnesses` (
	`id` varchar(36) NOT NULL,
	`will_id` varchar(36) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`full_name` varchar(191) NOT NULL,
	`occupation` varchar(191),
	`email` varchar(191),
	`phone` varchar(32),
	`address` varchar(512) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `witnesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_will_id_wills_id_fk` FOREIGN KEY (`will_id`) REFERENCES `wills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auth_tokens` ADD CONSTRAINT `auth_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD CONSTRAINT `beneficiaries_will_id_wills_id_fk` FOREIGN KEY (`will_id`) REFERENCES `wills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bequests` ADD CONSTRAINT `bequests_will_id_wills_id_fk` FOREIGN KEY (`will_id`) REFERENCES `wills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_will_id_wills_id_fk` FOREIGN KEY (`will_id`) REFERENCES `wills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `executors` ADD CONSTRAINT `executors_will_id_wills_id_fk` FOREIGN KEY (`will_id`) REFERENCES `wills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guardians` ADD CONSTRAINT `guardians_will_id_wills_id_fk` FOREIGN KEY (`will_id`) REFERENCES `wills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_will_id_wills_id_fk` FOREIGN KEY (`will_id`) REFERENCES `wills`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_plan_id_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `will_revisions` ADD CONSTRAINT `will_revisions_will_id_wills_id_fk` FOREIGN KEY (`will_id`) REFERENCES `wills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wills` ADD CONSTRAINT `wills_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `witnesses` ADD CONSTRAINT `witnesses_will_id_wills_id_fk` FOREIGN KEY (`will_id`) REFERENCES `wills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accounts_user_id_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `assets_will_id_idx` ON `assets` (`will_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_id_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `auth_tokens_hash_idx` ON `auth_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `auth_tokens_user_purpose_idx` ON `auth_tokens` (`user_id`,`purpose`);--> statement-breakpoint
CREATE INDEX `beneficiaries_will_id_idx` ON `beneficiaries` (`will_id`);--> statement-breakpoint
CREATE INDEX `bequests_will_id_idx` ON `bequests` (`will_id`);--> statement-breakpoint
CREATE INDEX `contact_messages_status_idx` ON `contact_messages` (`status`);--> statement-breakpoint
CREATE INDEX `documents_user_id_idx` ON `documents` (`user_id`);--> statement-breakpoint
CREATE INDEX `documents_will_id_idx` ON `documents` (`will_id`);--> statement-breakpoint
CREATE INDEX `executors_will_id_idx` ON `executors` (`will_id`);--> statement-breakpoint
CREATE INDEX `guardians_will_id_idx` ON `guardians` (`will_id`);--> statement-breakpoint
CREATE INDEX `notifications_user_id_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `payments_user_id_idx` ON `payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `posts_published_idx` ON `posts` (`is_published`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `will_revisions_will_id_idx` ON `will_revisions` (`will_id`);--> statement-breakpoint
CREATE INDEX `wills_user_id_idx` ON `wills` (`user_id`);--> statement-breakpoint
CREATE INDEX `wills_status_idx` ON `wills` (`status`);--> statement-breakpoint
CREATE INDEX `witnesses_will_id_idx` ON `witnesses` (`will_id`);