CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ingredient_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `movement_type` varchar(30) NOT NULL,
  `direction` enum('in','out') NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock_before` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock_after` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reference_type` varchar(30) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_stock_movements_branch_created` (`branch_id`,`created_at`),
  KEY `idx_stock_movements_ingredient_created` (`ingredient_id`,`created_at`),
  KEY `idx_stock_movements_reference` (`reference_type`,`reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
