package com.bifos.accountbook.recurring.infra.repository.jpa;

import com.bifos.accountbook.recurring.domain.entity.RecurringExpense;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecurringExpenseJpaRepository extends JpaRepository<RecurringExpense, Long> {

  @Query("""
      SELECT r
      FROM RecurringExpense r
      WHERE r.uuid = :uuid
      AND r.status = com.bifos.accountbook.recurring.domain.value.RecurringExpenseStatus.ACTIVE
      """)
  Optional<RecurringExpense> findActiveByUuid(@Param("uuid") CustomUuid uuid);
}
