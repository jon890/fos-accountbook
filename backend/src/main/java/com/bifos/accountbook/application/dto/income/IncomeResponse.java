package com.bifos.accountbook.application.dto.income;

import com.bifos.accountbook.application.dto.common.CategoryInfo;
import com.bifos.accountbook.domain.entity.Income;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomeResponse {

    private String uuid;
    private String familyUuid;
    private String categoryUuid;
    private CategoryInfo category;
    private BigDecimal amount;
    private String description;
    private LocalDateTime date;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Income 엔티티로부터 응답 생성 (카테고리 정보 포함)
     * 
     * @param income 수입 엔티티
     * @param category 카테고리 정보 (CategoryService의 캐시에서 조회)
     * @return IncomeResponse
     */
    public static IncomeResponse from(Income income, CategoryInfo category) {
        return IncomeResponse.builder()
                .uuid(income.getUuid().getValue())
                .familyUuid(income.getFamilyUuid().getValue())
                .categoryUuid(income.getCategoryUuid().getValue())
                .category(category)
                .amount(income.getAmount())
                .description(income.getDescription())
                .date(income.getDate())
                .createdAt(income.getCreatedAt())
                .updatedAt(income.getUpdatedAt())
                .build();
    }

    /**
     * Income 엔티티로부터 응답 생성 (카테고리 정보 제외)
     * 
     * @param income 수입 엔티티
     * @return IncomeResponse
     */
    public static IncomeResponse fromWithoutCategory(Income income) {
        return IncomeResponse.builder()
                .uuid(income.getUuid().getValue())
                .familyUuid(income.getFamilyUuid().getValue())
                .categoryUuid(income.getCategoryUuid().getValue())
                .amount(income.getAmount())
                .description(income.getDescription())
                .date(income.getDate())
                .createdAt(income.getCreatedAt())
                .updatedAt(income.getUpdatedAt())
                .build();
    }
}

