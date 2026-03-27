package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.category.CategoryResponse;
import com.bifos.accountbook.application.dto.category.CreateCategoryRequest;
import com.bifos.accountbook.application.dto.category.UpdateCategoryRequest;
import com.bifos.accountbook.application.service.CategoryService;
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

@Tag(name = "카테고리 (Category)", description = "지출 카테고리 관리 API")
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class CategoryController {

  private final CategoryService categoryService;

  @Operation(summary = "카테고리 생성", description = "가족의 새 지출 카테고리를 생성합니다.")
  @ApiResponse(responseCode = "201", description = "생성 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @PostMapping("/families/{familyUuid}/categories")
  public ResponseEntity<ApiSuccessResponse<CategoryResponse>> createCategory(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Valid @RequestBody CreateCategoryRequest request) {
    log.info("Creating category in family: {} by user: {}", familyUuid.getValue(), loginUser.userUuid());

    CategoryResponse response = categoryService.createCategory(loginUser.userUuid(), familyUuid, request);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiSuccessResponse.of("카테고리가 생성되었습니다", response));
  }

  @Operation(summary = "카테고리 목록 조회", description = "가족의 모든 활성 카테고리 목록을 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/families/{familyUuid}/categories")
  public ResponseEntity<ApiSuccessResponse<List<CategoryResponse>>> getFamilyCategories(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid) {
    log.info("Fetching categories for family: {} by user: {}", familyUuid.getValue(), loginUser.userUuid());

    List<CategoryResponse> categories = categoryService.getFamilyCategories(loginUser.userUuid(), familyUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(categories));
  }

  @Operation(summary = "카테고리 상세 조회", description = "카테고리 UUID로 상세 정보를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @ApiResponse(responseCode = "404", description = "카테고리를 찾을 수 없음")
  @GetMapping("/categories/{categoryUuid}")
  public ResponseEntity<ApiSuccessResponse<CategoryResponse>> getCategory(
      @LoginUser LoginUserDto loginUser,
      @PathVariable String categoryUuid) {
    log.info("Fetching category: {} by user: {}", categoryUuid, loginUser.userUuid());

    CategoryResponse category = categoryService.getCategory(loginUser.userUuid(), categoryUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(category));
  }

  @Operation(summary = "카테고리 수정", description = "카테고리 정보를 수정합니다.")
  @ApiResponse(responseCode = "200", description = "수정 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @ApiResponse(responseCode = "404", description = "카테고리를 찾을 수 없음")
  @PutMapping("/categories/{categoryUuid}")
  public ResponseEntity<ApiSuccessResponse<CategoryResponse>> updateCategory(
      @LoginUser LoginUserDto loginUser,
      @PathVariable String categoryUuid,
      @Valid @RequestBody UpdateCategoryRequest request) {
    log.info("Updating category: {} by user: {}", categoryUuid, loginUser.userUuid());

    CategoryResponse response = categoryService.updateCategory(loginUser.userUuid(), categoryUuid, request);

    return ResponseEntity.ok(ApiSuccessResponse.of("카테고리가 수정되었습니다", response));
  }

  @Operation(summary = "카테고리 삭제", description = "카테고리를 삭제합니다. 해당 카테고리의 지출은 기본 카테고리로 이동됩니다.")
  @ApiResponse(responseCode = "200", description = "삭제 성공")
  @ApiResponse(responseCode = "400", description = "기본 카테고리는 삭제 불가")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @ApiResponse(responseCode = "404", description = "카테고리를 찾을 수 없음")
  @DeleteMapping("/categories/{categoryUuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> deleteCategory(
      @LoginUser LoginUserDto loginUser,
      @PathVariable String categoryUuid) {
    log.info("Deleting category: {} by user: {}", categoryUuid, loginUser.userUuid());

    categoryService.deleteCategory(loginUser.userUuid(), categoryUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of("카테고리가 삭제되었습니다", null));
  }
}
