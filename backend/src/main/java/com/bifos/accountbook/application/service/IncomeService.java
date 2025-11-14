package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.category.CategoryResponse;
import com.bifos.accountbook.application.dto.income.CreateIncomeRequest;
import com.bifos.accountbook.application.dto.income.IncomeResponse;
import com.bifos.accountbook.application.dto.income.IncomeSearchRequest;
import com.bifos.accountbook.application.dto.income.UpdateIncomeRequest;
import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.Income;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.IncomeRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.FamilyUuid;
import com.bifos.accountbook.presentation.annotation.UserUuid;
import com.bifos.accountbook.presentation.annotation.ValidateFamilyAccess;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class IncomeService {

  private final IncomeRepository incomeRepository;
  private final CategoryService categoryService; // 카테고리 조회 (캐시 활용)
  private final UserService userService; // 사용자 조회
  private final FamilyValidationService familyValidationService;

  /**
   * 수입 생성
   */
  @Transactional
  public IncomeResponse createIncome(CustomUuid userUuid, CustomUuid familyUuid, CreateIncomeRequest request) {
    CustomUuid categoryCustomUuid = CustomUuid.from(request.getCategoryUuid());

    // 사용자 확인
    User user = userService.getUser(userUuid);

    // 권한 확인 + Family 엔티티 조회 (DB 조회 1번으로 최적화)
    var family = familyValidationService.validateAndGetFamily(userUuid, familyUuid);

    // 카테고리 확인 + 가족 소속 검증 (캐시 활용, DB 조회 없음)
    categoryService.validateAndFindCached(familyUuid, categoryCustomUuid);

    // 수입 생성 (ORM 편의 메서드 활용)
    Income income = family.addIncome(
        request.getAmount(),
        categoryCustomUuid,
        user.getUuid(),
        request.getDescription(),
        request.getDate() != null ? request.getDate() : LocalDateTime.now()
    );

    income = incomeRepository.save(income);

    return IncomeResponse.fromWithoutCategory(income);
  }

  /**
   * 가족의 수입 목록 조회 (페이징 + 필터링)
   * <p>
   * QueryDSL 동적 쿼리로 필터링을 처리하며, 카테고리 정보를 포함하여 응답합니다.
   * Repository 캐시를 활용하여 성능을 최적화합니다.
   */
  @ValidateFamilyAccess
  @Transactional(readOnly = true)
  public Page<IncomeResponse> getFamilyIncomes(@UserUuid CustomUuid userUuid,
                                               @FamilyUuid CustomUuid familyUuid,
                                               IncomeSearchRequest searchRequest) {
    // 페이징 설정
    Pageable pageable = PageRequest.of(
        searchRequest.getPage(),
        searchRequest.getSize(),
        Sort.by(Sort.Direction.DESC, "date"));

    // 카테고리 맵 생성 (Repository 캐시 활용)
    Map<String, CategoryResponse> categoryMap = categoryService.getFamilyCategories(userUuid, familyUuid)
                                                               .stream()
                                                               .collect(Collectors.toMap(
                                                                   CategoryResponse::getUuid,
                                                                   Function.identity()));

    // 필터 조건 변환
    CustomUuid categoryUuid = searchRequest.getCategoryUuid() != null
        ? CustomUuid.from(searchRequest.getCategoryUuid())
        : null;

    // QueryDSL이 null 조건을 자동으로 처리하므로 단일 메서드 호출
    Page<Income> incomes = incomeRepository.findByFamilyUuidWithFilters(
        familyUuid,
        categoryUuid,
        searchRequest.getStartDate(),
        searchRequest.getEndDate(),
        pageable);

    // 카테고리 정보를 포함하여 응답 생성
    return incomes.map(income -> {
      CategoryResponse category = categoryMap.get(income.getCategoryUuid().getValue());
      return IncomeResponse.from(income, category != null ? category.toCategoryInfo() : null);
    });
  }

  /**
   * 수입 상세 조회
   */
  @Transactional(readOnly = true)
  public IncomeResponse getIncome(CustomUuid userUuid, String incomeUuid) {
    CustomUuid incomeCustomUuid = CustomUuid.from(incomeUuid);

    Income income = incomeRepository.findActiveByUuid(incomeCustomUuid)
                                    .orElseThrow(() -> new BusinessException(ErrorCode.INCOME_NOT_FOUND)
                                        .addParameter("incomeUuid", incomeCustomUuid.getValue()));

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, income.getFamilyUuid());

    return IncomeResponse.fromWithoutCategory(income);
  }

  /**
   * 수입 수정
   */
  @Transactional
  public IncomeResponse updateIncome(CustomUuid userUuid, String incomeUuid, UpdateIncomeRequest request) {
    CustomUuid incomeCustomUuid = CustomUuid.from(incomeUuid);

    Income income = incomeRepository.findActiveByUuid(incomeCustomUuid)
                                    .orElseThrow(() -> new BusinessException(ErrorCode.INCOME_NOT_FOUND)
                                        .addParameter("incomeUuid", incomeCustomUuid.getValue()));

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, income.getFamilyUuid());

    // 카테고리 변경 검증 + 가족 소속 검증 (캐시 활용, DB 조회 없음)
    CustomUuid categoryCustomUuid = null;
    if (request.getCategoryUuid() != null) {
      categoryCustomUuid = CustomUuid.from(request.getCategoryUuid());
      categoryService.validateAndFindCached(income.getFamilyUuid(), categoryCustomUuid);
    }

    // 수입 정보 업데이트
    income.update(
        categoryCustomUuid,
        request.getAmount(),
        request.getDescription(),
        request.getDate()
    );

    return IncomeResponse.fromWithoutCategory(income);
  }

  /**
   * 수입 삭제 (Soft Delete)
   */
  @Transactional
  public void deleteIncome(CustomUuid userUuid, String incomeUuid) {
    CustomUuid incomeCustomUuid = CustomUuid.from(incomeUuid);

    Income income = incomeRepository.findActiveByUuid(incomeCustomUuid)
                                    .orElseThrow(() -> new BusinessException(ErrorCode.INCOME_NOT_FOUND)
                                        .addParameter("incomeUuid", incomeCustomUuid.getValue()));

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, income.getFamilyUuid());

    income.delete();
  }
}

