CREATE TABLE `face_verifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`will_id` varchar(36),
	`status` enum('pending','passed','failed','expired') NOT NULL DEFAULT 'pending',
	`provider` enum('manual_review','dojah','smile_id') NOT NULL,
	`challenges` json,
	`completed_challenges` json,
	`match_score` int,
	`liveness_score` int,
	`provider_reference` varchar(191),
	`failure_reason` varchar(512),
	`capture_document_id` varchar(36),
	`reviewed_by_user_id` varchar(36),
	`reviewed_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `face_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `face_verifications` ADD CONSTRAINT `face_verifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `face_verifications` ADD CONSTRAINT `face_verifications_will_id_wills_id_fk` FOREIGN KEY (`will_id`) REFERENCES `wills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `face_verifications_user_id_idx` ON `face_verifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `face_verifications_will_id_idx` ON `face_verifications` (`will_id`);--> statement-breakpoint
CREATE INDEX `face_verifications_status_idx` ON `face_verifications` (`status`);