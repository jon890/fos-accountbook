package com.bifos.accountbook.family.domain.repository.projection;

import com.bifos.accountbook.shared.value.CustomUuid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 가족 정보 + 멤버/지출/카테고리 카운트 프로젝션
 * FamilyRepository.findFamiliesWithCountsByUserUuid 단일 쿼리 결과에 사용
 */
@Getter
@AllArgsConstructor
public class FamilyWithCountsProjection {

  private CustomUuid uuid;
  private String name;
  private BigDecimal monthlyBudget;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private long memberCount;
  /** 전체 활성 지출 수 (예산 제외 여부와 무관, 표시용) */
  private long expenseCount;
  private long categoryCount;
}
