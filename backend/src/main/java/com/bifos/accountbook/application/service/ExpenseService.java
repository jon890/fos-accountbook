package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.expense.CreateExpenseRequest;
import com.bifos.accountbook.application.dto.expense.ExpenseResponse;
import com.bifos.accountbook.application.dto.expense.UpdateExpenseRequest;
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
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;

    /**
     * 지출 생성
     */
    @Transactional
    public ExpenseResponse createExpense(String userId, UUID familyUuid, CreateExpenseRequest request) {
        // 사용자 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        
        // 권한 확인
        validateFamilyAccess(userId, familyUuid);

        // 카테고리 확인
        Category category = categoryRepository.findActiveByUuid(request.getCategoryUuid())
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다"));

        if (!category.getFamilyUuid().equals(familyUuid)) {
            throw new IllegalArgumentException("해당 가족의 카테고리가 아닙니다");
        }

        // 지출 생성
        Expense expense = Expense.builder()
                .familyUuid(familyUuid)
                .categoryUuid(request.getCategoryUuid())
                .userUuid(user.getUuid())
                .amount(request.getAmount())
                .description(request.getDescription())
                .date(request.getDate() != null ? request.getDate() : LocalDateTime.now())
                .build();

        expense = expenseRepository.save(expense);
        log.info("Created expense: {} in family: {} by user: {}", expense.getUuid(), familyUuid, userId);

        return ExpenseResponse.fromWithoutCategory(expense);
    }

    /**
     * 가족의 지출 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<ExpenseResponse> getFamilyExpenses(String userId, UUID familyUuid, int page, int size) {
        // 권한 확인
        validateFamilyAccess(userId, familyUuid);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "date"));
        Page<Expense> expenses = expenseRepository.findAllByFamilyUuid(familyUuid, pageable);

        return expenses.map(ExpenseResponse::fromWithoutCategory);
    }

    /**
     * 지출 상세 조회
     */
    @Transactional(readOnly = true)
    public ExpenseResponse getExpense(String userId, UUID expenseUuid) {
        Expense expense = expenseRepository.findActiveByUuid(expenseUuid)
                .orElseThrow(() -> new IllegalArgumentException("지출을 찾을 수 없습니다"));

        // 권한 확인
        validateFamilyAccess(userId, expense.getFamilyUuid());

        return ExpenseResponse.fromWithoutCategory(expense);
    }

    /**
     * 지출 수정
     */
    @Transactional
    public ExpenseResponse updateExpense(String userId, UUID expenseUuid, UpdateExpenseRequest request) {
        Expense expense = expenseRepository.findActiveByUuid(expenseUuid)
                .orElseThrow(() -> new IllegalArgumentException("지출을 찾을 수 없습니다"));

        // 권한 확인
        validateFamilyAccess(userId, expense.getFamilyUuid());

        // 카테고리 변경
        if (request.getCategoryUuid() != null) {
            Category category = categoryRepository.findActiveByUuid(request.getCategoryUuid())
                    .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다"));

            if (!category.getFamilyUuid().equals(expense.getFamilyUuid())) {
                throw new IllegalArgumentException("해당 가족의 카테고리가 아닙니다");
            }

            expense.setCategoryUuid(request.getCategoryUuid());
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
        log.info("Updated expense: {} by user: {}", expenseUuid, userId);

        return ExpenseResponse.fromWithoutCategory(expense);
    }

    /**
     * 지출 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteExpense(String userId, UUID expenseUuid) {
        Expense expense = expenseRepository.findActiveByUuid(expenseUuid)
                .orElseThrow(() -> new IllegalArgumentException("지출을 찾을 수 없습니다"));

        // 권한 확인
        validateFamilyAccess(userId, expense.getFamilyUuid());

        expense.setDeletedAt(LocalDateTime.now());
        expenseRepository.save(expense);

        log.info("Deleted expense: {} by user: {}", expenseUuid, userId);
    }

    /**
     * 가족 접근 권한 확인
     */
    private void validateFamilyAccess(String userId, UUID familyUuid) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        boolean isMember = familyMemberRepository.existsByFamilyUuidAndUserUuidAndDeletedAtIsNull(
                familyUuid, user.getUuid()
        );

        if (!isMember) {
            throw new IllegalStateException("해당 가족에 접근할 권한이 없습니다");
        }
    }
}

