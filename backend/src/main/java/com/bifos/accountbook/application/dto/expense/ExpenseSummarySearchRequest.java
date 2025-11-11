package com.bifos.accountbook.application.dto.expense;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
                .startDate(startDate != null ? LocalDateTime.parse(startDate) : null)
                .endDate(endDate != null ? LocalDateTime.parse(endDate) : null)
                .categoryUuid(categoryUuid)
                .build();
    }
}

