CREATE TABLE `budget_items` (
    `id`            BIGINT         NOT NULL AUTO_INCREMENT,
    `uuid`          VARCHAR(36)    NOT NULL,
    `family_uuid`   VARCHAR(36)    NOT NULL,
    `name`          VARCHAR(30)    NOT NULL,
    `monthly_limit` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status`        VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    `created_at`    DATETIME(3)    NOT NULL,
    `updated_at`    DATETIME(3)    NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_budget_items_uuid` (`uuid`),
    INDEX `idx_budget_items_family_uuid` (`family_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `budget_item_categories` (
    `id`               BIGINT      NOT NULL AUTO_INCREMENT,
    `budget_item_uuid` VARCHAR(36) NOT NULL,
    `category_uuid`    VARCHAR(36) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_budget_item_categories_category` (`category_uuid`),
    INDEX `idx_budget_item_categories_item` (`budget_item_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
