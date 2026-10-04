package com.bifos.accountbook.installment.domain.entity;

import com.bifos.accountbook.installment.domain.value.InstallmentProgress;
import com.bifos.accountbook.installment.domain.value.InstallmentSchedule;
import com.bifos.accountbook.installment.domain.value.InstallmentStatus;
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
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * 가족이 기록한 할부 한 건. 지출을 만들지 않고 예산과 집계에 들어가지 않는다 (ADR-B27).
 *
 * <p>회차와 남은 금액은 저장하지 않고 {@link #scheduleAt(YearMonth)} 로 계산한다.
 */
@Entity
@Table(
    name = "installments",
    indexes = {@Index(name = "idx_installments_family_uuid", columnList = "family_uuid")})
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Installment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 36)
  private CustomUuid uuid;

  @Column(name = "family_uuid", nullable = false, length = 36)
  private CustomUuid familyUuid;

  /** 등록한 사람. */
  @Column(name = "user_uuid", nullable = false, length = 36)
  private CustomUuid userUuid;

  @Column(nullable = false, length = 50)
  private String name;

  @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
  private BigDecimal totalAmount;

  @Column(name = "installment_months", nullable = false)
  private int installmentMonths;

  /** 첫 결제 월. YYYY-MM. */
  @Column(name = "start_month", nullable = false, length = 7)
  private String startMonth;

  @Column(length = 200)
  private String memo;

  @Column(nullable = false, length = 20)
  @Builder.Default
  private InstallmentStatus status = InstallmentStatus.ACTIVE;

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

  public void update(
      String name, BigDecimal totalAmount, int installmentMonths, String startMonth, String memo) {
    this.name = name;
    this.totalAmount = totalAmount;
    this.installmentMonths = installmentMonths;
    this.startMonth = startMonth;
    this.memo = memo;
  }

  public void delete() {
    this.status = InstallmentStatus.DELETED;
  }

  /**
   * 기준 월에서 본 납부 계획을 계산한다.
   *
   * <p>월 납부액은 총액을 개월 수로 나눠 원 단위로 내리고, 남는 끝전은 1회차에 얹는다. 저장소에서 읽은 총액은 scale 2 라 먼저 scale 0 으로 맞춰, 결과
   * 금액이 모두 scale 0 이 되게 한다.
   */
  public InstallmentSchedule scheduleAt(YearMonth currentMonth) {
    BigDecimal total = totalAmount.setScale(0, RoundingMode.DOWN);
    YearMonth start = YearMonth.parse(startMonth);
    YearMonth endMonth = start.plusMonths(installmentMonths - 1L);

    BigDecimal monthlyAmount =
        total.divide(BigDecimal.valueOf(installmentMonths), 0, RoundingMode.DOWN);
    BigDecimal firstMonthAmount =
        total.subtract(monthlyAmount.multiply(BigDecimal.valueOf(installmentMonths - 1L)));

    int currentRound;
    if (currentMonth.isBefore(start)) {
      currentRound = 0;
    } else if (currentMonth.isAfter(endMonth)) {
      currentRound = installmentMonths;
    } else {
      currentRound = (int) ChronoUnit.MONTHS.between(start, currentMonth) + 1;
    }

    BigDecimal paid =
        currentRound == 0
            ? BigDecimal.ZERO
            : firstMonthAmount.add(monthlyAmount.multiply(BigDecimal.valueOf(currentRound - 1L)));
    BigDecimal remainingAmount = total.subtract(paid);

    InstallmentProgress progress;
    BigDecimal thisMonthAmount;
    if (currentMonth.isBefore(start)) {
      progress = InstallmentProgress.UPCOMING;
      thisMonthAmount = BigDecimal.ZERO;
    } else if (currentMonth.isAfter(endMonth)) {
      progress = InstallmentProgress.COMPLETED;
      thisMonthAmount = BigDecimal.ZERO;
    } else {
      progress = InstallmentProgress.IN_PROGRESS;
      thisMonthAmount = currentRound == 1 ? firstMonthAmount : monthlyAmount;
    }

    return new InstallmentSchedule(
        endMonth,
        monthlyAmount,
        firstMonthAmount,
        currentRound,
        thisMonthAmount,
        remainingAmount,
        progress);
  }
}
