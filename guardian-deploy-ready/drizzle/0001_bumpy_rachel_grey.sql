CREATE TABLE `agent_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`agentName` varchar(50) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL,
	`input` json,
	`output` json,
	`duration` int,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`standard` varchar(50) NOT NULL,
	`status` varchar(50) NOT NULL,
	`requirements` json,
	`documentation` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`metricType` varchar(50) NOT NULL,
	`value` decimal(10,4) NOT NULL,
	`previousValue` decimal(10,4),
	`improvement` decimal(10,4),
	`sampleSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manufacturing_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`materialCost` decimal(12,2),
	`laborCost` decimal(12,2),
	`overheadCost` decimal(12,2),
	`totalCost` decimal(12,2),
	`confidence` decimal(5,2),
	`processingTime` int,
	`results` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manufacturing_quotes_id` PRIMARY KEY(`id`)
);
