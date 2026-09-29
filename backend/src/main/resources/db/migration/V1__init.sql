-- =====================================================
-- FOS Accountbook Database Schema
-- =====================================================
-- Flyway Migration V1: Initial Schema
-- 
-- 백엔드 전용 JWT 인증 방식 사용
-- 모든 UUID는 VARCHAR(36) 문자열 형식 사용
-- OAuth provider 기반 사용자 고유성 보장
-- =====================================================

-- =====================================================
-- Users 테이블
-- =====================================================
-- OAuth 기반 인증 사용자 관리
-- provider + provider_id로 고유성 보장

CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(36) NOT NULL UNIQUE,
    `provider` VARCHAR(50) NOT NULL COMMENT 'OAuth provider (google, kakao, etc.)',
    `provider_id` VARCHAR(255) NOT NULL COMMENT 'OAuth provider account ID',
    `name` VARCHAR(255),
    `email` VARCHAR(255) NOT NULL,
    `emailVerified` DATETIME(3),
    `image` VARCHAR(500),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3),
    UNIQUE KEY `unique_provider_account` (`provider`, `provider_id`),
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================

-- 비즈니스 테이블
-- =====================================================

-- Families 테이블
CREATE TABLE IF NOT EXISTS `families` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(36) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3),
    INDEX `idx_families_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Family Members 테이블
CREATE TABLE IF NOT EXISTS `family_members` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(36) NOT NULL UNIQUE,
    `family_uuid` VARCHAR(36) NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'member',
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3),
    UNIQUE KEY `unique_family_user` (`family_uuid`, `user_uuid`),
    INDEX `idx_family_members_family_uuid` (`family_uuid`),
    INDEX `idx_family_members_user_uuid` (`user_uuid`),
    CONSTRAINT `fk_family_members_family` FOREIGN KEY (`family_uuid`) REFERENCES `families`(`uuid`) ON DELETE CASCADE,
    CONSTRAINT `fk_family_members_user` FOREIGN KEY (`user_uuid`) REFERENCES `users`(`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories 테이블
CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(36) NOT NULL UNIQUE,
    `family_uuid` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `icon` VARCHAR(50),
    `color` VARCHAR(50),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3),
    INDEX `idx_categories_family_uuid` (`family_uuid`),
    CONSTRAINT `fk_categories_family` FOREIGN KEY (`family_uuid`) REFERENCES `families`(`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses 테이블
CREATE TABLE IF NOT EXISTS `expenses` (
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
    INDEX `idx_expenses_family_uuid` (`family_uuid`),
    INDEX `idx_expenses_category_uuid` (`category_uuid`),
    INDEX `idx_expenses_user_uuid` (`user_uuid`),
    INDEX `idx_expenses_date` (`date`),
    CONSTRAINT `fk_expenses_family` FOREIGN KEY (`family_uuid`) REFERENCES `families`(`uuid`) ON DELETE CASCADE,
    CONSTRAINT `fk_expenses_category` FOREIGN KEY (`category_uuid`) REFERENCES `categories`(`uuid`) ON DELETE RESTRICT,
    CONSTRAINT `fk_expenses_user` FOREIGN KEY (`user_uuid`) REFERENCES `users`(`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invitations 테이블
CREATE TABLE IF NOT EXISTS `invitations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(36) NOT NULL UNIQUE,
    `family_uuid` VARCHAR(36) NOT NULL,
    `inviter_user_uuid` VARCHAR(36) NOT NULL,
    `token` VARCHAR(255) NOT NULL UNIQUE,
    `expires_at` DATETIME(3) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3),
    INDEX `idx_invitations_family_uuid` (`family_uuid`),
    INDEX `idx_invitations_inviter_user_uuid` (`inviter_user_uuid`),
    INDEX `idx_invitations_token` (`token`),
    INDEX `idx_invitations_status` (`status`),
    INDEX `idx_invitations_expires_at` (`expires_at`),
    CONSTRAINT `fk_invitations_family` FOREIGN KEY (`family_uuid`) REFERENCES `families`(`uuid`) ON DELETE CASCADE,
    CONSTRAINT `fk_invitations_inviter` FOREIGN KEY (`inviter_user_uuid`) REFERENCES `users`(`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 완료
-- =====================================================
-- ✅ 모든 UUID는 VARCHAR(36) 문자열 형식
-- ✅ Users 테이블: BIGINT AUTO_INCREMENT + OAuth provider 정보
-- ✅ NextAuth 전용 테이블 없음 (JWT 인증 사용)
-- ✅ 모든 비즈니스 테이블 생성 완료
