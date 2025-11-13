package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.common.PaginationResponse;
import com.bifos.accountbook.application.dto.income.CreateIncomeRequest;
import com.bifos.accountbook.application.dto.income.IncomeResponse;
import com.bifos.accountbook.application.dto.income.IncomeSearchRequest;
import com.bifos.accountbook.application.dto.income.UpdateIncomeRequest;
import com.bifos.accountbook.application.service.IncomeService;
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
@RequestMapping("/api/v1/families/{familyUuid}/incomes")
@RequiredArgsConstructor
public class IncomeController {

  private final IncomeService incomeService;

  /**
   * 수입 생성
   */
  @PostMapping
  public ResponseEntity<ApiSuccessResponse<IncomeResponse>> createIncome(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @Valid @RequestBody CreateIncomeRequest request) {
    IncomeResponse response = incomeService.createIncome(loginUser.userUuid(), familyUuid, request);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiSuccessResponse.of("수입이 등록되었습니다", response));
  }

  /**
   * 가족의 수입 목록 조회 (페이징 + 필터링)
   */
  @GetMapping
  public ResponseEntity<ApiSuccessResponse<PaginationResponse<IncomeResponse>>> getFamilyIncomes(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @RequestParam(defaultValue = "0") Integer page,
      @RequestParam(defaultValue = "20") Integer size,
      @RequestParam(required = false) String categoryUuid,
      @RequestParam(required = false) String startDate,
      @RequestParam(required = false) String endDate) {

    IncomeSearchRequest searchRequest = IncomeSearchRequest.withDefaults(
        page, size, categoryUuid, startDate, endDate);

    Page<IncomeResponse> incomesPage = incomeService.getFamilyIncomes(
        loginUser.userUuid(), familyUuid, searchRequest);

    PaginationResponse<IncomeResponse> response = PaginationResponse.from(incomesPage);

    return ResponseEntity.ok(ApiSuccessResponse.of(response));
  }

  /**
   * 수입 상세 조회
   */
  @GetMapping("/{incomeUuid}")
  public ResponseEntity<ApiSuccessResponse<IncomeResponse>> getIncome(
      @LoginUser LoginUserDto loginUser,
      @PathVariable String incomeUuid) {
    IncomeResponse income = incomeService.getIncome(loginUser.userUuid(), incomeUuid);
    return ResponseEntity.ok(ApiSuccessResponse.of(income));
  }

  /**
   * 수입 수정
   */
  @PutMapping("/{incomeUuid}")
  public ResponseEntity<ApiSuccessResponse<IncomeResponse>> updateIncome(
      @LoginUser LoginUserDto loginUser,
      @PathVariable String incomeUuid,
      @Valid @RequestBody UpdateIncomeRequest request) {
    IncomeResponse response = incomeService.updateIncome(
        loginUser.userUuid(), incomeUuid, request);
    return ResponseEntity.ok(ApiSuccessResponse.of("수입이 수정되었습니다", response));
  }

  /**
   * 수입 삭제 (Soft Delete)
   */
  @DeleteMapping("/{incomeUuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> deleteIncome(
      @LoginUser LoginUserDto loginUser,
      @PathVariable String incomeUuid) {
    incomeService.deleteIncome(loginUser.userUuid(), incomeUuid);
    return ResponseEntity.ok(ApiSuccessResponse.of("수입이 삭제되었습니다", null));
  }
}
