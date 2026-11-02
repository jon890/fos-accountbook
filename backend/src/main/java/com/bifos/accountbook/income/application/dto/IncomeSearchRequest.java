package com.bifos.accountbook.income.application.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomeSearchRequest {

  @Builder.Default private int page = 0;

  @Builder.Default private int size = 20;

  private String categoryUuid;
  private LocalDateTime startDate;

  /** 조회 기간 끝(미만). 종료일 하루 전체를 담도록 종료일 다음 날 0시를 둔다. */
  private LocalDateTime endDateExclusive;

  public static IncomeSearchRequest withDefaults(
      Integer page, Integer size, String categoryUuid, String startDate, String endDate) {

    return IncomeSearchRequest.builder()
        .page(page != null ? page : 0)
        .size(size != null ? size : 20)
        .categoryUuid(categoryUuid)
        .startDate(parseDateTime(startDate, true))
        .endDateExclusive(parseDateTime(endDate, false))
        .build();
  }

  /**
   * 날짜 문자열을 LocalDateTime으로 파싱한다. 날짜만 있는 경우(2025-10-31)와 전체 DateTime(2025-10-31T00:00:00)을 모두 받는다.
   * 날짜만 있으면 시작은 그날 0시, 끝은 다음 날 0시(미만)다. 전체 DateTime 이면 그 시각을 그대로 쓴다.
   */
  private static LocalDateTime parseDateTime(String dateStr, boolean isStartDate) {
    if (dateStr == null || dateStr.isEmpty()) {
      return null;
    }

    try {
      // ISO 8601 DateTime 형식 시도
      return LocalDateTime.parse(dateStr);
    } catch (DateTimeParseException e) {
      try {
        // 날짜만 있는 경우 파싱
        LocalDate date = LocalDate.parse(dateStr);
        return isStartDate ? date.atStartOfDay() : date.plusDays(1).atStartOfDay();
      } catch (DateTimeParseException ex) {
        throw new IllegalArgumentException("날짜 형식이 올바르지 않습니다: " + dateStr);
      }
    }
  }
}
