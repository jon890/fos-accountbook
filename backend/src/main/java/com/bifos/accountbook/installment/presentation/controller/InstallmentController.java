package com.bifos.accountbook.installment.presentation.controller;

import com.bifos.accountbook.installment.application.dto.InstallmentRequest;
import com.bifos.accountbook.installment.application.dto.InstallmentResponse;
import com.bifos.accountbook.installment.application.service.InstallmentService;
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

@Tag(name = "할부 (Installment)", description = "가족의 할부 기록 관리 API")
@RestController
@RequestMapping("/api/v1/families/{familyUuid}/installments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class InstallmentController {

  private final InstallmentService installmentService;

  @Operation(summary = "할부 등록", description = "총 금액, 개월 수, 첫 결제 월로 할부를 기록합니다. 지출은 만들지 않습니다.")
  @ApiResponse(responseCode = "201", description = "등록 성공")
  @ApiResponse(responseCode = "400", description = "입력이 올바르지 않음")
  @PostMapping
  public ResponseEntity<ApiSuccessResponse<InstallmentResponse>> createInstallment(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Valid @RequestBody InstallmentRequest request) {
    InstallmentResponse response =
        installmentService.createInstallment(loginUser.userUuid(), familyUuid, request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiSuccessResponse.of("할부가 등록되었습니다", response));
  }

  @Operation(summary = "할부 목록 조회", description = "첫 결제 월 순서로 이번 달 기준 진행 상황과 함께 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping
  public ResponseEntity<ApiSuccessResponse<List<InstallmentResponse>>> getInstallments(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid) {
    return ResponseEntity.ok(
        ApiSuccessResponse.of(
            installmentService.getInstallments(loginUser.userUuid(), familyUuid)));
  }

  @Operation(summary = "할부 수정", description = "이름, 총 금액, 개월 수, 첫 결제 월, 메모를 통째로 바꿉니다.")
  @ApiResponse(responseCode = "200", description = "수정 성공")
  @ApiResponse(responseCode = "404", description = "할부를 찾을 수 없음")
  @PutMapping("/{installmentUuid}")
  public ResponseEntity<ApiSuccessResponse<InstallmentResponse>> updateInstallment(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Parameter(description = "할부 UUID") @PathVariable CustomUuid installmentUuid,
      @Valid @RequestBody InstallmentRequest request) {
    InstallmentResponse response =
        installmentService.updateInstallment(
            loginUser.userUuid(), familyUuid, installmentUuid, request);
    return ResponseEntity.ok(ApiSuccessResponse.of("할부가 수정되었습니다", response));
  }

  @Operation(summary = "할부 삭제", description = "할부를 삭제합니다.")
  @ApiResponse(responseCode = "200", description = "삭제 성공")
  @ApiResponse(responseCode = "404", description = "할부를 찾을 수 없음")
  @DeleteMapping("/{installmentUuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> deleteInstallment(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Parameter(description = "할부 UUID") @PathVariable CustomUuid installmentUuid) {
    installmentService.deleteInstallment(loginUser.userUuid(), familyUuid, installmentUuid);
    return ResponseEntity.ok(ApiSuccessResponse.of("할부가 삭제되었습니다", null));
  }
}
