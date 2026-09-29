-- =====================================================
-- User Profiles 테이블
-- =====================================================
-- 사용자별 프로필 설정 관리
-- timezone: 사용자의 선호 시간대 (기본값: Asia/Seoul)
-- language: 언어 설정 (향후 확장)
-- currency: 통화 설정 (향후 확장)

CREATE TABLE IF NOT EXISTS `user_profiles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_uuid` VARCHAR(36) NOT NULL UNIQUE COMMENT '사용자 UUID (users.uuid)',
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Seoul' COMMENT '시간대 (예: UTC, Asia/Seoul, America/New_York)',
    `language` VARCHAR(10) DEFAULT 'ko' COMMENT '언어 코드 (예: ko, en)',
    `currency` VARCHAR(10) DEFAULT 'KRW' COMMENT '통화 코드 (예: KRW, USD)',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX `idx_user_profiles_user_uuid` (`user_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 기존 사용자에 대한 기본 프로필 생성
-- =====================================================
-- 삭제되지 않은 모든 사용자에 대해 기본 프로필 생성
INSERT INTO `user_profiles` (`user_uuid`, `timezone`, `language`, `currency`)
SELECT 
    `uuid`,
    'Asia/Seoul',
    'ko',
    'KRW'
FROM `users`
WHERE `deletedAt` IS NULL
AND `uuid` NOT IN (SELECT `user_uuid` FROM `user_profiles`);

