package com.bifos.accountbook.budgetitem.infra.repository.jpa;

import com.bifos.accountbook.budgetitem.domain.entity.BudgetItem;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BudgetItemJpaRepository extends JpaRepository<BudgetItem, Long> {

  @Query(
      """
      SELECT b
      FROM BudgetItem b
      WHERE b.familyUuid = :familyUuid
      AND b.status = com.bifos.accountbook.budgetitem.domain.value.BudgetItemStatus.ACTIVE
      ORDER BY b.id ASC
      """)
  List<BudgetItem> findAllActiveByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid);

  @Query(
      """
      SELECT COUNT(b)
      FROM BudgetItem b
      WHERE b.familyUuid = :familyUuid
      AND b.status = com.bifos.accountbook.budgetitem.domain.value.BudgetItemStatus.ACTIVE
      """)
  long countActiveByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid);

  @Query(
      """
      SELECT COUNT(b) > 0
      FROM BudgetItem b
      WHERE b.familyUuid = :familyUuid
      AND b.name = :name
      AND b.status = com.bifos.accountbook.budgetitem.domain.value.BudgetItemStatus.ACTIVE
      """)
  boolean existsActiveByFamilyUuidAndName(
      @Param("familyUuid") CustomUuid familyUuid, @Param("name") String name);

  @Query(
      """
      SELECT b
      FROM BudgetItem b
      WHERE b.uuid = :uuid
      AND b.familyUuid = :familyUuid
      AND b.status = com.bifos.accountbook.budgetitem.domain.value.BudgetItemStatus.ACTIVE
      """)
  Optional<BudgetItem> findActiveByUuidAndFamilyUuid(
      @Param("uuid") CustomUuid uuid, @Param("familyUuid") CustomUuid familyUuid);
}
