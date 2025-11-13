package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.family.CreateFamilyRequest;
import com.bifos.accountbook.application.dto.family.FamilyResponse;
import com.bifos.accountbook.application.dto.family.UpdateFamilyRequest;
import com.bifos.accountbook.application.service.FamilyService;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Tag(name = "가족 (Family)", description = "가족 생성, 조회, 수정, 삭제 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/families")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class FamilyController {

  private final FamilyService familyService;

  @Operation(summary = "가족 생성", description = "새로운 가족을 생성하고 생성한 사용자를 owner로 등록합니다.")
  @ApiResponse(responseCode = "201", description = "가족 생성 성공")
  @ApiResponse(responseCode = "401", description = "인증 실패")
  @PostMapping
  public ResponseEntity<ApiSuccessResponse<FamilyResponse>> createFamily(
      @LoginUser LoginUserDto loginUser,
      @Valid @RequestBody CreateFamilyRequest request) {
    FamilyResponse response = familyService.createFamily(loginUser.userUuid(), request);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiSuccessResponse.of("가족이 생성되었습니다", response));
  }

  @Operation(summary = "내 가족 목록 조회", description = "현재 사용자가 속한 모든 가족 목록을 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping
  public ResponseEntity<ApiSuccessResponse<List<FamilyResponse>>> getUserFamilies(
      @LoginUser LoginUserDto loginUser) {
    List<FamilyResponse> families = familyService.getUserFamilies(loginUser.userUuid());

    return ResponseEntity.ok(ApiSuccessResponse.of(families));
  }

  @Operation(summary = "가족 상세 조회", description = "특정 가족의 상세 정보를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @ApiResponse(responseCode = "404", description = "가족을 찾을 수 없음")
  @GetMapping("/{familyUuid}")
  public ResponseEntity<ApiSuccessResponse<FamilyResponse>> getFamily(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid) {
    log.info("Fetching family: {} for user: {}", familyUuid.getValue(), loginUser.userUuid());

    FamilyResponse family = familyService.getFamily(loginUser.userUuid(), familyUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(family));
  }

  @Operation(summary = "가족 정보 수정", description = "가족의 이름과 설명을 수정합니다. (owner 권한 필요)")
  @ApiResponse(responseCode = "200", description = "수정 성공")
  @ApiResponse(responseCode = "403", description = "권한 없음")
  @PutMapping("/{familyUuid}")
  public ResponseEntity<ApiSuccessResponse<FamilyResponse>> updateFamily(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Valid @RequestBody UpdateFamilyRequest request) {
    log.info("Updating family: {} by user: {}", familyUuid.getValue(), loginUser.userUuid());

    FamilyResponse response = familyService.updateFamily(loginUser.userUuid(), familyUuid, request);

    return ResponseEntity.ok(ApiSuccessResponse.of("가족 정보가 수정되었습니다", response));
  }

  @Operation(summary = "가족 삭제", description = "가족을 soft delete 합니다. (owner 권한 필요)")
  @ApiResponse(responseCode = "200", description = "삭제 성공")
  @ApiResponse(responseCode = "403", description = "권한 없음")
  @DeleteMapping("/{familyUuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> deleteFamily(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid) {
    log.info("Deleting family: {} by user: {}", familyUuid.getValue(), loginUser.userUuid());

    familyService.deleteFamily(loginUser.userUuid(), familyUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of("가족이 삭제되었습니다", null));
  }
}
