-- V7: deleted_at 컬럼을 status 컬럼으로 전환
-- 모든 엔티티에 CodeEnum 패턴 적용

-- ========================================
-- 1. categories 테이블
-- ========================================
-- status 컬럼 추가
ALTER TABLE categories
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- 기존 deleted_at 데이터를 status로 마이그레이션
UPDATE categories
SET status = CASE
    WHEN deleted_at IS NULL THEN 'ACTIVE'
    ELSE 'DELETED'
END;

-- deleted_at 컬럼 삭제
ALTER TABLE categories
DROP COLUMN deleted_at;

-- ========================================
-- 2. expenses 테이블
-- ========================================
-- status 컬럼 추가
ALTER TABLE expenses
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- 기존 deleted_at 데이터를 status로 마이그레이션
UPDATE expenses
SET status = CASE
    WHEN deleted_at IS NULL THEN 'ACTIVE'
    ELSE 'DELETED'
END;

-- deleted_at 컬럼 삭제
ALTER TABLE expenses
DROP COLUMN deleted_at;

-- ========================================
-- 3. families 테이블
-- ========================================
-- status 컬럼 추가
ALTER TABLE families
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- 기존 deleted_at 데이터를 status로 마이그레이션
UPDATE families
SET status = CASE
    WHEN deleted_at IS NULL THEN 'ACTIVE'
    ELSE 'DELETED'
END;

-- deleted_at 컬럼 삭제
ALTER TABLE families
DROP COLUMN deleted_at;

-- ========================================
-- 4. family_members 테이블
-- ========================================
-- status 컬럼 추가
ALTER TABLE family_members
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- 기존 deleted_at 데이터를 status로 마이그레이션
-- FamilyMember는 'LEFT' 상태를 사용 (탈퇴)
UPDATE family_members
SET status = CASE
    WHEN deleted_at IS NULL THEN 'ACTIVE'
    ELSE 'LEFT'
END;

-- deleted_at 컬럼 삭제
ALTER TABLE family_members
DROP COLUMN deleted_at;

-- ========================================
-- 5. incomes 테이블
-- ========================================
-- status 컬럼 추가
ALTER TABLE incomes
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- 기존 deleted_at 데이터를 status로 마이그레이션
UPDATE incomes
SET status = CASE
    WHEN deleted_at IS NULL THEN 'ACTIVE'
    ELSE 'DELETED'
END;

-- deleted_at 컬럼 삭제
ALTER TABLE incomes
DROP COLUMN deleted_at;

-- ========================================
-- 6. invitations 테이블
-- ========================================
-- invitations는 이미 status 컬럼이 있으므로 deleted_at만 제거
ALTER TABLE invitations
DROP COLUMN deleted_at;

-- ========================================
-- 인덱스 추가 (성능 최적화)
-- ========================================
-- 상태별 조회가 빈번한 테이블에 인덱스 추가
CREATE INDEX idx_categories_status ON categories(status);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_families_status ON families(status);
CREATE INDEX idx_family_members_status ON family_members(status);
CREATE INDEX idx_incomes_status ON incomes(status);

