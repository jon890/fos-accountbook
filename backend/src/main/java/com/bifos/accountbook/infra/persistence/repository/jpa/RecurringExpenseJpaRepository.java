package com.bifos.accountbook.infra.persistence.repository.jpa;

import com.bifos.accountbook.domain.entity.RecurringExpense;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecurringExpenseJpaRepository extends JpaRepository<RecurringExpense, Long> {

  @Query("""
      SELECT r
      FROM RecurringExpense r
      WHERE r.uuid = :uuid
      AND r.status = com.bifos.accountbook.domain.entity.RecurringExpenseStatus.ACTIVE
      """)
  Optional<RecurringExpense> findActiveByUuid(@Param("uuid") CustomUuid uuid);
}
