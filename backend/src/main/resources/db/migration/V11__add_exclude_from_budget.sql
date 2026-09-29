-- V11: 예산 계산에서 제외할 수 있는 기능 추가
-- 특정 지출이나 카테고리를 예산 합계에서 제외할 수 있도록 플래그 추가

-- expenses 테이블에 예산 제외 플래그 추가
ALTER TABLE expenses
ADD COLUMN exclude_from_budget BOOLEAN NOT NULL DEFAULT FALSE COMMENT '예산 계산에서 제외 여부';

-- categories 테이블에 예산 제외 플래그 추가
ALTER TABLE categories
ADD COLUMN exclude_from_budget BOOLEAN NOT NULL DEFAULT FALSE COMMENT '예산 계산에서 제외 여부';

-- 인덱스 추가 (예산 계산 쿼리 성능 향상)
CREATE INDEX idx_expenses_exclude_from_budget ON expenses (family_uuid, exclude_from_budget, date);
CREATE INDEX idx_categories_exclude_from_budget ON categories (family_uuid, exclude_from_budget);

