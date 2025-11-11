-- V9: notifications 테이블 생성
-- 예산 알림 등 사용자 알림을 저장하는 테이블

CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    notification_uuid VARCHAR(36) NOT NULL UNIQUE COMMENT '알림UUID',
    family_uuid VARCHAR(36) NOT NULL COMMENT '가족UUID',
    user_uuid VARCHAR(36) COMMENT '수신자UUID',
    type VARCHAR(50) NOT NULL COMMENT '알림타입',
    title VARCHAR(200) NOT NULL COMMENT '제목',
    message TEXT NOT NULL COMMENT '내용',
    reference_uuid VARCHAR(36) COMMENT '참조UUID',
    reference_type VARCHAR(50) COMMENT '참조타입',
    alert_month VARCHAR(7) NOT NULL COMMENT '연월',
    is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT '읽음여부',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    
    INDEX idx_family_uuid (family_uuid),
    INDEX idx_family_type_month (family_uuid, type, alert_month)
) COMMENT='알림';

