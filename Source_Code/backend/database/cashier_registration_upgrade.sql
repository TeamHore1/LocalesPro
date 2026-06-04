ALTER TABLE `users`
  ADD COLUMN `full_name` varchar(100) NOT NULL AFTER `username`,
  ADD COLUMN `email` varchar(120) DEFAULT NULL AFTER `full_name`,
  ADD COLUMN `phone` varchar(20) DEFAULT NULL AFTER `email`,
  ADD COLUMN `status` enum('pending','active','rejected','inactive') NOT NULL DEFAULT 'active' AFTER `role`,
  ADD COLUMN `registration_note` text DEFAULT NULL AFTER `status`,
  ADD COLUMN `review_note` text DEFAULT NULL AFTER `registration_note`,
  ADD COLUMN `approved_by` int(11) DEFAULT NULL AFTER `branch_id`,
  ADD COLUMN `approved_at` datetime DEFAULT NULL AFTER `approved_by`,
  ADD COLUMN `last_login_at` datetime DEFAULT NULL AFTER `approved_at`,
  ADD COLUMN `created_at` datetime NOT NULL DEFAULT current_timestamp() AFTER `last_login_at`;

UPDATE `users`
SET
  `full_name` = CASE
    WHEN `username` = 'ilham_admin' THEN 'Ilham Administrator'
    WHEN `username` = 'kasir_local' THEN 'Kasir Locales'
    ELSE `username`
  END,
  `email` = CASE
    WHEN `username` = 'ilham_admin' THEN 'admin@locales.test'
    WHEN `username` = 'kasir_local' THEN 'kasir@locales.test'
    ELSE NULL
  END,
  `phone` = CASE
    WHEN `username` = 'ilham_admin' THEN '081234567890'
    WHEN `username` = 'kasir_local' THEN '081298765432'
    ELSE NULL
  END,
  `status` = 'active',
  `review_note` = CASE
    WHEN `username` = 'kasir_local' THEN 'Akun kasir awal sistem.'
    ELSE NULL
  END,
  `approved_by` = CASE
    WHEN `username` = 'kasir_local' THEN 1
    ELSE NULL
  END,
  `approved_at` = CASE
    WHEN `username` = 'ilham_admin' THEN NOW()
    WHEN `username` = 'kasir_local' THEN NOW()
    ELSE NULL
  END,
  `created_at` = COALESCE(`created_at`, NOW());

ALTER TABLE `users`
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `status` (`status`);

ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
