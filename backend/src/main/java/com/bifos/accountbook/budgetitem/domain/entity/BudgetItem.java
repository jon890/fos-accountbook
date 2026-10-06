package com.bifos.accountbook.budgetitem.domain.entity;

import com.bifos.accountbook.budgetitem.domain.value.BudgetItemStatus;
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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/** 가족이 만든 예산 항목. 이름, 월 한도, 지출 카테고리 묶음을 가진다 (ADR-B25). */
@Entity
@Table(
    name = "budget_items",
    indexes = {@Index(name = "idx_budget_items_family_uuid", columnList = "family_uuid")})
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 36)
  private CustomUuid uuid;

  @Column(name = "family_uuid", nullable = false, length = 36)
  private CustomUuid familyUuid;

  @Column(nullable = false, length = 30)
  private String name;

  /** 0 은 한도 없음을 뜻한다. */
  @Column(name = "monthly_limit", nullable = false, precision = 15, scale = 2)
  @Builder.Default
  private BigDecimal monthlyLimit = BigDecimal.ZERO;

  @Column(nullable = false, length = 20)
  @Builder.Default
  private BudgetItemStatus status = BudgetItemStatus.ACTIVE;

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

  public void update(String name, BigDecimal monthlyLimit) {
    this.name = name;
    this.monthlyLimit = monthlyLimit;
  }

  public void delete() {
    this.status = BudgetItemStatus.DELETED;
  }
}
