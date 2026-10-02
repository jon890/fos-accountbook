package com.bifos.accountbook.budgetitem.infra.repository.impl;

import com.bifos.accountbook.budgetitem.domain.entity.BudgetItem;
import com.bifos.accountbook.budgetitem.domain.entity.BudgetItemCategory;
import com.bifos.accountbook.budgetitem.domain.repository.BudgetItemRepository;
import com.bifos.accountbook.budgetitem.infra.repository.jpa.BudgetItemCategoryJpaRepository;
import com.bifos.accountbook.budgetitem.infra.repository.jpa.BudgetItemJpaRepository;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class BudgetItemRepositoryImpl implements BudgetItemRepository {

  private final BudgetItemJpaRepository jpaRepository;
  private final BudgetItemCategoryJpaRepository categoryJpaRepository;

  @Override
  public BudgetItem save(BudgetItem budgetItem) {
    return jpaRepository.save(budgetItem);
  }

  @Override
  public List<BudgetItem> findAllActiveByFamilyUuid(CustomUuid familyUuid) {
    return jpaRepository.findAllActiveByFamilyUuid(familyUuid);
  }

  @Override
  public long countActiveByFamilyUuid(CustomUuid familyUuid) {
    return jpaRepository.countActiveByFamilyUuid(familyUuid);
  }

  @Override
  public boolean existsActiveByFamilyUuidAndName(CustomUuid familyUuid, String name) {
    return jpaRepository.existsActiveByFamilyUuidAndName(familyUuid, name);
  }

  @Override
  public Optional<BudgetItem> findActiveByUuidAndFamilyUuid(
      CustomUuid uuid, CustomUuid familyUuid) {
    return jpaRepository.findActiveByUuidAndFamilyUuid(uuid, familyUuid);
  }

  @Override
  public List<BudgetItemCategory> findCategoriesByBudgetItemUuids(
      Collection<CustomUuid> budgetItemUuids) {
    if (budgetItemUuids.isEmpty()) {
      return List.of();
    }
    return categoryJpaRepository.findAllByBudgetItemUuids(budgetItemUuids);
  }

  @Override
  public List<BudgetItemCategory> findCategoriesByCategoryUuids(
      Collection<CustomUuid> categoryUuids) {
    if (categoryUuids.isEmpty()) {
      return List.of();
    }
    return categoryJpaRepository.findAllByCategoryUuids(categoryUuids);
  }

  @Override
  public void saveCategories(Collection<BudgetItemCategory> categories) {
    categoryJpaRepository.saveAllAndFlush(categories);
  }

  @Override
  public void deleteCategoriesByBudgetItemUuid(CustomUuid budgetItemUuid) {
    categoryJpaRepository.deleteAllByBudgetItemUuid(budgetItemUuid);
  }
}
