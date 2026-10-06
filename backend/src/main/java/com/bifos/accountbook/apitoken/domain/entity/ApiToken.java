package com.bifos.accountbook.apitoken.domain.entity;

import com.bifos.accountbook.apitoken.domain.value.ApiTokenStatus;
import com.bifos.accountbook.shared.value.CustomUuid;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/** 사용자가 외부 도구에 넘기는 연동 토큰. 원문은 저장하지 않고 SHA-256 해시만 둔다 (ADR-B18). */
@Entity
@Table(
    name = "api_tokens",
    indexes = {@Index(name = "idx_api_tokens_user_uuid", columnList = "user_uuid")})
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiToken {

  private static final long USAGE_UPDATE_INTERVAL_MINUTES = 5;

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 36)
  private CustomUuid uuid;

  @Column(name = "user_uuid", nullable = false, length = 36)
  private CustomUuid userUuid;

  @Column(nullable = false, length = 50)
  private String name;

  @Column(name = "token_hash", nullable = false, unique = true, length = 64)
  private String tokenHash;

  @Column(name = "token_prefix", nullable = false, length = 12)
  private String tokenPrefix;

  @Column(nullable = false, length = 20)
  @Builder.Default
  private ApiTokenStatus status = ApiTokenStatus.ACTIVE;

  @Column(name = "last_used_at")
  private LocalDateTime lastUsedAt;

  @Column(name = "revoked_at")
  private LocalDateTime revokedAt;

  @CreatedDate
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @LastModifiedDate
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  public void prePersist() {
    if (uuid == null) {
      uuid = CustomUuid.generate();
    }
  }

  // ========== 비즈니스 메서드 ==========

  public void revoke(LocalDateTime now) {
    this.status = ApiTokenStatus.REVOKED;
    this.revokedAt = now;
  }

  /** 요청마다 쓰기가 일어나지 않도록, 마지막 사용 시각이 5분 넘게 지났을 때만 갱신한다. */
  public boolean needsUsageUpdate(LocalDateTime now) {
    return lastUsedAt == null
        || lastUsedAt.isBefore(now.minusMinutes(USAGE_UPDATE_INTERVAL_MINUTES));
  }
}
