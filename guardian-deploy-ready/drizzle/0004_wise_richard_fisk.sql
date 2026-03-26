CREATE TABLE `visitor_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorName` varchar(255) NOT NULL,
	`visitorEmail` varchar(320),
	`message` text NOT NULL,
	`page` varchar(100),
	`status` enum('new','read','replied') NOT NULL DEFAULT 'new',
	`reply` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitor_messages_id` PRIMARY KEY(`id`)
);
