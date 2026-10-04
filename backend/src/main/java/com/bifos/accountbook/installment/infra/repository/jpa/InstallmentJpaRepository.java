package com.bifos.accountbook.installment.infra.repository.jpa;

import com.bifos.accountbook.installment.domain.entity.Installment;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InstallmentJpaRepository extends JpaRepository<Installment, Long> {

  @Query(
      """
      SELECT i
      FROM Installment i
      WHERE i.familyUuid = :familyUuid
      AND i.status = com.bifos.accountbook.installment.domain.value.InstallmentStatus.ACTIVE
      ORDER BY i.startMonth ASC, i.id ASC
      """)
  List<Installment> findAllActiveByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid);

  @Query(
      """
      SELECT i
      FROM Installment i
      WHERE i.uuid = :uuid
      AND i.familyUuid = :familyUuid
      AND i.status = com.bifos.accountbook.installment.domain.value.InstallmentStatus.ACTIVE
      """)
  Optional<Installment> findActiveByUuidAndFamilyUuid(
      @Param("uuid") CustomUuid uuid, @Param("familyUuid") CustomUuid familyUuid);
}
