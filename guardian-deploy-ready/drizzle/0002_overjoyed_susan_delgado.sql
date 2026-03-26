ALTER TABLE `learning_metrics` MODIFY COLUMN `value` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_metrics` MODIFY COLUMN `previousValue` varchar(20);--> statement-breakpoint
ALTER TABLE `learning_metrics` MODIFY COLUMN `improvement` varchar(20);--> statement-breakpoint
ALTER TABLE `manufacturing_quotes` MODIFY COLUMN `materialCost` varchar(20);--> statement-breakpoint
ALTER TABLE `manufacturing_quotes` MODIFY COLUMN `laborCost` varchar(20);--> statement-breakpoint
ALTER TABLE `manufacturing_quotes` MODIFY COLUMN `overheadCost` varchar(20);--> statement-breakpoint
ALTER TABLE `manufacturing_quotes` MODIFY COLUMN `totalCost` varchar(20);--> statement-breakpoint
ALTER TABLE `manufacturing_quotes` MODIFY COLUMN `confidence` varchar(10);