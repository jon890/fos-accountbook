package com.bifos.accountbook.income.presentation.controller;

import com.bifos.accountbook.shared.dto.PaginationResponse;
import com.bifos.accountbook.income.application.dto.CreateIncomeRequest;
import com.bifos.accountbook.income.application.dto.IncomeResponse;
import com.bifos.accountbook.income.application.dto.IncomeSearchRequest;
import com.bifos.accountbook.income.application.dto.UpdateIncomeRequest;
import com.bifos.accountbook.income.application.service.IncomeService;
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

@Tag(name = "수입 (Income)", description = "수입 내역 관리 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/families/{familyUuid}/incomes")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class IncomeController {

  private final IncomeService incomeService;

  @Operation(summary = "수입 등록", description = "가족의 수입을 등록합니다.")
  @ApiResponse(responseCode = "201", description = "등록 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @PostMapping
  public ResponseEntity<ApiSuccessResponse<IncomeResponse>> createIncome(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Valid @RequestBody CreateIncomeRequest request) {
    IncomeResponse response = incomeService.createIncome(loginUser.userUuid(), familyUuid, request);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiSuccessResponse.of("수입이 등록되었습니다", response));
  }

  @Operation(summary = "수입 목록 조회", description = "가족의 수입 목록을 페이징 및 필터링하여 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping
  public ResponseEntity<ApiSuccessResponse<PaginationResponse<IncomeResponse>>> getFamilyIncomes(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @RequestParam(defaultValue = "0") Integer page,
      @RequestParam(defaultValue = "20") Integer size,
      @RequestParam(required = false) String categoryUuid,
      @RequestParam(required = false) String startDate,
      @RequestParam(required = false) String endDate) {

    IncomeSearchRequest searchRequest = IncomeSearchRequest.withDefaults(page, size, categoryUuid, startDate, endDate);

    Page<IncomeResponse> incomesPage = incomeService.getFamilyIncomes(loginUser.userUuid(), familyUuid, searchRequest);

    PaginationResponse<IncomeResponse> response = PaginationResponse.from(incomesPage);

    return ResponseEntity.ok(ApiSuccessResponse.of(response));
  }

  @Operation(summary = "수입 상세 조회", description = "수입 UUID로 상세 정보를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @ApiResponse(responseCode = "404", description = "수입을 찾을 수 없음")
  @GetMapping("/{incomeUuid}")
  public ResponseEntity<ApiSuccessResponse<IncomeResponse>> getIncome(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @PathVariable CustomUuid incomeUuid) {
    IncomeResponse income = incomeService.getIncome(loginUser.userUuid(), familyUuid, incomeUuid);
    return ResponseEntity.ok(ApiSuccessResponse.of(income));
  }

  @Operation(summary = "수입 수정", description = "수입 내역을 수정합니다.")
  @ApiResponse(responseCode = "200", description = "수정 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @ApiResponse(responseCode = "404", description = "수입을 찾을 수 없음")
  @PutMapping("/{incomeUuid}")
  public ResponseEntity<ApiSuccessResponse<IncomeResponse>> updateIncome(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @PathVariable CustomUuid incomeUuid,
      @Valid @RequestBody UpdateIncomeRequest request) {
    IncomeResponse response = incomeService.updateIncome(
        loginUser.userUuid(), familyUuid, incomeUuid, request);
    return ResponseEntity.ok(ApiSuccessResponse.of("수입이 수정되었습니다", response));
  }

  @Operation(summary = "수입 삭제", description = "수입 내역을 삭제합니다.")
  @ApiResponse(responseCode = "200", description = "삭제 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @ApiResponse(responseCode = "404", description = "수입을 찾을 수 없음")
  @DeleteMapping("/{incomeUuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> deleteIncome(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @PathVariable CustomUuid incomeUuid) {
    incomeService.deleteIncome(loginUser.userUuid(), familyUuid, incomeUuid);
    return ResponseEntity.ok(ApiSuccessResponse.of("수입이 삭제되었습니다", null));
  }
}
