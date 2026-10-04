CREATE TABLE `installments` (
    `id`                 BIGINT         NOT NULL AUTO_INCREMENT,
    `uuid`               VARCHAR(36)    NOT NULL,
    `family_uuid`        VARCHAR(36)    NOT NULL,
    `user_uuid`          VARCHAR(36)    NOT NULL,
    `name`               VARCHAR(50)    NOT NULL,
    `total_amount`       DECIMAL(12, 2) NOT NULL,
    `installment_months` INT            NOT NULL,
    `start_month`        VARCHAR(7)     NOT NULL,
    `memo`               VARCHAR(200)   NULL,
    `status`             VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    `created_at`         DATETIME(3)    NOT NULL,
    `updated_at`         DATETIME(3)    NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_installments_uuid` (`uuid`),
    INDEX `idx_installments_family_uuid` (`family_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
