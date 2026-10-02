package com.bifos.accountbook.budgetitem.application.service;

import com.bifos.accountbook.budgetitem.application.dto.BudgetItemRequest;
import com.bifos.accountbook.budgetitem.application.dto.BudgetItemResponse;
import com.bifos.accountbook.budgetitem.domain.entity.BudgetItem;
import com.bifos.accountbook.budgetitem.domain.entity.BudgetItemCategory;
import com.bifos.accountbook.budgetitem.domain.repository.BudgetItemRepository;
import com.bifos.accountbook.category.application.service.CategoryService;
import com.bifos.accountbook.category.domain.value.CategoryType;
import com.bifos.accountbook.family.application.access.FamilyUuid;
import com.bifos.accountbook.family.application.access.UserUuid;
import com.bifos.accountbook.family.application.access.ValidateFamilyAccess;
import com.bifos.accountbook.shared.exception.BusinessException;
import com.bifos.accountbook.shared.exception.ErrorCode;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 예산 항목 관리. 권한은 가족 구성원 누구나다 (ADR-B25). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BudgetItemService {

  private static final int MAX_ACTIVE_ITEMS = 10;

  private final BudgetItemRepository budgetItemRepository;
  private final CategoryService categoryService;

  @ValidateFamilyAccess
  public List<BudgetItemResponse> getBudgetItems(
      @UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid) {
    List<BudgetItem> items = budgetItemRepository.findAllActiveByFamilyUuid(familyUuid);
    Map<String, List<String>> categoriesByItem = groupCategoryUuids(items);

    return items.stream()
        .map(
            item ->
                BudgetItemResponse.from(
                    item, categoriesByItem.getOrDefault(item.getUuid().getValue(), List.of())))
        .toList();
  }

  @ValidateFamilyAccess
  @Transactional
  public BudgetItemResponse createBudgetItem(
      @UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid, BudgetItemRequest request) {
    if (budgetItemRepository.countActiveByFamilyUuid(familyUuid) >= MAX_ACTIVE_ITEMS) {
      throw new BusinessException(ErrorCode.BUDGET_ITEM_LIMIT_EXCEEDED);
    }

    String name = request.getName().trim();
    if (budgetItemRepository.existsActiveByFamilyUuidAndName(familyUuid, name)) {
      throw new BusinessException(ErrorCode.BUDGET_ITEM_ALREADY_EXISTS).addParameter("name", name);
    }

    List<CustomUuid> categoryUuids = validateCategories(familyUuid, request.getCategoryUuids());
    validateNoConflict(categoryUuids, null);

    BudgetItem item =
        budgetItemRepository.save(
            BudgetItem.builder()
                .familyUuid(familyUuid)
                .name(name)
                .monthlyLimit(request.getMonthlyLimit())
                .build());

    saveCategories(item.getUuid(), categoryUuids);
    return BudgetItemResponse.from(item, toValues(categoryUuids));
  }

  @ValidateFamilyAccess
  @Transactional
  public BudgetItemResponse updateBudgetItem(
      @UserUuid CustomUuid userUuid,
      @FamilyUuid CustomUuid familyUuid,
      CustomUuid budgetItemUuid,
      BudgetItemRequest request) {
    BudgetItem item = findActiveItem(familyUuid, budgetItemUuid);

    String name = request.getName().trim();
    if (!name.equals(item.getName())
        && budgetItemRepository.existsActiveByFamilyUuidAndName(familyUuid, name)) {
      throw new BusinessException(ErrorCode.BUDGET_ITEM_ALREADY_EXISTS).addParameter("name", name);
    }

    List<CustomUuid> categoryUuids = validateCategories(familyUuid, request.getCategoryUuids());
    validateNoConflict(categoryUuids, budgetItemUuid);

    item.update(name, request.getMonthlyLimit());
    BudgetItem saved = budgetItemRepository.save(item);

    // 지우기가 먼저 DB 에 반영돼야 같은 카테고리를 다시 넣어도 유니크 키에 걸리지 않는다
    budgetItemRepository.deleteCategoriesByBudgetItemUuid(budgetItemUuid);
    saveCategories(budgetItemUuid, categoryUuids);
    return BudgetItemResponse.from(saved, toValues(categoryUuids));
  }

  @ValidateFamilyAccess
  @Transactional
  public void deleteBudgetItem(
      @UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid, CustomUuid budgetItemUuid) {
    BudgetItem item = findActiveItem(familyUuid, budgetItemUuid);
    item.delete();
    budgetItemRepository.save(item);
    budgetItemRepository.deleteCategoriesByBudgetItemUuid(budgetItemUuid);
  }

  /** 카테고리가 삭제될 때 예산 항목에서 뺀다. 삭제 권한은 CategoryService.deleteCategory 가 이미 검증했다. */
  @Transactional
  public void removeCategory(CustomUuid categoryUuid) {
    budgetItemRepository.deleteCategoriesByCategoryUuid(categoryUuid);
  }

  private BudgetItem findActiveItem(CustomUuid familyUuid, CustomUuid budgetItemUuid) {
    return budgetItemRepository
        .findActiveByUuidAndFamilyUuid(budgetItemUuid, familyUuid)
        .orElseThrow(
            () ->
                new BusinessException(ErrorCode.BUDGET_ITEM_NOT_FOUND)
                    .addParameter("budgetItemUuid", budgetItemUuid.getValue()));
  }

  /** 중복 값을 거르고 카테고리마다 가족 소속과 지출 종류를 확인한다. */
  private List<CustomUuid> validateCategories(CustomUuid familyUuid, List<String> rawUuids) {
    Set<String> seen = new HashSet<>();
    List<CustomUuid> categoryUuids = new ArrayList<>();
    for (String raw : rawUuids) {
      if (!seen.add(raw)) {
        throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "중복된 카테고리가 있습니다");
      }
      categoryUuids.add(CustomUuid.from(raw));
    }
    for (CustomUuid categoryUuid : categoryUuids) {
      categoryService.validateAndFindCached(familyUuid, categoryUuid, CategoryType.EXPENSE);
    }
    return categoryUuids;
  }

  /** 다른 항목에 이미 속한 카테고리가 있으면 거부한다. 수정이면 자기 항목의 기존 행은 뺀다. */
  private void validateNoConflict(List<CustomUuid> categoryUuids, CustomUuid ownBudgetItemUuid) {
    boolean conflict =
        budgetItemRepository.findCategoriesByCategoryUuids(categoryUuids).stream()
            .anyMatch(row -> !row.getBudgetItemUuid().equals(ownBudgetItemUuid));
    if (conflict) {
      throw new BusinessException(ErrorCode.BUDGET_ITEM_CATEGORY_CONFLICT);
    }
  }

  private void saveCategories(CustomUuid budgetItemUuid, List<CustomUuid> categoryUuids) {
    List<BudgetItemCategory> rows =
        categoryUuids.stream()
            .map(
                categoryUuid ->
                    BudgetItemCategory.builder()
                        .budgetItemUuid(budgetItemUuid)
                        .categoryUuid(categoryUuid)
                        .build())
            .toList();
    try {
      budgetItemRepository.saveCategories(rows);
    } catch (DataIntegrityViolationException e) {
      // 동시 요청이 같은 카테고리를 먼저 넣은 경우
      throw new BusinessException(ErrorCode.BUDGET_ITEM_CATEGORY_CONFLICT);
    }
  }

  private Map<String, List<String>> groupCategoryUuids(List<BudgetItem> items) {
    Map<String, List<String>> grouped = new LinkedHashMap<>();
    budgetItemRepository
        .findCategoriesByBudgetItemUuids(items.stream().map(BudgetItem::getUuid).toList())
        .forEach(
            row ->
                grouped
                    .computeIfAbsent(row.getBudgetItemUuid().getValue(), key -> new ArrayList<>())
                    .add(row.getCategoryUuid().getValue()));
    return grouped;
  }

  private List<String> toValues(List<CustomUuid> uuids) {
    return uuids.stream().map(CustomUuid::getValue).toList();
  }
}
