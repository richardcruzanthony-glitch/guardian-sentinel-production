CREATE TABLE `campaign_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaign_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `email_campaigns` ADD `emailBody` text;--> statement-breakpoint
ALTER TABLE `email_campaigns` ADD `recurringSchedule` varchar(50);--> statement-breakpoint
ALTER TABLE `email_campaigns` ADD `recurringDayOfWeek` int;--> statement-breakpoint
ALTER TABLE `email_campaigns` ADD `recurringTime` varchar(5);--> statement-breakpoint
ALTER TABLE `email_campaigns` ADD `recurringEndDate` timestamp;--> statement-breakpoint
ALTER TABLE `email_campaigns` ADD `nextScheduledRun` timestamp;