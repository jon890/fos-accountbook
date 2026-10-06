package com.bifos.accountbook.budgetitem.presentation.controller;

import com.bifos.accountbook.budgetitem.application.dto.BudgetItemRequest;
import com.bifos.accountbook.budgetitem.application.dto.BudgetItemResponse;
import com.bifos.accountbook.budgetitem.application.service.BudgetItemService;
import com.bifos.accountbook.shared.auth.LoginUser;
import com.bifos.accountbook.shared.auth.LoginUserDto;
import com.bifos.accountbook.shared.dto.ApiSuccessResponse;
import com.bifos.accountbook.shared.value.CustomUuid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "예산 항목 (BudgetItem)", description = "가족의 예산 항목 관리 API")
@RestController
@RequestMapping("/api/v1/families/{familyUuid}/budget-items")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class BudgetItemController {

  private final BudgetItemService budgetItemService;

  @Operation(summary = "예산 항목 생성", description = "이름, 월 한도, 지출 카테고리 묶음으로 예산 항목을 만듭니다.")
  @ApiResponse(responseCode = "201", description = "생성 성공")
  @ApiResponse(responseCode = "400", description = "입력이 올바르지 않거나 항목이 10개를 넘음")
  @ApiResponse(responseCode = "409", description = "이름이 같거나 다른 항목에 속한 카테고리")
  @PostMapping
  public ResponseEntity<ApiSuccessResponse<BudgetItemResponse>> createBudgetItem(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Valid @RequestBody BudgetItemRequest request) {
    BudgetItemResponse response =
        budgetItemService.createBudgetItem(loginUser.userUuid(), familyUuid, request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiSuccessResponse.of("예산 항목이 생성되었습니다", response));
  }

  @Operation(summary = "예산 항목 목록 조회", description = "가족의 예산 항목을 만든 순서로 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping
  public ResponseEntity<ApiSuccessResponse<List<BudgetItemResponse>>> getBudgetItems(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid) {
    return ResponseEntity.ok(
        ApiSuccessResponse.of(budgetItemService.getBudgetItems(loginUser.userUuid(), familyUuid)));
  }

  @Operation(summary = "예산 항목 수정", description = "이름, 월 한도, 카테고리 묶음을 통째로 바꿉니다.")
  @ApiResponse(responseCode = "200", description = "수정 성공")
  @ApiResponse(responseCode = "404", description = "예산 항목을 찾을 수 없음")
  @ApiResponse(responseCode = "409", description = "이름이 같거나 다른 항목에 속한 카테고리")
  @PutMapping("/{budgetItemUuid}")
  public ResponseEntity<ApiSuccessResponse<BudgetItemResponse>> updateBudgetItem(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Parameter(description = "예산 항목 UUID") @PathVariable CustomUuid budgetItemUuid,
      @Valid @RequestBody BudgetItemRequest request) {
    BudgetItemResponse response =
        budgetItemService.updateBudgetItem(
            loginUser.userUuid(), familyUuid, budgetItemUuid, request);
    return ResponseEntity.ok(ApiSuccessResponse.of("예산 항목이 수정되었습니다", response));
  }

  @Operation(summary = "예산 항목 삭제", description = "예산 항목을 삭제합니다. 카테고리 묶음도 함께 사라집니다.")
  @ApiResponse(responseCode = "200", description = "삭제 성공")
  @ApiResponse(responseCode = "404", description = "예산 항목을 찾을 수 없음")
  @DeleteMapping("/{budgetItemUuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> deleteBudgetItem(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Parameter(description = "예산 항목 UUID") @PathVariable CustomUuid budgetItemUuid) {
    budgetItemService.deleteBudgetItem(loginUser.userUuid(), familyUuid, budgetItemUuid);
    return ResponseEntity.ok(ApiSuccessResponse.of("예산 항목이 삭제되었습니다", null));
  }
}
