CREATE TABLE `api_tokens` (
    `id`           BIGINT      NOT NULL AUTO_INCREMENT,
    `uuid`         VARCHAR(36) NOT NULL,
    `user_uuid`    VARCHAR(36) NOT NULL,
    `name`         VARCHAR(50) NOT NULL,
    `token_hash`   VARCHAR(64) NOT NULL,
    `token_prefix` VARCHAR(12) NOT NULL,
    `status`       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `last_used_at` DATETIME(3) NULL,
    `revoked_at`   DATETIME(3) NULL,
    `created_at`   DATETIME(3) NOT NULL,
    `updated_at`   DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_api_tokens_uuid` (`uuid`),
    UNIQUE KEY `uq_api_tokens_token_hash` (`token_hash`),
    CONSTRAINT `fk_api_tokens_user` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`),
    INDEX `idx_api_tokens_user_uuid` (`user_uuid`)
);
