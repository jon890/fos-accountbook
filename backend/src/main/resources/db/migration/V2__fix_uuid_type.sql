-- =====================================================
-- UUID 타입 수정: BINARY(16) → VARCHAR(36)
-- =====================================================
-- Auth.js와 호환성을 위해 문자열 형식 UUID 사용
-- 예: '6ccd780c-baba-1026-9564-5b8c656024db'
--
-- 순서: FK 삭제 → 타입 변경 → FK 재생성

-- =====================================================
-- 1단계: FK 제약조건 삭제
-- =====================================================

-- Family Members의 user FK 삭제
ALTER TABLE `family_members` 
DROP FOREIGN KEY `fk_family_members_user`;

-- Expenses의 user FK 삭제
ALTER TABLE `expenses` 
DROP FOREIGN KEY `fk_expenses_user`;

-- Invitations의 inviter FK 삭제
ALTER TABLE `invitations` 
DROP FOREIGN KEY `fk_invitations_inviter`;

-- =====================================================
-- 2단계: 컬럼 타입 변경
-- =====================================================

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

-- =====================================================
-- 3단계: FK 제약조건 재생성
-- =====================================================

-- Family Members의 user FK 재생성
ALTER TABLE `family_members` 
ADD CONSTRAINT `fk_family_members_user` 
FOREIGN KEY (`user_uuid`) REFERENCES `users`(`uuid`) ON DELETE CASCADE;

-- Expenses의 user FK 재생성
ALTER TABLE `expenses` 
ADD CONSTRAINT `fk_expenses_user` 
FOREIGN KEY (`user_uuid`) REFERENCES `users`(`uuid`) ON DELETE CASCADE;

-- Invitations의 inviter FK 재생성
ALTER TABLE `invitations` 
ADD CONSTRAINT `fk_invitations_inviter` 
FOREIGN KEY (`inviter_user_uuid`) REFERENCES `users`(`uuid`) ON DELETE CASCADE;

