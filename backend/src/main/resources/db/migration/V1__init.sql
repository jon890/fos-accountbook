-- =====================================================
-- FOS Accountbook Database Schema
-- =====================================================
-- Flyway Migration V1: Initial Schema
-- 
-- Auth.js 테이블과 비즈니스 테이블을 모두 생성합니다.
-- Auth.js Prisma Adapter는 camelCase 컬럼명을 사용합니다.
-- =====================================================

-- =====================================================
-- Auth.js 인증 테이블
-- =====================================================

-- Users 테이블 (Auth.js & 백엔드 공유)
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(191) NOT NULL PRIMARY KEY,
    `uuid` BINARY(16) NOT NULL UNIQUE,
    `name` VARCHAR(255),
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `emailVerified` DATETIME(3),
    `image` VARCHAR(500),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3),
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Accounts 테이블 (Auth.js 전용)
CREATE TABLE IF NOT EXISTS `accounts` (
    `id` VARCHAR(191) NOT NULL PRIMARY KEY,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `provider` VARCHAR(100) NOT NULL,
    `providerAccountId` VARCHAR(255) NOT NULL,
    `refresh_token` TEXT,
    `access_token` TEXT,
    `expires_at` INT,
    `token_type` VARCHAR(100),
    `scope` VARCHAR(500),
    `id_token` TEXT,
    `session_state` VARCHAR(500),
    UNIQUE KEY `unique_provider_account` (`provider`, `providerAccountId`),
    INDEX `idx_accounts_userId` (`userId`),
    CONSTRAINT `fk_accounts_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions 테이블 (Auth.js 전용)
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` VARCHAR(191) NOT NULL PRIMARY KEY,
    `sessionToken` VARCHAR(255) NOT NULL UNIQUE,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    INDEX `idx_sessions_userId` (`userId`),
    CONSTRAINT `fk_sessions_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verification Tokens 테이블 (Auth.js 전용)
CREATE TABLE IF NOT EXISTS `verification_tokens` (
    `identifier` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL UNIQUE,
    `expires` DATETIME(3) NOT NULL,
    UNIQUE KEY `unique_identifier_token` (`identifier`, `token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 비즈니스 테이블
-- =====================================================

-- Families 테이블
CREATE TABLE IF NOT EXISTS `families` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `uuid` BINARY(16) NOT NULL UNIQUE,
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
    `uuid` BINARY(16) NOT NULL UNIQUE,
    `family_uuid` BINARY(16) NOT NULL,
    `user_uuid` BINARY(16) NOT NULL,
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
    `uuid` BINARY(16) NOT NULL UNIQUE,
    `family_uuid` BINARY(16) NOT NULL,
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
    `uuid` BINARY(16) NOT NULL UNIQUE,
    `family_uuid` BINARY(16) NOT NULL,
    `category_uuid` BINARY(16) NOT NULL,
    `user_uuid` BINARY(16) NOT NULL,
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
    `uuid` BINARY(16) NOT NULL UNIQUE,
    `family_uuid` BINARY(16) NOT NULL,
    `inviter_user_uuid` BINARY(16) NOT NULL,
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

