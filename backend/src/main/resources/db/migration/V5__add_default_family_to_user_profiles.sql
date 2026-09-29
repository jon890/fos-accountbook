-- V5: user_profiles 테이블에 default_family_uuid 컬럼 추가 및 데이터 마이그레이션
-- users 테이블의 default_family_uuid를 user_profiles로 이동

-- 1. user_profiles 테이블에 default_family_uuid 컬럼 추가
ALTER TABLE `user_profiles`
ADD COLUMN `default_family_uuid` VARCHAR(36) NULL COMMENT '기본 가족 UUID' AFTER `currency`;

-- 2. users 테이블의 기존 default_family_uuid 데이터를 user_profiles로 복사
UPDATE `user_profiles` up
INNER JOIN `users` u ON up.user_uuid = u.uuid
SET up.default_family_uuid = u.default_family_uuid
WHERE u.default_family_uuid IS NOT NULL;

-- 3. users 테이블에서 default_family_uuid 컬럼 제거
ALTER TABLE `users`
DROP INDEX `idx_users_default_family_uuid`;

ALTER TABLE `users`
DROP COLUMN `default_family_uuid`;

-- 4. user_profiles의 default_family_uuid에 대한 인덱스 추가 (조회 성능 향상)
CREATE INDEX `idx_user_profiles_default_family_uuid` ON `user_profiles` (`default_family_uuid`);

