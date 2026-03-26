CREATE TABLE `license_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`licenseKey` varchar(64) NOT NULL,
	`tierId` int NOT NULL,
	`userId` int,
	`companyName` varchar(255),
	`email` varchar(320),
	`status` enum('generated','activated','expired','revoked') NOT NULL DEFAULT 'generated',
	`activatedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `license_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `license_keys_licenseKey_unique` UNIQUE(`licenseKey`)
);
--> statement-breakpoint
CREATE TABLE `license_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`company` varchar(255),
	`industry` varchar(100),
	`tiersInterested` json,
	`message` text,
	`status` enum('new','contacted','quoted','converted','lost') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `license_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `licensing_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`monthlyPrice` int NOT NULL,
	`annualPrice` int NOT NULL,
	`features` json NOT NULL,
	`maxUsers` int,
	`maxProjects` int,
	`supportLevel` varchar(50) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `licensing_tiers_id` PRIMARY KEY(`id`)
);
