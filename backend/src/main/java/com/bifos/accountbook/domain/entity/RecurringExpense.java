package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CustomUuid;
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

@Entity
@Table(name = "recurring_expenses", indexes = {
    @Index(name = "idx_recurring_family_uuid", columnList = "family_uuid"),
    @Index(name = "idx_recurring_day", columnList = "day_of_month")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringExpense {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 36)
  private CustomUuid uuid;

  @Column(name = "family_uuid", nullable = false, length = 36)
  private String familyUuid;

  @Column(name = "category_uuid", nullable = false, length = 36)
  private String categoryUuid;

  @Column(name = "user_uuid", nullable = false, length = 36)
  private String userUuid;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amount;

  @Column(name = "day_of_month", nullable = false, columnDefinition = "TINYINT")
  private int dayOfMonth;

  @Column(nullable = false, length = 20)
  @Builder.Default
  private RecurringExpenseStatus status = RecurringExpenseStatus.ACTIVE;

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

  public void update(String categoryUuid, String name, BigDecimal amount, Integer dayOfMonth) {
    if (categoryUuid != null) {
      this.categoryUuid = categoryUuid;
    }
    if (name != null) {
      this.name = name;
    }
    if (amount != null) {
      this.amount = amount;
    }
    if (dayOfMonth != null) {
      this.dayOfMonth = dayOfMonth;
    }
  }

  public void end() {
    this.status = RecurringExpenseStatus.ENDED;
  }
}
