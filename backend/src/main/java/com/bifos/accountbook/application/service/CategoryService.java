package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.category.CategoryResponse;
import com.bifos.accountbook.application.dto.category.CreateCategoryRequest;
import com.bifos.accountbook.application.dto.category.UpdateCategoryRequest;
import com.bifos.accountbook.common.exception.BusinessException;
import com.bifos.accountbook.common.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.value.CategoryStatus;
import com.bifos.accountbook.domain.value.CustomUuid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final FamilyValidationService familyValidationService; // 가족 검증 로직

    /**
     * 카테고리 생성
     */
    @Transactional
    public CategoryResponse createCategory(CustomUuid userUuid, String familyUuid, CreateCategoryRequest request) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, familyCustomUuid);

        // 중복 확인
        categoryRepository.findByFamilyUuidAndName(familyCustomUuid, request.getName())
                .ifPresent(c -> {
                    throw new BusinessException(ErrorCode.CATEGORY_ALREADY_EXISTS)
                            .addParameter("familyUuid", familyCustomUuid.getValue())
                            .addParameter("categoryName", request.getName());
                });

        // 카테고리 생성
        Category category = Category.builder()
                .familyUuid(familyCustomUuid)
                .name(request.getName())
                .color(request.getColor() != null ? request.getColor() : "#6366f1")
                .icon(request.getIcon())
                .build();

        category = categoryRepository.save(category);

        return CategoryResponse.from(category);
    }

    /**
     * 가족의 카테고리 목록 조회
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getFamilyCategories(CustomUuid userUuid, String familyUuid) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, familyCustomUuid);

        List<Category> categories = categoryRepository.findAllByFamilyUuid(familyCustomUuid);

        return categories.stream()
                .map(CategoryResponse::from)
                .toList();
    }

    /**
     * 카테고리 상세 조회
     */
    @Transactional(readOnly = true)
    public CategoryResponse getCategory(CustomUuid userUuid, String categoryUuid) {
        CustomUuid categoryCustomUuid = CustomUuid.from(categoryUuid);

        Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                        .addParameter("categoryUuid", categoryCustomUuid.getValue()));

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, category.getFamilyUuid());

        return CategoryResponse.from(category);
    }

    /**
     * 카테고리 수정
     */
    @Transactional
    public CategoryResponse updateCategory(CustomUuid userUuid, String categoryUuid, UpdateCategoryRequest request) {
        CustomUuid categoryCustomUuid = CustomUuid.from(categoryUuid);

        Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                        .addParameter("categoryUuid", categoryCustomUuid.getValue()));

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, category.getFamilyUuid());

        // 이름 변경 시 중복 확인
        if (request.getName() != null && !request.getName().equals(category.getName())) {
            final String familyUuidStr = category.getFamilyUuid().getValue(); // final 변수 생성
            categoryRepository.findByFamilyUuidAndName(category.getFamilyUuid(), request.getName())
                    .ifPresent(c -> {
                        throw new BusinessException(ErrorCode.CATEGORY_ALREADY_EXISTS)
                                .addParameter("familyUuid", familyUuidStr)
                                .addParameter("categoryName", request.getName());
                    });
            category.updateName(request.getName());
        }

        if (request.getColor() != null) {
            category.updateColor(request.getColor());
        }

        if (request.getIcon() != null) {
            category.updateIcon(request.getIcon());
        }

        return CategoryResponse.from(category);
    }

    /**
     * 카테고리 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteCategory(CustomUuid userUuid, String categoryUuid) {
        CustomUuid categoryCustomUuid = CustomUuid.from(categoryUuid);

        Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                        .addParameter("categoryUuid", categoryCustomUuid.getValue()));

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, category.getFamilyUuid());

        category.delete();

        log.info("Deleted category: {} by user: {}", categoryUuid, userUuid);
    }

    /**
     * 가족 생성 시 기본 카테고리 자동 생성
     * FamilyService에서 호출됨 (권한 검증 불필요 - 가족 생성 시점)
     */
    @Transactional
    public void createDefaultCategoriesForFamily(CustomUuid familyUuid) {
        List<DefaultCategory> defaultCategories = Arrays.asList(
                new DefaultCategory("식비", "#ef4444", "🍚"),
                new DefaultCategory("카페", "#f59e0b", "☕"),
                new DefaultCategory("간식", "#ec4899", "🍰"),
                new DefaultCategory("생활비", "#10b981", "🏠"),
                new DefaultCategory("교통비", "#3b82f6", "🚗"),
                new DefaultCategory("쇼핑", "#8b5cf6", "🛍️"),
                new DefaultCategory("의료", "#06b6d4", "💊"),
                new DefaultCategory("문화생활", "#f43f5e", "🎬"),
                new DefaultCategory("교육", "#14b8a6", "📚"),
                new DefaultCategory("기타", "#6b7280", "📦"));

        for (DefaultCategory defaultCategory : defaultCategories) {
            Category category = Category.builder()
                    .familyUuid(familyUuid)
                    .name(defaultCategory.name)
                    .color(defaultCategory.color)
                    .icon(defaultCategory.icon)
                    .build();

            categoryRepository.save(category);
        }
    }

    /**
     * 기본 카테고리 정보를 담는 내부 클래스
     */
    private static class DefaultCategory {
        String name;
        String color;
        String icon;

        DefaultCategory(String name, String color, String icon) {
            this.name = name;
            this.color = color;
            this.icon = icon;
        }
    }
}
