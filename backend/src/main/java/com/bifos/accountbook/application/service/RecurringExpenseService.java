package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.category.CategoryResponse;
import com.bifos.accountbook.application.dto.common.CategoryInfo;
import com.bifos.accountbook.application.dto.recurringexpense.RecurringExpenseDto;
import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.RecurringExpense;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.RecurringExpenseRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.FamilyUuid;
import com.bifos.accountbook.presentation.annotation.UserUuid;
import com.bifos.accountbook.presentation.annotation.ValidateFamilyAccess;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecurringExpenseService {

  private static final DateTimeFormatter YEAR_MONTH_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM");

  private final RecurringExpenseRepository recurringExpenseRepository;
  private final CategoryRepository categoryRepository;
  private final CategoryService categoryService;

  @ValidateFamilyAccess
  @Transactional
  public RecurringExpenseDto.Response create(
      @UserUuid CustomUuid userUuid,
      @FamilyUuid CustomUuid familyUuid,
      RecurringExpenseDto.Create dto) {

    validateDayOfMonth(dto.getDayOfMonth());

    CustomUuid categoryCustomUuid = CustomUuid.from(dto.getCategoryUuid());
    CategoryResponse categoryResponse =
        categoryService.validateAndFindCached(familyUuid, categoryCustomUuid);

    RecurringExpense entity = RecurringExpense.builder()
        .familyUuid(familyUuid.getValue())
        .categoryUuid(dto.getCategoryUuid())
        .userUuid(userUuid.getValue())
        .name(dto.getName())
        .amount(dto.getAmount())
        .dayOfMonth(dto.getDayOfMonth())
        .build();

    entity = recurringExpenseRepository.save(entity);

    String currentYearMonth = LocalDate.now().format(YEAR_MONTH_FORMATTER);
    boolean generated = recurringExpenseRepository
        .existsByRecurringExpenseUuidAndYearMonth(
            entity.getUuid().getValue(), currentYearMonth);

    return RecurringExpenseDto.Response.from(entity, generated,
        categoryResponse.toCategoryInfo());
  }

  @ValidateFamilyAccess
  public List<RecurringExpenseDto.Response> getAll(
      @UserUuid CustomUuid userUuid,
      @FamilyUuid CustomUuid familyUuid,
      String yearMonth) {

    List<RecurringExpense> entities =
        recurringExpenseRepository.findAllActiveByFamilyUuid(familyUuid.getValue());

    // 카테고리 맵 생성 (캐시 활용)
    Map<String, CategoryInfo> categoryMap =
        categoryService.getFamilyCategoriesEntity(familyUuid).stream()
            .collect(Collectors.toMap(
                c -> c.getUuid().getValue(),
                CategoryInfo::from));

    String targetYearMonth = yearMonth != null
        ? yearMonth
        : LocalDate.now().format(YEAR_MONTH_FORMATTER);

    return entities.stream()
        .map(entity -> {
          boolean generated = recurringExpenseRepository
              .existsByRecurringExpenseUuidAndYearMonth(
                  entity.getUuid().getValue(), targetYearMonth);
          CategoryInfo category = categoryMap.get(entity.getCategoryUuid());
          return RecurringExpenseDto.Response.from(entity, generated, category);
        })
        .collect(Collectors.toList());
  }

  @ValidateFamilyAccess
  public BigDecimal getMonthlyTotal(
      @UserUuid CustomUuid userUuid,
      @FamilyUuid CustomUuid familyUuid) {

    return recurringExpenseRepository.sumActiveAmountByFamilyUuid(familyUuid.getValue());
  }

  @ValidateFamilyAccess
  @Transactional
  public RecurringExpenseDto.Response update(
      @UserUuid CustomUuid userUuid,
      @FamilyUuid CustomUuid familyUuid,
      CustomUuid uuid,
      RecurringExpenseDto.Update dto) {

    RecurringExpense entity = recurringExpenseRepository.findActiveByUuid(uuid)
        .orElseThrow(() -> new BusinessException(ErrorCode.RECURRING_EXPENSE_NOT_FOUND)
            .addParameter("uuid", uuid.getValue()));

    if (!entity.getFamilyUuid().equals(familyUuid.getValue())) {
      throw new BusinessException(ErrorCode.ACCESS_DENIED);
    }

    if (dto.getDayOfMonth() != null) {
      validateDayOfMonth(dto.getDayOfMonth());
    }

    if (dto.getCategoryUuid() != null) {
      CustomUuid categoryCustomUuid = CustomUuid.from(dto.getCategoryUuid());
      categoryService.validateAndFindCached(familyUuid, categoryCustomUuid);
    }

    entity.update(dto.getCategoryUuid(), dto.getName(), dto.getAmount(), dto.getDayOfMonth());

    String currentYearMonth = LocalDate.now().format(YEAR_MONTH_FORMATTER);
    boolean generated = recurringExpenseRepository
        .existsByRecurringExpenseUuidAndYearMonth(
            entity.getUuid().getValue(), currentYearMonth);

    // 업데이트 후 카테고리 정보 조회
    CategoryInfo category = CategoryInfo.from(
        categoryService.getFamilyCategoriesEntity(familyUuid).stream()
            .filter(c -> c.getUuid().getValue().equals(entity.getCategoryUuid()))
            .findFirst()
            .orElse(null));

    return RecurringExpenseDto.Response.from(entity, generated, category);
  }

  @ValidateFamilyAccess
  @Transactional
  public void delete(
      @UserUuid CustomUuid userUuid,
      @FamilyUuid CustomUuid familyUuid,
      CustomUuid uuid) {

    RecurringExpense entity = recurringExpenseRepository.findActiveByUuid(uuid)
        .orElseThrow(() -> new BusinessException(ErrorCode.RECURRING_EXPENSE_NOT_FOUND)
            .addParameter("uuid", uuid.getValue()));

    if (!entity.getFamilyUuid().equals(familyUuid.getValue())) {
      throw new BusinessException(ErrorCode.ACCESS_DENIED);
    }

    entity.end();
  }

  @Transactional
  public void moveRecurringExpensesToDefaultCategory(CustomUuid familyUuid,
      CustomUuid oldCategoryUuid) {
    Category defaultCategory = categoryRepository.getDefaultCategoryByFamily(familyUuid)
        .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

    recurringExpenseRepository.moveRecurringExpenses(oldCategoryUuid, defaultCategory.getUuid());
  }

  private void validateDayOfMonth(int dayOfMonth) {
    if (dayOfMonth < 1 || dayOfMonth > 28) {
      throw new BusinessException(ErrorCode.INVALID_DAY_OF_MONTH)
          .addParameter("dayOfMonth", String.valueOf(dayOfMonth));
    }
  }
}
