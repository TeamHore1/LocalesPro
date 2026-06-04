ALTER TABLE `transactions`
  ADD COLUMN IF NOT EXISTS `transaction_code` varchar(40) DEFAULT NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `amount_paid` decimal(10,2) NOT NULL DEFAULT 0.00 AFTER `payment_method`,
  ADD COLUMN IF NOT EXISTS `change_amount` decimal(10,2) NOT NULL DEFAULT 0.00 AFTER `amount_paid`,
  ADD COLUMN IF NOT EXISTS `payment_status` varchar(20) NOT NULL DEFAULT 'Paid' AFTER `change_amount`,
  ADD COLUMN IF NOT EXISTS `payment_reference` varchar(100) DEFAULT NULL AFTER `payment_status`,
  ADD COLUMN IF NOT EXISTS `payment_note` varchar(255) DEFAULT NULL AFTER `payment_reference`,
  ADD COLUMN IF NOT EXISTS `customer_name` varchar(120) DEFAULT NULL AFTER `payment_note`,
  ADD COLUMN IF NOT EXISTS `void_reason` varchar(255) DEFAULT NULL AFTER `customer_name`,
  ADD COLUMN IF NOT EXISTS `voided_by` int(11) DEFAULT NULL AFTER `void_reason`,
  ADD COLUMN IF NOT EXISTS `voided_at` datetime DEFAULT NULL AFTER `voided_by`;

UPDATE `transactions`
SET
  `transaction_code` = CONCAT('LOC-', DATE_FORMAT(`created_at`, '%Y%m%d'), '-', LPAD(`id`, 5, '0')),
  `amount_paid` = CASE
    WHEN `amount_paid` IS NULL OR `amount_paid` = 0 THEN `total_price`
    ELSE `amount_paid`
  END,
  `change_amount` = COALESCE(`change_amount`, 0),
  `payment_status` = CASE
    WHEN `payment_status` IS NULL OR `payment_status` = '' THEN 'Paid'
    ELSE `payment_status`
  END
WHERE `transaction_code` IS NULL
   OR `transaction_code` = ''
   OR `amount_paid` IS NULL
   OR `amount_paid` = 0
   OR `payment_status` IS NULL
   OR `payment_status` = '';
