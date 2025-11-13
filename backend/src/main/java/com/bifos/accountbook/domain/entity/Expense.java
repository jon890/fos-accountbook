package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.ExpenseStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "expenses", indexes = {
    @Index(name = "idx_family_uuid_date", columnList = "family_uuid,date"),
    @Index(name = "idx_category_uuid", columnList = "category_uuid")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 36)
  private CustomUuid uuid;

  /**
   * 가족 연관관계 (JPA 연관관계 사용)
   * LAZY 로딩으로 필요 시에만 로드
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "family_uuid", referencedColumnName = "uuid", nullable = false)
  private Family family;

  /**
   * 카테고리 UUID (캐시 활용을 위해 연관관계 사용 안함)
   * CategoryService의 캐시를 통해 조회
   */
  @Column(name = "category_uuid", nullable = false, length = 36)
  private CustomUuid categoryUuid;

  @Column(name = "user_uuid", nullable = false, length = 36)
  private CustomUuid userUuid;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amount;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(nullable = false)
  @Builder.Default
  private LocalDateTime date = LocalDateTime.now();

  @CreatedDate
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @LastModifiedDate
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  /**
   * 지출 상태
   * ExpenseStatusConverter가 자동으로 코드값으로 변환하여 DB에 저장합니다.
   */
  @Column(nullable = false, length = 20)
  @Builder.Default
  private ExpenseStatus status = ExpenseStatus.ACTIVE;

  /**
   * JPA 연관관계 정책:
   * - Family: @ManyToOne 사용 (ORM의 장점 활용)
   * - Category: UUID만 사용 (CategoryService 캐시 활용)
   * - User: UUID만 사용 (복잡도 감소)
   */

  @PrePersist
  public void prePersist() {
    if (uuid == null) {
      uuid = CustomUuid.generate();
    }
  }

  // ========== 편의 메서드 ==========

  /**
   * Family UUID 조회 (편의 메서드)
   */
  public CustomUuid getFamilyUuid() {
    return family != null ? family.getUuid() : null;
  }

  // ========== 비즈니스 메서드 ==========

  /**
   * 지출 정보 수정
   */
  public void update(CustomUuid categoryUuid, BigDecimal amount, String description, LocalDateTime date) {
    if (categoryUuid != null) {
      this.categoryUuid = categoryUuid;
    }
    if (amount != null) {
      if (amount.compareTo(BigDecimal.ZERO) <= 0) {
        throw new IllegalArgumentException("금액은 0보다 커야 합니다");
      }
      this.amount = amount;
    }
    if (description != null) {
      this.description = description;
    }
    if (date != null) {
      this.date = date;
    }
  }

  /**
   * 지출 삭제 (Soft Delete)
   */
  public void delete() {
    this.status = ExpenseStatus.DELETED;
  }
}
