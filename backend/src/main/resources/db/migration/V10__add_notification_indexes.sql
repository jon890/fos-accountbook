-- V10: notifications 테이블 인덱스 추가
-- 사용자별 알림 조회 성능 향상을 위한 인덱스 추가

-- 가족 내 사용자별 알림 조회 최적화
-- findByFamilyAndUser 쿼리 최적화
CREATE INDEX idx_family_user_created ON notifications (family_uuid, user_uuid, created_at DESC);

-- 사용자별 읽지 않은 알림 수 조회 최적화
-- countUnreadByUser 쿼리 최적화
CREATE INDEX idx_user_is_read ON notifications (user_uuid, is_read);

