package com.bifos.accountbook.presentation.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bifos.accountbook.application.dto.ApiSuccessResponse;
import com.bifos.accountbook.application.dto.expense.CreateExpenseRequest;
import com.bifos.accountbook.application.dto.expense.ExpenseResponse;
import com.bifos.accountbook.application.dto.expense.UpdateExpenseRequest;
import com.bifos.accountbook.application.service.ExpenseService;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.LoginUserDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
            @LoginUser LoginUserDto loginUser,
            @PathVariable String familyUuid,
            @Valid @RequestBody CreateExpenseRequest request) {
        log.info("Creating expense in family: {} by user: {}", familyUuid, loginUser.getUserUuid());

        ExpenseResponse response = expenseService.createExpense(loginUser.getUserUuid(), familyUuid, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiSuccessResponse.of("지출이 등록되었습니다", response));
    }

    /**
     * 가족의 지출 목록 조회 (페이징)
     */
    @GetMapping
    public ResponseEntity<ApiSuccessResponse<Page<ExpenseResponse>>> getFamilyExpenses(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String familyUuid,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching expenses for family: {} (page: {}, size: {}) by user: {}", familyUuid, page, size,
                loginUser.getUserUuid());

        Page<ExpenseResponse> expenses = expenseService.getFamilyExpenses(loginUser.getUserUuid(), familyUuid, page,
                size);

        return ResponseEntity.ok(ApiSuccessResponse.of(expenses));
    }

    /**
     * 지출 상세 조회
     */
    @GetMapping("/{expenseUuid}")
    public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> getExpense(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String familyUuid,
            @PathVariable String expenseUuid) {
        log.info("Fetching expense: {} by user: {}", expenseUuid, loginUser.getUserUuid());

        ExpenseResponse expense = expenseService.getExpense(loginUser.getUserUuid(), expenseUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of(expense));
    }

    /**
     * 지출 수정
     */
    @PutMapping("/{expenseUuid}")
    public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> updateExpense(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String familyUuid,
            @PathVariable String expenseUuid,
            @Valid @RequestBody UpdateExpenseRequest request) {
        log.info("Updating expense: {} by user: {}", expenseUuid, loginUser.getUserUuid());

        ExpenseResponse response = expenseService.updateExpense(loginUser.getUserUuid(), expenseUuid, request);

        return ResponseEntity.ok(ApiSuccessResponse.of("지출이 수정되었습니다", response));
    }

    /**
     * 지출 삭제
     */
    @DeleteMapping("/{expenseUuid}")
    public ResponseEntity<ApiSuccessResponse<Void>> deleteExpense(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String familyUuid,
            @PathVariable String expenseUuid) {
        log.info("Deleting expense: {} by user: {}", expenseUuid, loginUser.getUserUuid());

        expenseService.deleteExpense(loginUser.getUserUuid(), expenseUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of("지출이 삭제되었습니다", null));
    }
}
