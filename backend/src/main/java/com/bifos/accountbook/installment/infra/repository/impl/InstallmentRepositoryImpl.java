package com.bifos.accountbook.installment.infra.repository.impl;

import com.bifos.accountbook.installment.domain.entity.Installment;
import com.bifos.accountbook.installment.domain.repository.InstallmentRepository;
import com.bifos.accountbook.installment.infra.repository.jpa.InstallmentJpaRepository;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class InstallmentRepositoryImpl implements InstallmentRepository {

  private final InstallmentJpaRepository jpaRepository;

  @Override
  public Installment save(Installment installment) {
    return jpaRepository.save(installment);
  }

  @Override
  public List<Installment> findAllActiveByFamilyUuid(CustomUuid familyUuid) {
    return jpaRepository.findAllActiveByFamilyUuid(familyUuid);
  }

  @Override
  public Optional<Installment> findActiveByUuidAndFamilyUuid(
      CustomUuid uuid, CustomUuid familyUuid) {
    return jpaRepository.findActiveByUuidAndFamilyUuid(uuid, familyUuid);
  }
}
