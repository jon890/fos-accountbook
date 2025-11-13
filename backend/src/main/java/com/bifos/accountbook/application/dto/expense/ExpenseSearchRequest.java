package com.bifos.accountbook.application.dto.expense;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * 지출 검색 요청 DTO
 * 페이징 및 필터링 조건을 포함
 */
@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseSearchRequest {

  /**
   * 페이지 번호 (0-based)
   */
  private int page;

  /**
   * 페이지 크기
   */
  private int size;

  /**
   * 카테고리 UUID (선택사항)
   */
  private String categoryId;

  /**
   * 시작 날짜 (YYYY-MM-DD 형식, 선택사항)
   */
  private String startDate;

  /**
   * 종료 날짜 (YYYY-MM-DD 형식, 선택사항)
   */
  private String endDate;

  /**
   * 기본값 설정 메서드
   */
  public static ExpenseSearchRequest withDefaults(
      Integer page,
      Integer size,
      String categoryId,
      String startDate,
      String endDate) {
    return ExpenseSearchRequest.builder()
                               .page(page != null ? page : 0)
                               .size(size != null ? size : 20)
                               .categoryId(categoryId)
                               .startDate(startDate)
                               .endDate(endDate)
                               .build();
  }
}
