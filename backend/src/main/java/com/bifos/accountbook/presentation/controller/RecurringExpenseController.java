package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.recurringexpense.RecurringExpenseDto;
import com.bifos.accountbook.application.service.RecurringExpenseService;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import com.bifos.accountbook.presentation.dto.recurringexpense.CreateRecurringExpenseRequest;
import com.bifos.accountbook.presentation.dto.recurringexpense.GetRecurringExpensesResponse;
import com.bifos.accountbook.presentation.dto.recurringexpense.RecurringExpenseResponse;
import com.bifos.accountbook.presentation.dto.recurringexpense.UpdateRecurringExpenseRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
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

@Tag(name = "반복 지출 (Recurring Expense)", description = "반복 지출 관리 API")
@RestController
@RequestMapping("/api/v1/families/{familyUuid}/recurring-expenses")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class RecurringExpenseController {

  private final RecurringExpenseService recurringExpenseService;

  @Operation(summary = "반복 지출 등록", description = "가족의 반복 지출을 등록합니다.")
  @ApiResponse(responseCode = "201", description = "등록 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @PostMapping
  public ResponseEntity<ApiSuccessResponse<RecurringExpenseResponse>> createRecurringExpense(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Valid @RequestBody CreateRecurringExpenseRequest request) {

    RecurringExpenseDto.Create createDto = RecurringExpenseDto.Create.builder()
        .categoryUuid(request.getCategoryUuid())
        .name(request.getName())
        .amount(request.getAmount())
        .dayOfMonth(request.getDayOfMonth())
        .build();

    RecurringExpenseDto.Response serviceResponse =
        recurringExpenseService.create(loginUser.userUuid(), familyUuid, createDto);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiSuccessResponse.of("반복 지출이 등록되었습니다",
            RecurringExpenseResponse.from(serviceResponse)));
  }

  @Operation(summary = "반복 지출 목록 조회",
      description = "가족의 반복 지출 목록을 조회합니다. month 파라미터로 해당 월 생성 여부를 확인합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping
  public ResponseEntity<ApiSuccessResponse<GetRecurringExpensesResponse>> getRecurringExpenses(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @Parameter(description = "조회 월 (YYYY-MM)")
      @RequestParam(required = false) String month) {

    List<RecurringExpenseDto.Response> serviceResponses =
        recurringExpenseService.getAll(loginUser.userUuid(), familyUuid, month);

    BigDecimal totalMonthlyAmount =
        recurringExpenseService.getMonthlyTotal(loginUser.userUuid(), familyUuid);

    List<RecurringExpenseResponse> items = serviceResponses.stream()
        .map(RecurringExpenseResponse::from)
        .collect(Collectors.toList());

    GetRecurringExpensesResponse response = GetRecurringExpensesResponse.builder()
        .totalMonthlyAmount(totalMonthlyAmount)
        .items(items)
        .build();

    return ResponseEntity.ok(ApiSuccessResponse.of(response));
  }

  @Operation(summary = "반복 지출 월간 총액 조회",
      description = "활성 상태인 반복 지출의 월간 총액을 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/monthly-total")
  public ResponseEntity<ApiSuccessResponse<BigDecimal>> getMonthlyTotal(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid) {

    BigDecimal totalMonthlyAmount =
        recurringExpenseService.getMonthlyTotal(loginUser.userUuid(), familyUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(totalMonthlyAmount));
  }

  @Operation(summary = "반복 지출 수정", description = "반복 지출 정보를 수정합니다.")
  @ApiResponse(responseCode = "200", description = "수정 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @ApiResponse(responseCode = "404", description = "반복 지출을 찾을 수 없음")
  @PutMapping("/{uuid}")
  public ResponseEntity<ApiSuccessResponse<RecurringExpenseResponse>> updateRecurringExpense(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @PathVariable CustomUuid uuid,
      @Valid @RequestBody UpdateRecurringExpenseRequest request) {

    RecurringExpenseDto.Update updateDto = RecurringExpenseDto.Update.builder()
        .categoryUuid(request.getCategoryUuid())
        .name(request.getName())
        .amount(request.getAmount())
        .dayOfMonth(request.getDayOfMonth())
        .build();

    RecurringExpenseDto.Response serviceResponse =
        recurringExpenseService.update(
            loginUser.userUuid(), familyUuid, uuid, updateDto);

    return ResponseEntity.ok(ApiSuccessResponse.of("반복 지출이 수정되었습니다",
        RecurringExpenseResponse.from(serviceResponse)));
  }

  @Operation(summary = "반복 지출 삭제", description = "반복 지출을 종료(삭제) 처리합니다.")
  @ApiResponse(responseCode = "200", description = "삭제 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @ApiResponse(responseCode = "404", description = "반복 지출을 찾을 수 없음")
  @DeleteMapping("/{uuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> deleteRecurringExpense(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @PathVariable CustomUuid uuid) {

    recurringExpenseService.delete(loginUser.userUuid(), familyUuid, uuid);

    return ResponseEntity.ok(ApiSuccessResponse.of("삭제되었습니다.", null));
  }
}
