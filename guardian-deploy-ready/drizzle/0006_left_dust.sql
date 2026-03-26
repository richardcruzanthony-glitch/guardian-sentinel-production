CREATE TABLE `agent_activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`leadId` int,
	`activityType` enum('email_sent','demo_scheduled','quote_provided','contract_sent','payment_processed','feedback_received') NOT NULL,
	`subject` varchar(255),
	`content` text,
	`prospectEmail` varchar(320),
	`prospectName` varchar(255),
	`status` enum('pending','sent','opened','clicked','replied','failed') NOT NULL DEFAULT 'pending',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_sales_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`domain` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`status` enum('active','inactive','paused') NOT NULL DEFAULT 'active',
	`messagingTemplate` text,
	`capabilities` json,
	`targetIndustries` json,
	`performanceMetrics` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_sales_agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`leadId` int NOT NULL,
	`prospectName` varchar(255) NOT NULL,
	`prospectEmail` varchar(320) NOT NULL,
	`contractType` enum('license_agreement','nda','msa','sow') NOT NULL,
	`tierId` int,
	`terms` json,
	`documentUrl` varchar(500),
	`status` enum('draft','sent','signed','executed','expired') NOT NULL DEFAULT 'draft',
	`signedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `demo_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`leadId` int NOT NULL,
	`prospectName` varchar(255) NOT NULL,
	`prospectEmail` varchar(320) NOT NULL,
	`scheduledTime` timestamp NOT NULL,
	`duration` int,
	`meetingLink` varchar(500),
	`status` enum('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `demo_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`leadId` int NOT NULL,
	`tierId` int NOT NULL,
	`prospectEmail` varchar(320) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`paymentMethod` enum('credit_card','bank_transfer','invoice','stripe') NOT NULL,
	`transactionId` varchar(255),
	`invoiceUrl` varchar(500),
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prospect_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`leadId` int NOT NULL,
	`prospectEmail` varchar(320) NOT NULL,
	`feedbackType` enum('email_open','link_click','demo_interest','pricing_inquiry','objection','positive_feedback','negative_feedback') NOT NULL,
	`content` text,
	`sentiment` enum('positive','neutral','negative'),
	`engagementScore` int,
	`nextAction` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prospect_feedback_id` PRIMARY KEY(`id`)
);
