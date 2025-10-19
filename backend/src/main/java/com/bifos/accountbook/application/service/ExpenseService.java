package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.expense.CreateExpenseRequest;
import com.bifos.accountbook.application.dto.expense.ExpenseResponse;
import com.bifos.accountbook.application.dto.expense.ExpenseSearchRequest;
import com.bifos.accountbook.application.dto.expense.UpdateExpenseRequest;
import com.bifos.accountbook.common.exception.BusinessException;
import com.bifos.accountbook.common.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import com.bifos.accountbook.domain.value.CustomUuid;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final FamilyValidationService familyValidationService; // 가족 검증 로직

    /**
     * 지출 생성
     */
    @Transactional
    public ExpenseResponse createExpense(CustomUuid userUuid, String familyUuid, CreateExpenseRequest request) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);
        CustomUuid categoryCustomUuid = CustomUuid.from(request.getCategoryUuid());

        // 사용자 확인
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)
                        .addParameter("userUuid", userUuid.toString()));

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, familyCustomUuid);

        // 카테고리 확인
        Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                        .addParameter("categoryUuid", categoryCustomUuid.toString()));

        if (!category.getFamilyUuid().equals(familyCustomUuid)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "해당 가족의 카테고리가 아닙니다")
                    .addParameter("categoryFamilyUuid", category.getFamilyUuid().toString())
                    .addParameter("requestFamilyUuid", familyCustomUuid.toString());
        }

        // 지출 생성
        Expense expense = Expense.builder()
                .familyUuid(familyCustomUuid)
                .categoryUuid(categoryCustomUuid)
                .userUuid(user.getUuid())
                .amount(request.getAmount())
                .description(request.getDescription())
                .date(request.getDate() != null ? request.getDate() : LocalDateTime.now())
                .build();

        expense = expenseRepository.save(expense);
        log.info("Created expense: {} in family: {} by user: {}", expense.getUuid(), familyUuid, userUuid);

        return ExpenseResponse.fromWithoutCategory(expense);
    }

    /**
     * 가족의 지출 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<ExpenseResponse> getFamilyExpenses(CustomUuid userUuid, String familyUuid, int page, int size) {
        ExpenseSearchRequest searchRequest = ExpenseSearchRequest.builder()
                .page(page)
                .size(size)
                .build();
        return getFamilyExpenses(userUuid, familyUuid, searchRequest);
    }

    /**
     * 가족의 지출 목록 조회 (페이징 + 필터링)
     */
    @Transactional(readOnly = true)
    public Page<ExpenseResponse> getFamilyExpenses(
            CustomUuid userUuid,
            String familyUuid,
            ExpenseSearchRequest searchRequest) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, familyCustomUuid);

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

        // 필터링이 있으면 필터링 메서드 사용, 없으면 기본 메서드 사용
        Page<Expense> expenses;
        if (categoryUuid != null || startDateTime != null || endDateTime != null) {
            expenses = expenseRepository.findByFamilyUuidWithFilters(
                    familyCustomUuid, categoryUuid, startDateTime, endDateTime, pageable);
        } else {
            expenses = expenseRepository.findAllByFamilyUuid(familyCustomUuid, pageable);
        }

        return expenses.map(ExpenseResponse::fromWithoutCategory);
    }

    /**
     * 지출 상세 조회
     */
    @Transactional(readOnly = true)
    public ExpenseResponse getExpense(CustomUuid userUuid, String expenseUuid) {
        CustomUuid expenseCustomUuid = CustomUuid.from(expenseUuid);

        Expense expense = expenseRepository.findActiveByUuid(expenseCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXPENSE_NOT_FOUND)
                        .addParameter("expenseUuid", expenseCustomUuid.toString()));

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, expense.getFamilyUuid());

        return ExpenseResponse.fromWithoutCategory(expense);
    }

    /**
     * 지출 수정
     */
    @Transactional
    public ExpenseResponse updateExpense(CustomUuid userUuid, String expenseUuid, UpdateExpenseRequest request) {
        CustomUuid expenseCustomUuid = CustomUuid.from(expenseUuid);

        Expense expense = expenseRepository.findActiveByUuid(expenseCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXPENSE_NOT_FOUND)
                        .addParameter("expenseUuid", expenseCustomUuid.toString()));

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, expense.getFamilyUuid());

        // 카테고리 변경
        if (request.getCategoryUuid() != null) {
            CustomUuid categoryCustomUuid = CustomUuid.from(request.getCategoryUuid());
            Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                    .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                            .addParameter("categoryUuid", categoryCustomUuid.toString()));

            if (!category.getFamilyUuid().equals(expense.getFamilyUuid())) {
                throw new BusinessException(ErrorCode.ACCESS_DENIED, "해당 가족의 카테고리가 아닙니다")
                        .addParameter("categoryFamilyUuid", category.getFamilyUuid().toString())
                        .addParameter("expenseFamilyUuid", expense.getFamilyUuid().toString());
            }

            expense.setCategoryUuid(categoryCustomUuid);
        }

        // 금액 변경
        if (request.getAmount() != null) {
            expense.setAmount(request.getAmount());
        }

        // 설명 변경
        if (request.getDescription() != null) {
            expense.setDescription(request.getDescription());
        }

        // 날짜 변경
        if (request.getDate() != null) {
            expense.setDate(request.getDate());
        }

        expense = expenseRepository.save(expense);
        log.info("Updated expense: {} by user: {}", expenseUuid, userUuid);

        return ExpenseResponse.fromWithoutCategory(expense);
    }

    /**
     * 지출 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteExpense(CustomUuid userUuid, String expenseUuid) {
        CustomUuid expenseCustomUuid = CustomUuid.from(expenseUuid);

        Expense expense = expenseRepository.findActiveByUuid(expenseCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXPENSE_NOT_FOUND)
                        .addParameter("expenseUuid", expenseCustomUuid.toString()));

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, expense.getFamilyUuid());

        expense.setDeletedAt(LocalDateTime.now());
        expenseRepository.save(expense);

        log.info("Deleted expense: {} by user: {}", expenseUuid, userUuid);
    }
}
