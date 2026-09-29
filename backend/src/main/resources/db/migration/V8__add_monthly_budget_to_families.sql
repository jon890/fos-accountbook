-- V8: families 테이블에 월 예산 컬럼 추가
-- 월 단위로 관리되는 예산 필드

ALTER TABLE families
ADD COLUMN monthly_budget DECIMAL(15,2) DEFAULT 0.00 COMMENT '월 예산 (0은 예산 미설정)';

-- 기존 데이터는 0으로 초기화 (예산 미설정 상태)
UPDATE families SET monthly_budget = 0.00 WHERE monthly_budget IS NULL;

