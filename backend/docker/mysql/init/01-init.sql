-- FOS Accountbook Database Initialization Script
-- This script runs automatically when the MySQL container is first created

-- UTF-8 설정 확인
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 데이터베이스가 이미 생성되어 있으므로 USE만 수행
USE accountbook;

-- 타임존 설정
SET time_zone = '+09:00';

-- 기본 설정 출력 (로그 확인용)
SELECT 
    @@character_set_database as 'Database Charset',
    @@collation_database as 'Database Collation',
    @@time_zone as 'Timezone';

-- 테이블 생성은 Spring Boot JPA가 자동으로 수행하거나
-- Prisma 마이그레이션을 MySQL로 변환하여 사용할 수 있습니다

-- 초기화 완료 메시지
SELECT 'Database initialization completed!' as Status;

