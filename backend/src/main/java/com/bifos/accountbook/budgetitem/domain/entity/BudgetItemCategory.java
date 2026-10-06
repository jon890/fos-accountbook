package com.bifos.accountbook.budgetitem.domain.entity;

import com.bifos.accountbook.shared.value.CustomUuid;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 예산 항목이 세는 지출 카테고리. status 가 없고, 묶음에서 빠지면 행을 실제로 지운다 (ADR-B25). */
@Entity
@Table(
    name = "budget_item_categories",
    indexes = {@Index(name = "idx_budget_item_categories_item", columnList = "budget_item_uuid")})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetItemCategory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "budget_item_uuid", nullable = false, length = 36)
  private CustomUuid budgetItemUuid;

  @Column(name = "category_uuid", nullable = false, unique = true, length = 36)
  private CustomUuid categoryUuid;
}
