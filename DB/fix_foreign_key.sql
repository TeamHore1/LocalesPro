-- Tambahkan data branch_id yang hilang ke tabel branches
INSERT IGNORE INTO `branches` (`id`, `name`, `address`, `phone`, `status`, `created_at`) VALUES
(12, 'Branch 12', 'Address 12', '1234567890', 'active', NOW()),
(13, 'Branch 13', 'Address 13', '0987654321', 'active', NOW());
