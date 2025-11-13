package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.common.PaginationResponse;
import com.bifos.accountbook.application.dto.expense.CreateExpenseRequest;
import com.bifos.accountbook.application.dto.expense.ExpenseResponse;
import com.bifos.accountbook.application.dto.expense.ExpenseSearchRequest;
import com.bifos.accountbook.application.dto.expense.UpdateExpenseRequest;
import com.bifos.accountbook.application.service.ExpenseService;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
      @PathVariable CustomUuid familyUuid,
      @Valid @RequestBody CreateExpenseRequest request) {
    ExpenseResponse response = expenseService.createExpense(loginUser.userUuid(), familyUuid, request);

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
      @PathVariable CustomUuid familyUuid,
      @RequestParam(defaultValue = "0") Integer page,
      @RequestParam(defaultValue = "20") Integer size,
      @RequestParam(required = false) String categoryId,
      @RequestParam(required = false) String startDate,
      @RequestParam(required = false) String endDate) {

    ExpenseSearchRequest searchRequest = ExpenseSearchRequest.withDefaults(
        page, size, categoryId, startDate, endDate);

    Page<ExpenseResponse> expensesPage = expenseService.getFamilyExpenses(
        loginUser.userUuid(), familyUuid, searchRequest);

    PaginationResponse<ExpenseResponse> response = PaginationResponse.from(expensesPage);

    return ResponseEntity.ok(ApiSuccessResponse.of(response));
  }

  /**
   * 지출 상세 조회
   */
  @GetMapping("/{expenseUuid}")
  public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> getExpense(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @PathVariable String expenseUuid) {
    ExpenseResponse expense = expenseService.getExpense(loginUser.userUuid(), expenseUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(expense));
  }

  /**
   * 지출 수정
   */
  @PutMapping("/{expenseUuid}")
  public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> updateExpense(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @PathVariable String expenseUuid,
      @Valid @RequestBody UpdateExpenseRequest request) {
    ExpenseResponse response = expenseService.updateExpense(loginUser.userUuid(), expenseUuid, request);

    return ResponseEntity.ok(ApiSuccessResponse.of("지출이 수정되었습니다", response));
  }

  /**
   * 지출 삭제
   */
  @DeleteMapping("/{expenseUuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> deleteExpense(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @PathVariable String expenseUuid) {
    expenseService.deleteExpense(loginUser.userUuid(), expenseUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of("지출이 삭제되었습니다", null));
  }
}
