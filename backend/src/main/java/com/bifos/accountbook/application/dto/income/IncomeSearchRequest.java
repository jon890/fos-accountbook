package com.bifos.accountbook.application.dto.income;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
                .startDate(startDate != null ? LocalDateTime.parse(startDate) : null)
                .endDate(endDate != null ? LocalDateTime.parse(endDate) : null)
                .build();
    }
}

