package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.ApiSuccessResponse;
import com.bifos.accountbook.application.dto.expense.CreateExpenseRequest;
import com.bifos.accountbook.application.dto.expense.ExpenseResponse;
import com.bifos.accountbook.application.dto.expense.UpdateExpenseRequest;
import com.bifos.accountbook.application.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/families/{familyUuid}/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    /**
     * 지출 생성
     */
    @PostMapping
    public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> createExpense(
            Authentication authentication,
            @PathVariable UUID familyUuid,
            @Valid @RequestBody CreateExpenseRequest request
    ) {
        String userId = authentication.getName();
        log.info("Creating expense in family: {} by user: {}", familyUuid, userId);

        ExpenseResponse response = expenseService.createExpense(userId, familyUuid, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiSuccessResponse.of("지출이 등록되었습니다", response));
    }

    /**
     * 가족의 지출 목록 조회 (페이징)
     */
    @GetMapping
    public ResponseEntity<ApiSuccessResponse<Page<ExpenseResponse>>> getFamilyExpenses(
            Authentication authentication,
            @PathVariable UUID familyUuid,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String userId = authentication.getName();
        log.info("Fetching expenses for family: {} (page: {}, size: {}) by user: {}", familyUuid, page, size, userId);

        Page<ExpenseResponse> expenses = expenseService.getFamilyExpenses(userId, familyUuid, page, size);

        return ResponseEntity.ok(ApiSuccessResponse.of(expenses));
    }

    /**
     * 지출 상세 조회
     */
    @GetMapping("/{expenseUuid}")
    public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> getExpense(
            Authentication authentication,
            @PathVariable UUID familyUuid,
            @PathVariable UUID expenseUuid
    ) {
        String userId = authentication.getName();
        log.info("Fetching expense: {} by user: {}", expenseUuid, userId);

        ExpenseResponse expense = expenseService.getExpense(userId, expenseUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of(expense));
    }

    /**
     * 지출 수정
     */
    @PutMapping("/{expenseUuid}")
    public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> updateExpense(
            Authentication authentication,
            @PathVariable UUID familyUuid,
            @PathVariable UUID expenseUuid,
            @Valid @RequestBody UpdateExpenseRequest request
    ) {
        String userId = authentication.getName();
        log.info("Updating expense: {} by user: {}", expenseUuid, userId);

        ExpenseResponse response = expenseService.updateExpense(userId, expenseUuid, request);

        return ResponseEntity.ok(ApiSuccessResponse.of("지출이 수정되었습니다", response));
    }

    /**
     * 지출 삭제
     */
    @DeleteMapping("/{expenseUuid}")
    public ResponseEntity<ApiSuccessResponse<Void>> deleteExpense(
            Authentication authentication,
            @PathVariable UUID familyUuid,
            @PathVariable UUID expenseUuid
    ) {
        String userId = authentication.getName();
        log.info("Deleting expense: {} by user: {}", expenseUuid, userId);

        expenseService.deleteExpense(userId, expenseUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of("지출이 삭제되었습니다", null));
    }
}

