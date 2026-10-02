package com.bifos.accountbook.budgetitem.infra.repository.jpa;

import com.bifos.accountbook.budgetitem.domain.entity.BudgetItemCategory;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BudgetItemCategoryJpaRepository extends JpaRepository<BudgetItemCategory, Long> {

  @Query(
      """
      SELECT c
      FROM BudgetItemCategory c
      WHERE c.budgetItemUuid IN :budgetItemUuids
      ORDER BY c.id ASC
      """)
  List<BudgetItemCategory> findAllByBudgetItemUuids(
      @Param("budgetItemUuids") Collection<CustomUuid> budgetItemUuids);

  @Query(
      """
      SELECT c
      FROM BudgetItemCategory c
      WHERE c.categoryUuid IN :categoryUuids
      """)
  List<BudgetItemCategory> findAllByCategoryUuids(
      @Param("categoryUuids") Collection<CustomUuid> categoryUuids);

  // 파생 삭제는 엔티티를 지연 삭제해 뒤따르는 INSERT 보다 늦게 반영될 수 있어 JPQL 로 즉시 지운다
  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("DELETE FROM BudgetItemCategory c WHERE c.budgetItemUuid = :budgetItemUuid")
  int deleteAllByBudgetItemUuid(@Param("budgetItemUuid") CustomUuid budgetItemUuid);
}
