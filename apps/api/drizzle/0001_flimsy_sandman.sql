CREATE TABLE `product_reservation_items` (
	`reservation_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(10,2) NOT NULL,
	CONSTRAINT `product_reservation_items_reservation_id_product_id_pk` PRIMARY KEY(`reservation_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `product_reservations` (
	`id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`payment_method` enum('PIX','CASH','CARD') NOT NULL,
	`status` enum('RESERVED') NOT NULL DEFAULT 'RESERVED',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `product_reservation_items` ADD CONSTRAINT `product_reservation_items_reservation_id_product_reservations_id_fk` FOREIGN KEY (`reservation_id`) REFERENCES `product_reservations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_reservation_items` ADD CONSTRAINT `product_reservation_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_reservations` ADD CONSTRAINT `product_reservations_customer_id_users_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;