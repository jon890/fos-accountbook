package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.income.CreateIncomeRequest;
import com.bifos.accountbook.application.dto.income.IncomeResponse;
import com.bifos.accountbook.application.dto.income.IncomeSearchRequest;
import com.bifos.accountbook.application.dto.income.UpdateIncomeRequest;
import com.bifos.accountbook.application.service.IncomeService;
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
@RequestMapping("/families/{familyUuid}/incomes")
@RequiredArgsConstructor
public class IncomeController {

    private final IncomeService incomeService;

    /**
     * 수입 생성
     */
    @PostMapping
    public ResponseEntity<ApiSuccessResponse<IncomeResponse>> createIncome(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String familyUuid,
            @Valid @RequestBody CreateIncomeRequest request) {
        IncomeResponse response = incomeService.createIncome(loginUser.getUserUuid(), familyUuid, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiSuccessResponse.of("수입이 등록되었습니다", response));
    }

    /**
     * 가족의 수입 목록 조회 (페이징 + 필터링)
     */
    @GetMapping
    public ResponseEntity<ApiSuccessResponse<Page<IncomeResponse>>> getFamilyIncomes(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String familyUuid,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String categoryUuid,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        IncomeSearchRequest searchRequest = IncomeSearchRequest.withDefaults(
                page, size, categoryUuid, startDate, endDate);

        Page<IncomeResponse> incomes = incomeService.getFamilyIncomes(
                loginUser.getUserUuid(), familyUuid, searchRequest);

        return ResponseEntity.ok(ApiSuccessResponse.of(incomes));
    }

    /**
     * 수입 상세 조회
     */
    @GetMapping("/{incomeUuid}")
    public ResponseEntity<ApiSuccessResponse<IncomeResponse>> getIncome(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String incomeUuid) {
        IncomeResponse income = incomeService.getIncome(loginUser.getUserUuid(), incomeUuid);
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
                loginUser.getUserUuid(), incomeUuid, request);
        return ResponseEntity.ok(ApiSuccessResponse.of("수입이 수정되었습니다", response));
    }

    /**
     * 수입 삭제 (Soft Delete)
     */
    @DeleteMapping("/{incomeUuid}")
    public ResponseEntity<ApiSuccessResponse<Void>> deleteIncome(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String incomeUuid) {
        incomeService.deleteIncome(loginUser.getUserUuid(), incomeUuid);
        return ResponseEntity.ok(ApiSuccessResponse.of("수입이 삭제되었습니다", null));
    }
}
