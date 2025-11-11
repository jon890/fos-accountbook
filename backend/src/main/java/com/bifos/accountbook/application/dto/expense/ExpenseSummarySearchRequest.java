package com.bifos.accountbook.application.dto.expense;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

/**
 * 지출 요약 검색 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseSummarySearchRequest {

    /**
     * 시작 날짜
     */
    private LocalDateTime startDate;

    /**
     * 종료 날짜
     */
    private LocalDateTime endDate;

    /**
     * 카테고리 UUID (선택)
     */
    private String categoryUuid;

    /**
     * 기본값으로 요청 생성
     */
    public static ExpenseSummarySearchRequest withDefaults(
            String startDate,
            String endDate,
            String categoryUuid) {
        
        return ExpenseSummarySearchRequest.builder()
                .startDate(parseDateTime(startDate, true))
                .endDate(parseDateTime(endDate, false))
                .categoryUuid(categoryUuid)
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

