package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.ApiSuccessResponse;
import com.bifos.accountbook.application.dto.category.CategoryResponse;
import com.bifos.accountbook.application.dto.category.CreateCategoryRequest;
import com.bifos.accountbook.application.dto.category.UpdateCategoryRequest;
import com.bifos.accountbook.application.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/families/{familyUuid}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * 카테고리 생성
     */
    @PostMapping
    public ResponseEntity<ApiSuccessResponse<CategoryResponse>> createCategory(
            Authentication authentication,
            @PathVariable UUID familyUuid,
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        String userId = authentication.getName();
        log.info("Creating category in family: {} by user: {}", familyUuid, userId);

        CategoryResponse response = categoryService.createCategory(userId, familyUuid, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiSuccessResponse.of("카테고리가 생성되었습니다", response));
    }

    /**
     * 가족의 카테고리 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiSuccessResponse<List<CategoryResponse>>> getFamilyCategories(
            Authentication authentication,
            @PathVariable UUID familyUuid
    ) {
        String userId = authentication.getName();
        log.info("Fetching categories for family: {} by user: {}", familyUuid, userId);

        List<CategoryResponse> categories = categoryService.getFamilyCategories(userId, familyUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of(categories));
    }

    /**
     * 카테고리 상세 조회
     */
    @GetMapping("/{categoryUuid}")
    public ResponseEntity<ApiSuccessResponse<CategoryResponse>> getCategory(
            Authentication authentication,
            @PathVariable UUID familyUuid,
            @PathVariable UUID categoryUuid
    ) {
        String userId = authentication.getName();
        log.info("Fetching category: {} by user: {}", categoryUuid, userId);

        CategoryResponse category = categoryService.getCategory(userId, categoryUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of(category));
    }

    /**
     * 카테고리 수정
     */
    @PutMapping("/{categoryUuid}")
    public ResponseEntity<ApiSuccessResponse<CategoryResponse>> updateCategory(
            Authentication authentication,
            @PathVariable UUID familyUuid,
            @PathVariable UUID categoryUuid,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        String userId = authentication.getName();
        log.info("Updating category: {} by user: {}", categoryUuid, userId);

        CategoryResponse response = categoryService.updateCategory(userId, categoryUuid, request);

        return ResponseEntity.ok(ApiSuccessResponse.of("카테고리가 수정되었습니다", response));
    }

    /**
     * 카테고리 삭제
     */
    @DeleteMapping("/{categoryUuid}")
    public ResponseEntity<ApiSuccessResponse<Void>> deleteCategory(
            Authentication authentication,
            @PathVariable UUID familyUuid,
            @PathVariable UUID categoryUuid
    ) {
        String userId = authentication.getName();
        log.info("Deleting category: {} by user: {}", categoryUuid, userId);

        categoryService.deleteCategory(userId, categoryUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of("카테고리가 삭제되었습니다", null));
    }
}

