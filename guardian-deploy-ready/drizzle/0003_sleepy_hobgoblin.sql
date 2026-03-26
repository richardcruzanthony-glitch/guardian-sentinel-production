CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('demo','early_access') NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`company` varchar(255),
	`companySize` varchar(50),
	`domainsInterested` json,
	`timeline` varchar(50),
	`message` text,
	`status` enum('new','contacted','qualified','closed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
