package com.bifos.accountbook.installment.application.service;

import com.bifos.accountbook.family.application.access.FamilyUuid;
import com.bifos.accountbook.family.application.access.UserUuid;
import com.bifos.accountbook.family.application.access.ValidateFamilyAccess;
import com.bifos.accountbook.installment.application.dto.InstallmentRequest;
import com.bifos.accountbook.installment.application.dto.InstallmentResponse;
import com.bifos.accountbook.installment.domain.entity.Installment;
import com.bifos.accountbook.installment.domain.repository.InstallmentRepository;
import com.bifos.accountbook.shared.exception.BusinessException;
import com.bifos.accountbook.shared.exception.ErrorCode;
import com.bifos.accountbook.shared.utils.BusinessTime;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 할부 관리. 권한은 가족 구성원 누구나다 (ADR-B27). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstallmentService {

  private static final int MAX_NAME_LENGTH = 50;

  private final InstallmentRepository installmentRepository;
  private final Clock clock;

  @ValidateFamilyAccess
  public List<InstallmentResponse> getInstallments(
      @UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid) {
    YearMonth currentMonth = currentMonth();
    return installmentRepository.findAllActiveByFamilyUuid(familyUuid).stream()
        .map(item -> InstallmentResponse.from(item, item.scheduleAt(currentMonth)))
        .toList();
  }

  @ValidateFamilyAccess
  @Transactional
  public InstallmentResponse createInstallment(
      @UserUuid CustomUuid userUuid,
      @FamilyUuid CustomUuid familyUuid,
      InstallmentRequest request) {
    String name = normalizeName(request.getName());
    validateAmount(request);

    Installment saved =
        installmentRepository.save(
            Installment.builder()
                .familyUuid(familyUuid)
                .userUuid(userUuid)
                .name(name)
                .totalAmount(request.getTotalAmount())
                .installmentMonths(request.getInstallmentMonths())
                .startMonth(request.getStartMonth())
                .memo(normalizeMemo(request.getMemo()))
                .build());
    return toResponse(saved);
  }

  @ValidateFamilyAccess
  @Transactional
  public InstallmentResponse updateInstallment(
      @UserUuid CustomUuid userUuid,
      @FamilyUuid CustomUuid familyUuid,
      CustomUuid installmentUuid,
      InstallmentRequest request) {
    Installment installment = findActiveInstallment(familyUuid, installmentUuid);
    String name = normalizeName(request.getName());
    validateAmount(request);

    installment.update(
        name,
        request.getTotalAmount(),
        request.getInstallmentMonths(),
        request.getStartMonth(),
        normalizeMemo(request.getMemo()));
    return toResponse(installmentRepository.save(installment));
  }

  @ValidateFamilyAccess
  @Transactional
  public void deleteInstallment(
      @UserUuid CustomUuid userUuid,
      @FamilyUuid CustomUuid familyUuid,
      CustomUuid installmentUuid) {
    Installment installment = findActiveInstallment(familyUuid, installmentUuid);
    installment.delete();
    installmentRepository.save(installment);
  }

  private InstallmentResponse toResponse(Installment installment) {
    return InstallmentResponse.from(installment, installment.scheduleAt(currentMonth()));
  }

  private YearMonth currentMonth() {
    return YearMonth.now(clock.withZone(BusinessTime.ZONE));
  }

  /** 앞뒤 공백을 뺀 이름이 비었거나 50자를 넘으면 거부한다. */
  private String normalizeName(String rawName) {
    String name = rawName.trim();
    if (name.isEmpty() || name.length() > MAX_NAME_LENGTH) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "할부 이름은 공백을 뺀 1~50자여야 합니다");
    }
    return name;
  }

  /** 총 금액이 개월 수보다 작으면 월 납부액이 0원이 되므로 거부한다. */
  private void validateAmount(InstallmentRequest request) {
    if (request.getTotalAmount().compareTo(BigDecimal.valueOf(request.getInstallmentMonths()))
        < 0) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "총 금액은 할부 개월 수 이상이어야 합니다");
    }
  }

  private String normalizeMemo(String rawMemo) {
    if (rawMemo == null) {
      return null;
    }
    String memo = rawMemo.trim();
    return memo.isEmpty() ? null : memo;
  }

  private Installment findActiveInstallment(CustomUuid familyUuid, CustomUuid installmentUuid) {
    return installmentRepository
        .findActiveByUuidAndFamilyUuid(installmentUuid, familyUuid)
        .orElseThrow(
            () ->
                new BusinessException(ErrorCode.INSTALLMENT_NOT_FOUND)
                    .addParameter("installmentUuid", installmentUuid.getValue()));
  }
}
