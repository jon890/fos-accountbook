-- =====================================================
-- Add Incomes Table
-- =====================================================
-- Flyway Migration V2: 수입 테이블 추가
-- expenses 테이블과 동일한 구조로 별도 관리
-- =====================================================

CREATE TABLE IF NOT EXISTS `incomes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(36) NOT NULL UNIQUE,
    `family_uuid` VARCHAR(36) NOT NULL,
    `category_uuid` VARCHAR(36) NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `description` TEXT,
    `date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3),
    INDEX `idx_incomes_family_uuid` (`family_uuid`),
    INDEX `idx_incomes_category_uuid` (`category_uuid`),
    INDEX `idx_incomes_user_uuid` (`user_uuid`),
    INDEX `idx_incomes_date` (`date`),
    CONSTRAINT `fk_incomes_family` FOREIGN KEY (`family_uuid`) REFERENCES `families`(`uuid`) ON DELETE CASCADE,
    CONSTRAINT `fk_incomes_category` FOREIGN KEY (`category_uuid`) REFERENCES `categories`(`uuid`) ON DELETE RESTRICT,
    CONSTRAINT `fk_incomes_user` FOREIGN KEY (`user_uuid`) REFERENCES `users`(`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 완료
-- =====================================================
-- ✅ incomes 테이블 생성 완료
-- ✅ expenses와 동일한 구조로 별도 관리
-- ✅ 인덱스 및 외래 키 제약 조건 설정 완료

