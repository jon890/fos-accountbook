package com.bifos.accountbook.expense.presentation.controller;

import com.bifos.accountbook.shared.dto.PaginationResponse;
import com.bifos.accountbook.expense.application.dto.CreateExpenseRequest;
import com.bifos.accountbook.expense.application.dto.ExpenseResponse;
import com.bifos.accountbook.expense.application.dto.ExpenseSearchRequest;
import com.bifos.accountbook.expense.application.dto.UpdateExpenseRequest;
import com.bifos.accountbook.expense.application.service.ExpenseService;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.shared.auth.LoginUser;
import com.bifos.accountbook.shared.dto.ApiSuccessResponse;
import com.bifos.accountbook.shared.auth.LoginUserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@Tag(name = "지출 (Expense)", description = "지출 내역 관리 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/families/{familyUuid}/expenses")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class ExpenseController {

  private final ExpenseService expenseService;

  @Operation(summary = "지출 등록", description = "가족의 지출을 등록합니다.")
  @ApiResponse(responseCode = "201", description = "등록 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @PostMapping
  public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> createExpense(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Valid @RequestBody CreateExpenseRequest request) {
    ExpenseResponse response = expenseService.createExpense(loginUser.userUuid(), familyUuid, request);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiSuccessResponse.of("지출이 등록되었습니다", response));
  }

  @Operation(summary = "지출 목록 조회", description = "가족의 지출 목록을 페이징 및 필터링하여 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
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

  @Operation(summary = "지출 상세 조회", description = "지출 UUID로 상세 정보를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @ApiResponse(responseCode = "404", description = "지출을 찾을 수 없음")
  @GetMapping("/{expenseUuid}")
  public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> getExpense(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @PathVariable CustomUuid expenseUuid) {
    ExpenseResponse expense = expenseService.getExpense(loginUser.userUuid(), familyUuid, expenseUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(expense));
  }

  @Operation(summary = "지출 수정", description = "지출 내역을 수정합니다.")
  @ApiResponse(responseCode = "200", description = "수정 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @ApiResponse(responseCode = "404", description = "지출을 찾을 수 없음")
  @PutMapping("/{expenseUuid}")
  public ResponseEntity<ApiSuccessResponse<ExpenseResponse>> updateExpense(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @PathVariable CustomUuid expenseUuid,
      @Valid @RequestBody UpdateExpenseRequest request) {
    ExpenseResponse response = expenseService.updateExpense(loginUser.userUuid(), familyUuid, expenseUuid, request);

    return ResponseEntity.ok(ApiSuccessResponse.of("지출이 수정되었습니다", response));
  }

  @Operation(summary = "지출 삭제", description = "지출 내역을 삭제합니다.")
  @ApiResponse(responseCode = "200", description = "삭제 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @ApiResponse(responseCode = "404", description = "지출을 찾을 수 없음")
  @DeleteMapping("/{expenseUuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> deleteExpense(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @PathVariable CustomUuid expenseUuid) {
    expenseService.deleteExpense(loginUser.userUuid(), familyUuid, expenseUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of("지출이 삭제되었습니다", null));
  }
}
