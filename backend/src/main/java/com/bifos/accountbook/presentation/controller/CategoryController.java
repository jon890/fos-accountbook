package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.category.CategoryResponse;
import com.bifos.accountbook.application.dto.category.CreateCategoryRequest;
import com.bifos.accountbook.application.dto.category.UpdateCategoryRequest;
import com.bifos.accountbook.application.service.CategoryService;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
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

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CategoryController {

  private final CategoryService categoryService;

  /**
   * 카테고리 생성
   */
  @PostMapping("/families/{familyUuid}/categories")
  public ResponseEntity<ApiSuccessResponse<CategoryResponse>> createCategory(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @Valid @RequestBody CreateCategoryRequest request) {
    log.info("Creating category in family: {} by user: {}", familyUuid.getValue(), loginUser.userUuid());

    CategoryResponse response = categoryService.createCategory(loginUser.userUuid(), familyUuid, request);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiSuccessResponse.of("카테고리가 생성되었습니다", response));
  }

  /**
   * 가족의 카테고리 목록 조회
   */
  @GetMapping("/families/{familyUuid}/categories")
  public ResponseEntity<ApiSuccessResponse<List<CategoryResponse>>> getFamilyCategories(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid) {
    log.info("Fetching categories for family: {} by user: {}", familyUuid.getValue(), loginUser.userUuid());

    List<CategoryResponse> categories = categoryService.getFamilyCategories(loginUser.userUuid(), familyUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(categories));
  }

  /**
   * 카테고리 상세 조회
   */
  @GetMapping("/categories/{categoryUuid}")
  public ResponseEntity<ApiSuccessResponse<CategoryResponse>> getCategory(
      @LoginUser LoginUserDto loginUser,
      @PathVariable String categoryUuid) {
    log.info("Fetching category: {} by user: {}", categoryUuid, loginUser.userUuid());

    CategoryResponse category = categoryService.getCategory(loginUser.userUuid(), categoryUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(category));
  }

  /**
   * 카테고리 수정
   */
  @PutMapping("/categories/{categoryUuid}")
  public ResponseEntity<ApiSuccessResponse<CategoryResponse>> updateCategory(
      @LoginUser LoginUserDto loginUser,
      @PathVariable String categoryUuid,
      @Valid @RequestBody UpdateCategoryRequest request) {
    log.info("Updating category: {} by user: {}", categoryUuid, loginUser.userUuid());

    CategoryResponse response = categoryService.updateCategory(loginUser.userUuid(), categoryUuid, request);

    return ResponseEntity.ok(ApiSuccessResponse.of("카테고리가 수정되었습니다", response));
  }

  /**
   * 카테고리 삭제
   */
  @DeleteMapping("/categories/{categoryUuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> deleteCategory(
      @LoginUser LoginUserDto loginUser,
      @PathVariable String categoryUuid) {
    log.info("Deleting category: {} by user: {}", categoryUuid, loginUser.userUuid());

    categoryService.deleteCategory(loginUser.userUuid(), categoryUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of("카테고리가 삭제되었습니다", null));
  }
}
