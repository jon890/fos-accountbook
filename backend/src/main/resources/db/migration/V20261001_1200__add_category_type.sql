ALTER TABLE `categories`
ADD COLUMN `type` VARCHAR(20) NOT NULL DEFAULT 'EXPENSE';

UPDATE `categories` c
SET c.`type` = 'INCOME'
WHERE c.`is_default` = FALSE
  AND EXISTS (
      SELECT 1
      FROM `incomes` i
      WHERE i.`category_uuid` = c.`uuid`
        AND i.`status` = 'ACTIVE'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM `expenses` e
      WHERE e.`category_uuid` = c.`uuid`
  )
  AND NOT EXISTS (
      SELECT 1
      FROM `recurring_expenses` r
      WHERE r.`category_uuid` = c.`uuid`
  );

INSERT INTO `categories` (`uuid`, `family_uuid`, `name`, `color`, `icon`, `status`, `is_default`, `exclude_from_budget`, `type`, `created_at`, `updated_at`)
SELECT UUID(), f.`uuid`, '급여', '#2563eb', '💰', 'ACTIVE', FALSE, FALSE, 'INCOME', NOW(), NOW()
FROM `families` f
WHERE f.`status` = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM `categories` c
      WHERE c.`family_uuid` = f.`uuid`
        AND c.`name` = '급여'
        AND c.`type` = 'INCOME'
        AND c.`status` = 'ACTIVE'
  );

INSERT INTO `categories` (`uuid`, `family_uuid`, `name`, `color`, `icon`, `status`, `is_default`, `exclude_from_budget`, `type`, `created_at`, `updated_at`)
SELECT UUID(), f.`uuid`, '부수입', '#7c3aed', '💡', 'ACTIVE', FALSE, FALSE, 'INCOME', NOW(), NOW()
FROM `families` f
WHERE f.`status` = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM `categories` c
      WHERE c.`family_uuid` = f.`uuid`
        AND c.`name` = '부수입'
        AND c.`type` = 'INCOME'
        AND c.`status` = 'ACTIVE'
  );

INSERT INTO `categories` (`uuid`, `family_uuid`, `name`, `color`, `icon`, `status`, `is_default`, `exclude_from_budget`, `type`, `created_at`, `updated_at`)
SELECT UUID(), f.`uuid`, '용돈', '#db2777', '🎁', 'ACTIVE', FALSE, FALSE, 'INCOME', NOW(), NOW()
FROM `families` f
WHERE f.`status` = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM `categories` c
      WHERE c.`family_uuid` = f.`uuid`
        AND c.`name` = '용돈'
        AND c.`type` = 'INCOME'
        AND c.`status` = 'ACTIVE'
  );

INSERT INTO `categories` (`uuid`, `family_uuid`, `name`, `color`, `icon`, `status`, `is_default`, `exclude_from_budget`, `type`, `created_at`, `updated_at`)
SELECT UUID(), f.`uuid`, '기타 수입', '#16a34a', '💵', 'ACTIVE', FALSE, FALSE, 'INCOME', NOW(), NOW()
FROM `families` f
WHERE f.`status` = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM `categories` c
      WHERE c.`family_uuid` = f.`uuid`
        AND c.`name` = '기타 수입'
        AND c.`type` = 'INCOME'
        AND c.`status` = 'ACTIVE'
  );

CREATE TEMPORARY TABLE `income_default_candidates` AS
SELECT f.`uuid` AS `family_uuid`
FROM `families` f
WHERE f.`status` = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM `categories` existing_default
      WHERE existing_default.`family_uuid` = f.`uuid`
        AND existing_default.`type` = 'INCOME'
        AND existing_default.`status` = 'ACTIVE'
        AND existing_default.`is_default` = TRUE
  );

UPDATE `categories` c
SET c.`is_default` = TRUE
WHERE c.`name` = '기타 수입'
  AND c.`type` = 'INCOME'
  AND c.`status` = 'ACTIVE'
  AND c.`family_uuid` IN (SELECT `family_uuid` FROM `income_default_candidates`);

DROP TABLE `income_default_candidates`;

UPDATE `incomes` i
SET i.`category_uuid` = (
    SELECT income_default.`uuid`
    FROM `categories` income_default
    WHERE income_default.`family_uuid` = i.`family_uuid`
      AND income_default.`name` = '기타 수입'
      AND income_default.`type` = 'INCOME'
      AND income_default.`status` = 'ACTIVE'
      AND income_default.`is_default` = TRUE
)
WHERE EXISTS (
    SELECT 1
    FROM `families` f
    JOIN `categories` old_category
      ON old_category.`uuid` = i.`category_uuid`
    WHERE f.`uuid` = i.`family_uuid`
      AND f.`status` = 'ACTIVE'
      AND old_category.`type` = 'EXPENSE'
);
