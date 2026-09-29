-- categories 테이블에 is_default 컬럼 추가
ALTER TABLE categories
ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;

-- 1. 기존에 이미 존재하는 '미분류' 카테고리를 기본 카테고리로 지정
UPDATE categories
SET is_default = TRUE
WHERE name = '미분류';

-- 2. '미분류' 카테고리가 없는 가족들에게 새로 생성 (MySQL 8.0+ UUID() 사용)
INSERT INTO categories (uuid, family_uuid, name, color, icon, status, is_default, exclude_from_budget, created_at, updated_at)
SELECT 
    UUID(),
    f.uuid, 
    '미분류', 
    '#9ca3af', 
    '📂', 
    'ACTIVE', 
    TRUE, 
    FALSE, 
    NOW(), 
    NOW()
FROM families f
WHERE f.status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM categories c 
      WHERE c.family_uuid = f.uuid 
      AND (c.name = '미분류' OR c.is_default = TRUE)
  );