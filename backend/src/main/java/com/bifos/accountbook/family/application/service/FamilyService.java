package com.bifos.accountbook.family.application.service;

import com.bifos.accountbook.shared.aop.FamilyValidationService;

import com.bifos.accountbook.family.application.dto.CreateFamilyRequest;
import com.bifos.accountbook.family.application.dto.FamilyResponse;
import com.bifos.accountbook.family.application.dto.UpdateFamilyRequest;
import com.bifos.accountbook.shared.exception.BusinessException;
import com.bifos.accountbook.shared.exception.ErrorCode;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.family.domain.entity.FamilyMember;
import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.family.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.family.domain.repository.FamilyRepository;
import com.bifos.accountbook.category.application.service.CategoryService;
import com.bifos.accountbook.user.application.service.UserProfileService;
import com.bifos.accountbook.user.application.service.UserService;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.family.domain.value.FamilyMemberRole;
import com.bifos.accountbook.shared.aop.FamilyUuid;
import com.bifos.accountbook.shared.aop.UserUuid;
import com.bifos.accountbook.shared.aop.ValidateFamilyAccess;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FamilyService {

  private final FamilyRepository familyRepository;
  private final FamilyMemberRepository familyMemberRepository;
  private final UserService userService; // 사용자 조회
  private final CategoryService categoryService;
  private final FamilyValidationService familyValidationService;
  private final UserProfileService userProfileService;

  /**
   * 가족 생성 (생성자를 owner로 자동 추가 + 기본 카테고리 생성)
   * 첫 가족 생성 시 자동으로 기본 가족으로 설정
   */
  @Transactional
  public FamilyResponse createFamily(CustomUuid userUuid, CreateFamilyRequest request) {
    // 사용자 조회
    User user = userService.getUser(userUuid);

    // 가족 생성
    Family family = Family.builder()
                          .name(request.getName())
                          .monthlyBudget(request.getMonthlyBudget() != null ? request.getMonthlyBudget() : BigDecimal.ZERO)
                          .build();

    family = familyRepository.save(family);

    // 생성자를 owner로 추가
    FamilyMember member = FamilyMember.builder()
                                      .familyUuid(family.getUuid())
                                      .userUuid(user.getUuid())
                                      .role(FamilyMemberRole.OWNER)
                                      .build();

    familyMemberRepository.save(member);

    // 기본 카테고리 생성 (CategoryService에 위임)
    categoryService.createDefaultCategoriesForFamily(family.getUuid());

    // 첫 가족인 경우 자동으로 기본 가족으로 설정
    int userFamilyCount = familyMemberRepository.countByUserUuid(userUuid);
    if (userFamilyCount == 1) {
      userProfileService.setDefaultFamily(userUuid, family.getUuid().getValue());
    }

    // memberCount 포함해서 반환 (방금 생성했으므로 1명)
    return FamilyResponse.fromWithMemberCount(family, 1);
  }

  /**
   * 사용자가 속한 가족 목록 조회
   */
  public List<FamilyResponse> getUserFamilies(CustomUuid userUuid) {
    User user = userService.getUser(userUuid);

    return familyRepository.findFamiliesWithCountsByUserUuid(user.getUuid())
                            .stream()
                            .map(FamilyResponse::fromProjection)
                            .toList();
  }

  /**
   * 가족 상세 조회
   */
  @ValidateFamilyAccess
  public FamilyResponse getFamily(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid) {
    Family family = familyRepository.findActiveByUuid(familyUuid)
                                    .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                                        .addParameter("familyUuid", familyUuid.getValue()));

    int memberCount = familyMemberRepository.countByFamilyUuid(familyUuid);
    return FamilyResponse.fromWithMemberCount(family, memberCount);
  }

  /**
   * 가족 정보 수정
   */
  @Transactional
  public FamilyResponse updateFamily(CustomUuid userUuid, CustomUuid familyUuid, UpdateFamilyRequest request) {
    // 권한 확인 (owner만 수정 가능)
    validateFamilyOwner(userUuid, familyUuid);

    Family family = familyRepository.findActiveByUuid(familyUuid)
                                    .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                                        .addParameter("familyUuid", familyUuid.getValue()));

    family.updateName(request.getName());

    // monthlyBudget이 제공된 경우에만 업데이트
    if (request.getMonthlyBudget() != null) {
      family.updateMonthlyBudget(request.getMonthlyBudget());
    }

    int memberCount = familyMemberRepository.countByFamilyUuid(familyUuid);
    return FamilyResponse.fromWithMemberCount(family, memberCount);
  }

  /**
   * 가족 삭제 (Soft Delete)
   */
  @Transactional
  public void deleteFamily(CustomUuid userUuid, CustomUuid familyUuid) {
    // 권한 확인 (owner만 삭제 가능)
    validateFamilyOwner(userUuid, familyUuid);

    Family family = familyRepository.findActiveByUuid(familyUuid)
                                    .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                                        .addParameter("familyUuid", familyUuid.getValue()));

    family.delete();
    // 더티 체킹으로 자동 업데이트

    log.info("Deleted family: {} by user: {}", familyUuid, userUuid);
  }

  /**
   * 가족 접근 권한 확인
   * FamilyValidationService로 위임
   */
  private void validateFamilyAccess(CustomUuid userUuid, CustomUuid familyUuid) {
    familyValidationService.validateFamilyAccess(userUuid, familyUuid);
  }

  /**
   * 가족 소유자 권한 확인
   * FamilyValidationService로 위임
   */
  private void validateFamilyOwner(CustomUuid userUuid, CustomUuid familyUuid) {
    familyValidationService.validateFamilyOwner(userUuid, familyUuid);
  }
}
