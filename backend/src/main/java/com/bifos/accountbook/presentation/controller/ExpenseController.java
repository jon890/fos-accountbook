package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.common.PaginationResponse;
import com.bifos.accountbook.application.dto.expense.CategoryExpenseSummaryResponse;
import com.bifos.accountbook.application.dto.expense.CreateExpenseRequest;
import com.bifos.accountbook.application.dto.expense.ExpenseResponse;
import com.bifos.accountbook.application.dto.expense.ExpenseSearchRequest;
import com.bifos.accountbook.application.dto.expense.ExpenseSummarySearchRequest;
import com.bifos.accountbook.application.dto.expense.UpdateExpenseRequest;
import com.bifos.accountbook.application.service.ExpenseService;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/families/{familyUuid}/expenses")
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
        ExpenseResponse response = expenseService.createExpense(loginUser.getUserUuid(), familyUuid, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiSuccessResponse.of("지출이 등록되었습니다", response));
    }

    /**
     * 가족의 지출 목록 조회 (페이징 + 필터링)
     */
    @GetMapping
    public ResponseEntity<ApiSuccessResponse<PaginationResponse<ExpenseResponse>>> getFamilyExpenses(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String familyUuid,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        ExpenseSearchRequest searchRequest = ExpenseSearchRequest.withDefaults(
                page, size, categoryId, startDate, endDate);

        Page<ExpenseResponse> expensesPage = expenseService.getFamilyExpenses(
                loginUser.getUserUuid(), familyUuid, searchRequest);

        PaginationResponse<ExpenseResponse> response = PaginationResponse.from(expensesPage);

        return ResponseEntity.ok(ApiSuccessResponse.of(response));
    }

    /**
     * 지출 상세 조회
     */
    @GetMapping("/{expenseUuid}")
    public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> getExpense(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String familyUuid,
            @PathVariable String expenseUuid) {
        ExpenseResponse expense = expenseService.getExpense(loginUser.getUserUuid(), expenseUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of(expense));
    }

    /**
     * 지출 수정
     */
    @PutMapping("/{expenseUuid}")
    public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> updateExpense(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String expenseUuid,
            @Valid @RequestBody UpdateExpenseRequest request) {
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
        expenseService.deleteExpense(loginUser.getUserUuid(), expenseUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of("지출이 삭제되었습니다", null));
    }

    /**
     * 카테고리별 지출 요약 조회
     */
    @GetMapping("/summary/by-category")
    public ResponseEntity<ApiSuccessResponse<CategoryExpenseSummaryResponse>> getCategoryExpenseSummary(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String familyUuid,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String categoryUuid) {

        ExpenseSummarySearchRequest searchRequest = ExpenseSummarySearchRequest.withDefaults(
                startDate, endDate, categoryUuid);

        CategoryExpenseSummaryResponse response = expenseService.getCategoryExpenseSummary(
                loginUser.getUserUuid(), familyUuid, searchRequest);

        return ResponseEntity.ok(ApiSuccessResponse.of(response));
    }
}
