package com.bifos.accountbook.application.dto.income;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 수입 페이지네이션 응답 DTO
 * 프론트엔드 친화적인 구조로 변환
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomePaginationResponse {

    /**
     * 수입 목록
     */
    private List<IncomeResponse> incomes;

    /**
     * 전체 요소 수
     */
    private long totalElements;

    /**
     * 전체 페이지 수
     */
    private int totalPages;

    /**
     * 현재 페이지 (0-based)
     */
    private int currentPage;

    /**
     * Page 객체를 IncomePaginationResponse로 변환
     */
    public static IncomePaginationResponse from(Page<IncomeResponse> page) {
        return IncomePaginationResponse.builder()
                .incomes(page.getContent())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .currentPage(page.getNumber())
                .build();
    }
}

