package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * 알림 엔티티
 * 예산 경고, 예산 초과 등 사용자에게 보낼 알림을 저장합니다.
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_family_uuid", columnList = "family_uuid"),
    @Index(name = "idx_family_type_month", columnList = "family_uuid,type,alert_month")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "notification_uuid", nullable = false, unique = true, length = 36)
  private CustomUuid notificationUuid;

  @Column(name = "family_uuid", nullable = false, length = 36)
  private CustomUuid familyUuid;

  @Column(name = "user_uuid", length = 36)
  private CustomUuid userUuid;

  /**
   * 알림 타입
   * NotificationTypeConverter가 자동으로 코드값으로 변환하여 DB에 저장합니다.
   */
  @Column(nullable = false, length = 50)
  private NotificationType type;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;

  @Column(name = "reference_uuid", length = 36)
  private CustomUuid referenceUuid;

  @Column(name = "reference_type", length = 50)
  private String referenceType;

  /**
   * 알림 생성 연월 (YYYY-MM)
   * 중복 알림 방지를 위해 사용
   */
  @Column(name = "alert_month", nullable = false, length = 7)
  private String yearMonth;

  @Column(name = "is_read", nullable = false)
  @Builder.Default
  private Boolean isRead = false;

  @CreatedDate
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    if (notificationUuid == null) {
      notificationUuid = CustomUuid.generate();
    }
    // createdAt은 JPA Auditing이 자동 관리
  }

  // ========== 비즈니스 메서드 ==========

  /**
   * 알림을 읽음 처리합니다.
   */
  public void markAsRead() {
    this.isRead = true;
  }

  /**
   * 알림을 미읽음 처리합니다.
   */
  public void markAsUnread() {
    this.isRead = false;
  }

  /**
   * YearMonth로부터 yearMonth 문자열을 생성합니다.
   */
  public static String formatYearMonth(YearMonth yearMonth) {
    return yearMonth.format(DateTimeFormatter.ofPattern("yyyy-MM"));
  }

  /**
   * LocalDateTime으로부터 yearMonth 문자열을 생성합니다.
   */
  public static String formatYearMonth(LocalDateTime dateTime) {
    return formatYearMonth(YearMonth.from(dateTime));
  }
}

