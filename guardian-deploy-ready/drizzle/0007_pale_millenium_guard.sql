CREATE TABLE `email_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`emailTemplateId` int,
	`targetPositions` json,
	`status` enum('draft','scheduled','sending','sent','paused') NOT NULL DEFAULT 'draft',
	`scheduledFor` timestamp,
	`totalLeads` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`openCount` int DEFAULT 0,
	`clickCount` int DEFAULT 0,
	`replyCount` int DEFAULT 0,
	`conversionCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`leadId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('pending','sent','bounced','failed') NOT NULL DEFAULT 'pending',
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`repliedAt` timestamp,
	`replyContent` text,
	`trackingId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_sends_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_sends_trackingId_unique` UNIQUE(`trackingId`)
);
--> statement-breakpoint
CREATE TABLE `lead_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`type` enum('email_sent','email_opened','link_clicked','video_viewed','document_downloaded','demo_scheduled','call_scheduled','reply_received','status_changed') NOT NULL,
	`description` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('presentation','video','email_template','case_study','whitepaper') NOT NULL,
	`description` text,
	`fileUrl` varchar(500),
	`fileSize` int,
	`mimeType` varchar(100),
	`content` text,
	`isActive` int NOT NULL DEFAULT 1,
	`viewCount` int DEFAULT 0,
	`downloadCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`videoId` int NOT NULL,
	`videoUrl` varchar(500) NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`duration` int,
	`completionPercent` int,
	CONSTRAINT `video_views_id` PRIMARY KEY(`id`)
);
