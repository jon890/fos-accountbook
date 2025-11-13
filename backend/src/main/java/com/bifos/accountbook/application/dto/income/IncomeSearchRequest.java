package com.bifos.accountbook.application.dto.income;

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

  @Builder.Default
  private int page = 0;

  @Builder.Default
  private int size = 20;

  private String categoryUuid;
  private LocalDateTime startDate;
  private LocalDateTime endDate;

  public static IncomeSearchRequest withDefaults(
      Integer page,
      Integer size,
      String categoryUuid,
      String startDate,
      String endDate) {

    return IncomeSearchRequest.builder()
                              .page(page != null ? page : 0)
                              .size(size != null ? size : 20)
                              .categoryUuid(categoryUuid)
                              .startDate(parseDateTime(startDate, true))
                              .endDate(parseDateTime(endDate, false))
                              .build();
  }

  /**
   * 날짜 문자열을 LocalDateTime으로 파싱
   * 날짜만 있는 경우(2025-10-31) 또는 전체 DateTime(2025-10-31T00:00:00) 모두 지원
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
        // 시작일: 00:00:00, 종료일: 23:59:59
        return isStartDate ? date.atStartOfDay() : date.atTime(23, 59, 59);
      } catch (DateTimeParseException ex) {
        throw new IllegalArgumentException("날짜 형식이 올바르지 않습니다: " + dateStr);
      }
    }
  }
}

