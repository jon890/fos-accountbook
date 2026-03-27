package com.bifos.accountbook.domain.repository.projection;

import com.bifos.accountbook.domain.value.CustomUuid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 가족 정보 + 멤버/지출/카테고리 카운트 프로젝션
 * FamilyRepository.findFamiliesWithCountsByUserUuid 단일 쿼리 결과에 사용
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyWithCountsProjection {

  private CustomUuid uuid;
  private String name;
  private BigDecimal monthlyBudget;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private long memberCount;
  private long expenseCount;
  private long categoryCount;
}
