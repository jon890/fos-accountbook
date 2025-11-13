package com.bifos.accountbook.application.dto.common;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

/**
 * 공통 페이지네이션 응답 DTO
 * 프론트엔드 친화적인 구조로 변환
 *
 * @param <T> 응답 데이터 타입
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaginationResponse<T> {

  /**
   * 데이터 목록
   */
  private List<T> items;

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
   * Page 객체를 PaginationResponse로 변환
   *
   * @param page Spring Data JPA Page 객체
   * @param <T>  응답 데이터 타입
   * @return PaginationResponse 객체
   */
  public static <T> PaginationResponse<T> from(Page<T> page) {
    return PaginationResponse.<T>builder()
                             .items(page.getContent())
                             .totalElements(page.getTotalElements())
                             .totalPages(page.getTotalPages())
                             .currentPage(page.getNumber())
                             .build();
  }
}

