package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.expense.CreateExpenseRequest;
import com.bifos.accountbook.application.dto.expense.ExpenseResponse;
import com.bifos.accountbook.application.dto.expense.ExpenseSearchRequest;
import com.bifos.accountbook.application.dto.expense.UpdateExpenseRequest;
import com.bifos.accountbook.application.event.ExpenseCreatedEvent;
import com.bifos.accountbook.application.event.ExpenseUpdatedEvent;
import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.FamilyUuid;
import com.bifos.accountbook.presentation.annotation.UserUuid;
import com.bifos.accountbook.presentation.annotation.ValidateFamilyAccess;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpenseService {

  private final ExpenseRepository expenseRepository;
  private final CategoryRepository categoryRepository;
  private final CategoryService categoryService; // 카테고리 조회 (캐시 활용)
  private final UserService userService; // 사용자 조회
  private final FamilyValidationService familyValidationService; // 가족 검증 로직
  private final ApplicationEventPublisher eventPublisher; // 이벤트 발행

  /**
   * 특정 카테고리의 모든 지출을 가족의 기본 카테고리로 이동
   * CategoryService에서 카테고리 삭제 시 호출됨
   */
  @Transactional
  public void moveExpensesToDefaultCategory(CustomUuid familyUuid, CustomUuid oldCategoryUuid) {
    // 기본 카테고리(미분류) 조회 또는 생성
    Category defaultCategory = categoryRepository.getDefaultCategoryByFamily(familyUuid)
        .orElseGet(() -> {
          log.warn("Default category not found for family: {}. Creating new one.", familyUuid.getValue());
          Category newDefault = Category.builder()
                                        .familyUuid(familyUuid)
                                        .name("미분류")
                                        .color("#9ca3af")
                                        .icon("📂")
                                        .isDefault(true)
                                        .build();
          return categoryRepository.save(newDefault);
        });

    // 지출 이동
    expenseRepository.moveExpenses(oldCategoryUuid, defaultCategory.getUuid());
    log.info("Moved expenses from category {} to default category {}", oldCategoryUuid, defaultCategory.getUuid());
  }

  /**
   * 지출 생성
   */
  @Transactional
  public ExpenseResponse createExpense(CustomUuid userUuid, CustomUuid familyUuid, CreateExpenseRequest request) {
    CustomUuid categoryCustomUuid = CustomUuid.from(request.getCategoryUuid());

    // 사용자 확인
    User user = userService.getUser(userUuid);

    // 권한 확인 + Family 엔티티 조회 (DB 조회 1번으로 최적화)
    var family = familyValidationService.validateAndGetFamily(userUuid, familyUuid);

    // 카테고리 확인 + 가족 소속 검증 (캐시 활용, DB 조회 없음)
    categoryService.validateAndFindCached(familyUuid, categoryCustomUuid);

    // 지출 생성 (ORM 편의 메서드 활용)
    Expense expense = family.addExpense(
        request.getAmount(),
        categoryCustomUuid,
        user.getUuid(),
        request.getDescription(),
        request.getDate() != null ? request.getDate() : LocalDateTime.now()
    );

    // 예산 제외 플래그 설정
    if (request.getExcludeFromBudget() != null) {
      expense.setExcludeFromBudget(request.getExcludeFromBudget());
    }

    expense = expenseRepository.save(expense);

    // 이벤트 발행 - 예산 알림 체크를 트리거
    eventPublisher.publishEvent(new ExpenseCreatedEvent(
        expense.getUuid(),
        expense.getFamilyUuid(),
        expense.getUserUuid(),
        expense.getAmount(),
        expense.getDate()
    ));

    return ExpenseResponse.fromWithoutCategory(expense);
  }

  /**
   * 가족의 지출 목록 조회 (페이징)
   */
  public Page<ExpenseResponse> getFamilyExpenses(CustomUuid userUuid, CustomUuid familyUuid, int page, int size) {
    ExpenseSearchRequest searchRequest = ExpenseSearchRequest.builder()
                                                             .page(page)
                                                             .size(size)
                                                             .build();
    return getFamilyExpenses(userUuid, familyUuid, searchRequest);
  }

  /**
   * 가족의 지출 목록 조회 (페이징 + 필터링)
   * <p>
   * QueryDSL 동적 쿼리로 필터링을 처리합니다.
   */
  @ValidateFamilyAccess
  public Page<ExpenseResponse> getFamilyExpenses(
      @UserUuid CustomUuid userUuid,
      @FamilyUuid CustomUuid familyUuid,
      ExpenseSearchRequest searchRequest) {

    // 필터 파라미터 변환
    CustomUuid categoryUuid = null;
    if (searchRequest.getCategoryId() != null && !searchRequest.getCategoryId().isEmpty()) {
      categoryUuid = CustomUuid.from(searchRequest.getCategoryId());
    }

    LocalDateTime startDateTime = null;
    if (searchRequest.getStartDate() != null && !searchRequest.getStartDate().isEmpty()) {
      try {
        startDateTime = LocalDateTime.parse(searchRequest.getStartDate() + "T00:00:00");
      } catch (Exception e) {
        log.warn("Invalid startDate format: {}", searchRequest.getStartDate());
      }
    }

    LocalDateTime endDateTime = null;
    if (searchRequest.getEndDate() != null && !searchRequest.getEndDate().isEmpty()) {
      try {
        endDateTime = LocalDateTime.parse(searchRequest.getEndDate() + "T23:59:59");
      } catch (Exception e) {
        log.warn("Invalid endDate format: {}", searchRequest.getEndDate());
      }
    }

    // 페이징 설정
    Pageable pageable = PageRequest.of(
        searchRequest.getPage(),
        searchRequest.getSize(),
        Sort.by(Sort.Direction.DESC, "date"));

    // QueryDSL이 null 조건을 자동으로 처리하므로 단일 메서드 호출
    Page<Expense> expenses = expenseRepository.findByFamilyUuidWithFilters(
        familyUuid,
        categoryUuid,
        startDateTime,
        endDateTime,
        pageable);

    return expenses.map(ExpenseResponse::fromWithoutCategory);
  }

  /**
   * 지출 상세 조회
   */
  public ExpenseResponse getExpense(CustomUuid userUuid, CustomUuid familyUuid, String expenseUuid) {
    CustomUuid expenseCustomUuid = CustomUuid.from(expenseUuid);

    Expense expense = expenseRepository.findActiveByUuid(expenseCustomUuid)
                                       .orElseThrow(() -> new BusinessException(ErrorCode.EXPENSE_NOT_FOUND)
                                           .addParameter("expenseUuid", expenseCustomUuid.getValue()));

    // URL familyUuid와 지출의 familyUuid 일치 여부 검증 (IDOR 방지)
    if (!expense.getFamilyUuid().equals(familyUuid)) {
      throw new BusinessException(ErrorCode.ACCESS_DENIED);
    }

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, expense.getFamilyUuid());

    return ExpenseResponse.fromWithoutCategory(expense);
  }

  /**
   * 지출 수정
   */
  @Transactional
  public ExpenseResponse updateExpense(
      CustomUuid userUuid, CustomUuid familyUuid, String expenseUuid, UpdateExpenseRequest request) {
    CustomUuid expenseCustomUuid = CustomUuid.from(expenseUuid);

    Expense expense = expenseRepository.findActiveByUuid(expenseCustomUuid)
                                       .orElseThrow(() -> new BusinessException(ErrorCode.EXPENSE_NOT_FOUND)
                                           .addParameter("expenseUuid", expenseCustomUuid.getValue()));

    // URL familyUuid와 지출의 familyUuid 일치 여부 검증 (IDOR 방지)
    if (!expense.getFamilyUuid().equals(familyUuid)) {
      throw new BusinessException(ErrorCode.ACCESS_DENIED);
    }

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, expense.getFamilyUuid());

    // 카테고리 변경 검증 + 가족 소속 검증 (캐시 활용, DB 조회 없음)
    CustomUuid categoryCustomUuid = null;
    if (request.getCategoryUuid() != null) {
      categoryCustomUuid = CustomUuid.from(request.getCategoryUuid());
      categoryService.validateAndFindCached(expense.getFamilyUuid(), categoryCustomUuid);
    }

    // 이벤트 발행을 위해 기존 금액 저장
    BigDecimal oldAmount = expense.getAmount();

    // 지출 정보 업데이트
    expense.update(
        categoryCustomUuid,
        request.getAmount(),
        request.getDescription(),
        request.getDate()
    );

    // 예산 제외 플래그 업데이트
    if (request.getExcludeFromBudget() != null) {
      expense.setExcludeFromBudget(request.getExcludeFromBudget());
    }

    // 이벤트 발행 - 금액이 변경된 경우 예산 알림 체크를 트리거
    if (request.getAmount() != null && !oldAmount.equals(request.getAmount())) {
      eventPublisher.publishEvent(new ExpenseUpdatedEvent(
          expense.getUuid(),
          expense.getFamilyUuid(),
          expense.getUserUuid(),
          expense.getAmount(),
          oldAmount,
          expense.getDate()
      ));
    }

    return ExpenseResponse.fromWithoutCategory(expense);
  }

  /**
   * 지출 삭제 (Soft Delete)
   */
  @Transactional
  public void deleteExpense(CustomUuid userUuid, CustomUuid familyUuid, String expenseUuid) {
    CustomUuid expenseCustomUuid = CustomUuid.from(expenseUuid);

    Expense expense = expenseRepository.findActiveByUuid(expenseCustomUuid)
                                       .orElseThrow(() -> new BusinessException(ErrorCode.EXPENSE_NOT_FOUND)
                                           .addParameter("expenseUuid", expenseCustomUuid.getValue()));

    // URL familyUuid와 지출의 familyUuid 일치 여부 검증 (IDOR 방지)
    if (!expense.getFamilyUuid().equals(familyUuid)) {
      throw new BusinessException(ErrorCode.ACCESS_DENIED);
    }

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, expense.getFamilyUuid());

    expense.delete();
  }
}
