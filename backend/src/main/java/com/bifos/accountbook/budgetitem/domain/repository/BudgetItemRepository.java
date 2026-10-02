package com.bifos.accountbook.budgetitem.domain.repository;

import com.bifos.accountbook.budgetitem.domain.entity.BudgetItem;
import com.bifos.accountbook.budgetitem.domain.entity.BudgetItemCategory;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BudgetItemRepository {

  BudgetItem save(BudgetItem budgetItem);

  /** 가족의 ACTIVE 항목을 만든 순서(id 오름차순)로 준다. */
  List<BudgetItem> findAllActiveByFamilyUuid(CustomUuid familyUuid);

  long countActiveByFamilyUuid(CustomUuid familyUuid);

  boolean existsActiveByFamilyUuidAndName(CustomUuid familyUuid, String name);

  Optional<BudgetItem> findActiveByUuidAndFamilyUuid(CustomUuid uuid, CustomUuid familyUuid);

  List<BudgetItemCategory> findCategoriesByBudgetItemUuids(Collection<CustomUuid> budgetItemUuids);

  List<BudgetItemCategory> findCategoriesByCategoryUuids(Collection<CustomUuid> categoryUuids);

  void saveCategories(Collection<BudgetItemCategory> categories);

  /** 항목의 카테고리 행을 DB 에 즉시 반영해 지운다. 같은 트랜잭션에서 다시 넣어도 유니크 키에 걸리지 않는다. */
  void deleteCategoriesByBudgetItemUuid(CustomUuid budgetItemUuid);

  /** 카테고리가 속한 항목의 행을 지운다. 카테고리를 삭제할 때 쓴다. */
  void deleteCategoriesByCategoryUuid(CustomUuid categoryUuid);
}
