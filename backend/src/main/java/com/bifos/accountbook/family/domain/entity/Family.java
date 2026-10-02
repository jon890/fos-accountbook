package com.bifos.accountbook.family.domain.entity;

import com.bifos.accountbook.family.domain.value.FamilyStatus;
import com.bifos.accountbook.shared.value.CustomUuid;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "families")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Family {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 36)
  private CustomUuid uuid;

  @Column(nullable = false, length = 100)
  private String name;

  /** 월 예산 0은 예산 미설정 상태를 의미합니다. */
  @Column(name = "monthly_budget", nullable = false, precision = 15, scale = 2)
  @Builder.Default
  private BigDecimal monthlyBudget = BigDecimal.ZERO;

  @CreatedDate
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @LastModifiedDate
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  /** 가족 상태 FamilyStatusConverter가 자동으로 코드값으로 변환하여 DB에 저장합니다. */
  @Column(nullable = false, length = 20)
  @Builder.Default
  private FamilyStatus status = FamilyStatus.ACTIVE;

  @OneToMany(
      mappedBy = "family",
      cascade = {CascadeType.PERSIST, CascadeType.MERGE})
  @Builder.Default
  private List<FamilyMember> members = new ArrayList<>();

  /**
   * JPA 연관관계 정책: 지출과 수입은 Family 에 컬렉션을 두지 않고 각자 {@code family} 다대일만 가진다. 가족의 지출과 수입은 저장소 조회로 읽는다.
   * 컬렉션을 두면 등록 경로가 가족의 다른 행에 묶인다. Category 도 캐시를 위해 연관관계가 없다.
   */
  @PrePersist
  public void prePersist() {
    if (uuid == null) {
      uuid = CustomUuid.generate();
    }
    // createdAt, updatedAt은 JPA Auditing이 자동 관리
  }

  // ========== 비즈니스 메서드 ==========

  /** 가족 이름 변경 */
  public void updateName(String name) {
    if (name == null || name.trim().isEmpty()) {
      throw new IllegalArgumentException("가족 이름은 필수입니다");
    }
    this.name = name;
  }

  /** 월 예산 변경 */
  public void updateMonthlyBudget(BigDecimal monthlyBudget) {
    if (monthlyBudget == null || monthlyBudget.compareTo(BigDecimal.ZERO) < 0) {
      throw new IllegalArgumentException("월 예산은 0 이상이어야 합니다");
    }
    this.monthlyBudget = monthlyBudget;
  }

  /** 가족 삭제 (Soft Delete) */
  public void delete() {
    this.status = FamilyStatus.DELETED;
  }
}
