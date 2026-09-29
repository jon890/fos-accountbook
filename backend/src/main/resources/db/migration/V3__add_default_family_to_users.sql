-- =====================================================
-- Add Default Family to Users
-- =====================================================
-- Flyway Migration V3: users 테이블에 기본 가족 설정 필드 추가
-- =====================================================

-- default_family_uuid 컬럼 추가
ALTER TABLE `users`
ADD COLUMN `default_family_uuid` VARCHAR(36) NULL COMMENT '사용자의 기본 가족 UUID',
ADD INDEX `idx_users_default_family_uuid` (`default_family_uuid`);

-- 외래 키 제약 조건 추가 (선택사항 - 데이터 무결성을 위해)
-- ALTER TABLE `users`
-- ADD CONSTRAINT `fk_users_default_family`
--     FOREIGN KEY (`default_family_uuid`)
--     REFERENCES `families`(`uuid`)
--     ON DELETE SET NULL;

-- =================l====================================
-- 완료
-- =====================================================
-- ✅ users 테이블에 default_family_uuid 컬럼 추가
-- ✅ 인덱스 생성
-- ✅ NULL 허용 (기본 가족 설정은 선택사항)

