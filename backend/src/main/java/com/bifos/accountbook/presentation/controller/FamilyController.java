package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.ApiSuccessResponse;
import com.bifos.accountbook.application.dto.family.CreateFamilyRequest;
import com.bifos.accountbook.application.dto.family.FamilyResponse;
import com.bifos.accountbook.application.dto.family.UpdateFamilyRequest;
import com.bifos.accountbook.application.service.FamilyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "가족 (Family)", description = "가족 생성, 조회, 수정, 삭제 API")
@Slf4j
@RestController
@RequestMapping("/families")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class FamilyController {

    private final FamilyService familyService;

    @Operation(summary = "가족 생성", description = "새로운 가족을 생성하고 생성한 사용자를 owner로 등록합니다.")
    @ApiResponse(responseCode = "201", description = "가족 생성 성공")
    @ApiResponse(responseCode = "401", description = "인증 실패")
    @PostMapping
    public ResponseEntity<ApiSuccessResponse<FamilyResponse>> createFamily(
            Authentication authentication,
            @Valid @RequestBody CreateFamilyRequest request) {
        String userId = authentication.getName();
        log.info("Creating family for user: {}", userId);

        FamilyResponse response = familyService.createFamily(userId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiSuccessResponse.of("가족이 생성되었습니다", response));
    }

    @Operation(summary = "내 가족 목록 조회", description = "현재 사용자가 속한 모든 가족 목록을 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping
    public ResponseEntity<ApiSuccessResponse<List<FamilyResponse>>> getUserFamilies(
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Fetching families for user: {}", userId);

        List<FamilyResponse> families = familyService.getUserFamilies(userId);

        return ResponseEntity.ok(ApiSuccessResponse.of(families));
    }

    @Operation(summary = "가족 상세 조회", description = "특정 가족의 상세 정보를 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @ApiResponse(responseCode = "404", description = "가족을 찾을 수 없음")
    @GetMapping("/{familyUuid}")
    public ResponseEntity<ApiSuccessResponse<FamilyResponse>> getFamily(
            Authentication authentication,
            @Parameter(description = "가족 UUID") @PathVariable String familyUuid) {
        String userId = authentication.getName();
        log.info("Fetching family: {} for user: {}", familyUuid, userId);

        FamilyResponse family = familyService.getFamily(userId, familyUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of(family));
    }

    @Operation(summary = "가족 정보 수정", description = "가족의 이름과 설명을 수정합니다. (owner 권한 필요)")
    @ApiResponse(responseCode = "200", description = "수정 성공")
    @ApiResponse(responseCode = "403", description = "권한 없음")
    @PutMapping("/{familyUuid}")
    public ResponseEntity<ApiSuccessResponse<FamilyResponse>> updateFamily(
            Authentication authentication,
            @Parameter(description = "가족 UUID") @PathVariable String familyUuid,
            @Valid @RequestBody UpdateFamilyRequest request) {
        String userId = authentication.getName();
        log.info("Updating family: {} by user: {}", familyUuid, userId);

        FamilyResponse response = familyService.updateFamily(userId, familyUuid, request);

        return ResponseEntity.ok(ApiSuccessResponse.of("가족 정보가 수정되었습니다", response));
    }

    @Operation(summary = "가족 삭제", description = "가족을 soft delete 합니다. (owner 권한 필요)")
    @ApiResponse(responseCode = "200", description = "삭제 성공")
    @ApiResponse(responseCode = "403", description = "권한 없음")
    @DeleteMapping("/{familyUuid}")
    public ResponseEntity<ApiSuccessResponse<Void>> deleteFamily(
            Authentication authentication,
            @Parameter(description = "가족 UUID") @PathVariable String familyUuid) {
        String userId = authentication.getName();
        log.info("Deleting family: {} by user: {}", familyUuid, userId);

        familyService.deleteFamily(userId, familyUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of("가족이 삭제되었습니다", null));
    }
}
