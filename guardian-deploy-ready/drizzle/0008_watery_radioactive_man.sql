CREATE TABLE `campaign_targeting_criteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`minEngagementScore` int DEFAULT 0,
	`maxEngagementScore` int DEFAULT 100,
	`industries` json,
	`locations` json,
	`positions` json,
	`companySizes` json,
	`minDaysSinceContact` int,
	`maxLeadsToTarget` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaign_targeting_criteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` ADD `industry` varchar(100);--> statement-breakpoint
ALTER TABLE `leads` ADD `location` varchar(100);--> statement-breakpoint
ALTER TABLE `leads` ADD `position` varchar(100);--> statement-breakpoint
ALTER TABLE `leads` ADD `engagementScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `leads` ADD `lastContactedAt` timestamp;