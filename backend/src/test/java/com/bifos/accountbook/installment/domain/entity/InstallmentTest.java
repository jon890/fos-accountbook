package com.bifos.accountbook.installment.domain.entity;

import static org.assertj.core.api.Assertions.assertThat;

import com.bifos.accountbook.installment.domain.value.InstallmentProgress;
import com.bifos.accountbook.installment.domain.value.InstallmentSchedule;
import java.math.BigDecimal;
import java.time.YearMonth;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Installment 납부 계획 계산 단위 테스트")
class InstallmentTest {

  /** DB 에서 읽은 값처럼 총액은 scale 2 로 둔다. */
  private Installment installment(long total, int months, String startMonth) {
    return Installment.builder()
        .totalAmount(BigDecimal.valueOf(total).setScale(2))
        .installmentMonths(months)
        .startMonth(startMonth)
        .build();
  }

  private Installment twelveMonths() {
    return installment(1_000_000, 12, "2026-09");
  }

  @Test
  @DisplayName("진행 중이면 월 납부액, 회차, 남은 금액을 원 단위 정수로 계산한다")
  void scheduleAt_inProgress() {
    InstallmentSchedule schedule = twelveMonths().scheduleAt(YearMonth.of(2026, 10));

    assertThat(schedule.endMonth()).isEqualTo(YearMonth.of(2027, 8));
    assertThat(schedule.monthlyAmount()).isEqualTo(new BigDecimal("83333"));
    assertThat(schedule.firstMonthAmount()).isEqualTo(new BigDecimal("83337"));
    assertThat(schedule.currentRound()).isEqualTo(2);
    assertThat(schedule.thisMonthAmount()).isEqualTo(new BigDecimal("83333"));
    assertThat(schedule.remainingAmount()).isEqualTo(new BigDecimal("833330"));
    assertThat(schedule.progress()).isEqualTo(InstallmentProgress.IN_PROGRESS);
  }

  @Test
  @DisplayName("첫 결제 월이면 1회차이고 끝전을 얹은 금액을 낸다")
  void scheduleAt_firstMonth() {
    InstallmentSchedule schedule = twelveMonths().scheduleAt(YearMonth.of(2026, 9));

    assertThat(schedule.currentRound()).isEqualTo(1);
    assertThat(schedule.thisMonthAmount()).isEqualTo(new BigDecimal("83337"));
    assertThat(schedule.remainingAmount()).isEqualTo(new BigDecimal("916663"));
  }

  @Test
  @DisplayName("첫 결제 월 전이면 UPCOMING 이고 회차 0, 남은 금액은 총액이다")
  void scheduleAt_upcoming() {
    InstallmentSchedule schedule = twelveMonths().scheduleAt(YearMonth.of(2026, 8));

    assertThat(schedule.progress()).isEqualTo(InstallmentProgress.UPCOMING);
    assertThat(schedule.currentRound()).isZero();
    assertThat(schedule.thisMonthAmount()).isEqualTo(BigDecimal.ZERO);
    assertThat(schedule.remainingAmount()).isEqualTo(new BigDecimal("1000000"));
  }

  @Test
  @DisplayName("마지막 결제 월은 아직 IN_PROGRESS 이고 남은 금액이 0 이다")
  void scheduleAt_lastMonth() {
    InstallmentSchedule schedule = twelveMonths().scheduleAt(YearMonth.of(2027, 8));

    assertThat(schedule.progress()).isEqualTo(InstallmentProgress.IN_PROGRESS);
    assertThat(schedule.currentRound()).isEqualTo(12);
    assertThat(schedule.remainingAmount()).isEqualTo(BigDecimal.ZERO);
    assertThat(schedule.thisMonthAmount()).isEqualTo(new BigDecimal("83333"));
  }

  @Test
  @DisplayName("마지막 결제 월이 지나면 COMPLETED 이고 이번 달 금액과 남은 금액이 0 이다")
  void scheduleAt_completed() {
    InstallmentSchedule schedule = twelveMonths().scheduleAt(YearMonth.of(2027, 9));

    assertThat(schedule.progress()).isEqualTo(InstallmentProgress.COMPLETED);
    assertThat(schedule.currentRound()).isEqualTo(12);
    assertThat(schedule.thisMonthAmount()).isEqualTo(BigDecimal.ZERO);
    assertThat(schedule.remainingAmount()).isEqualTo(BigDecimal.ZERO);
  }

  @Test
  @DisplayName("해를 넘기는 할부는 다음 해에 끝난다")
  void scheduleAt_crossesYear() {
    InstallmentSchedule schedule =
        installment(300_000, 3, "2026-11").scheduleAt(YearMonth.of(2026, 11));

    assertThat(schedule.endMonth()).isEqualTo(YearMonth.of(2027, 1));
  }

  @Test
  @DisplayName("나누어떨어지는 총액은 첫 회차와 월 납부액이 같다")
  void scheduleAt_evenSplit() {
    InstallmentSchedule schedule =
        installment(300_000, 3, "2026-10").scheduleAt(YearMonth.of(2026, 10));

    assertThat(schedule.monthlyAmount()).isEqualTo(new BigDecimal("100000"));
    assertThat(schedule.firstMonthAmount()).isEqualTo(new BigDecimal("100000"));
  }
}
