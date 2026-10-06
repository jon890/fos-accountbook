package com.bifos.accountbook.installment.domain.repository;

import com.bifos.accountbook.installment.domain.entity.Installment;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.util.List;
import java.util.Optional;

public interface InstallmentRepository {

  Installment save(Installment installment);

  /** 가족의 ACTIVE 할부를 첫 결제 월 오름차순, 같으면 id 오름차순으로 준다. */
  List<Installment> findAllActiveByFamilyUuid(CustomUuid familyUuid);

  Optional<Installment> findActiveByUuidAndFamilyUuid(CustomUuid uuid, CustomUuid familyUuid);
}
