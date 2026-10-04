package com.bifos.accountbook.installment.domain.value;

/** 이번 달 기준 할부 진행 상태. 저장하지 않고 조회할 때 계산한다. */
public enum InstallmentProgress {
  /** 첫 결제 월 전 */
  UPCOMING,
  IN_PROGRESS,
  /** 마지막 결제 월 뒤 */
  COMPLETED
}
