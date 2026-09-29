-- V6: users 테이블에 status 컬럼 추가 및 deletedAt 제거
-- status 기반 인덱스로 성능 최적화

-- 1. status 컬럼 추가
ALTER TABLE `users`
ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '사용자 상태 (ACTIVE, DELETED)' AFTER `updatedAt`;

-- 2. 기존 deletedAt 데이터를 status로 마이그레이션
UPDATE `users`
SET `status` = 'DELETED'
WHERE `deletedAt` IS NOT NULL;

-- 3. status 인덱스 추가 (빠른 조회를 위한 인덱스)
CREATE INDEX `idx_users_status` ON `users` (`status`);

-- 4. deletedAt 컬럼 제거
ALTER TABLE `users`
DROP COLUMN `deletedAt`;

