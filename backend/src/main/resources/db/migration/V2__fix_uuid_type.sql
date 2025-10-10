-- =====================================================
-- UUID 타입 수정: BINARY(16) → VARCHAR(36)
-- =====================================================
-- Auth.js와 호환성을 위해 문자열 형식 UUID 사용
-- 예: '6ccd780c-baba-1026-9564-5b8c656024db'

-- Users 테이블의 uuid 컬럼 타입 변경 + DEFAULT 추가
ALTER TABLE `users` 
MODIFY COLUMN `uuid` VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID());

-- Family Members 테이블의 user_uuid 컬럼 타입 변경
ALTER TABLE `family_members` 
MODIFY COLUMN `user_uuid` VARCHAR(36) NOT NULL;

-- Expenses 테이블의 user_uuid 컬럼 타입 변경
ALTER TABLE `expenses` 
MODIFY COLUMN `user_uuid` VARCHAR(36) NOT NULL;

-- Invitations 테이블의 inviter_user_uuid 컬럼 타입 변경
ALTER TABLE `invitations` 
MODIFY COLUMN `inviter_user_uuid` VARCHAR(36) NOT NULL;

