package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.category.CategoryResponse;
import com.bifos.accountbook.application.dto.category.CreateCategoryRequest;
import com.bifos.accountbook.application.dto.category.UpdateCategoryRequest;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;

    /**
     * 카테고리 생성
     */
    @Transactional
    public CategoryResponse createCategory(String userId, UUID familyUuid, CreateCategoryRequest request) {
        // 권한 확인
        validateFamilyAccess(userId, familyUuid);

        // 중복 확인
        categoryRepository.findByFamilyUuidAndName(familyUuid, request.getName())
                .ifPresent(c -> {
                    throw new IllegalStateException("이미 존재하는 카테고리 이름입니다");
                });

        // 카테고리 생성
        Category category = Category.builder()
                .familyUuid(familyUuid)
                .name(request.getName())
                .color(request.getColor() != null ? request.getColor() : "#6366f1")
                .icon(request.getIcon())
                .build();

        category = categoryRepository.save(category);
        log.info("Created category: {} in family: {} by user: {}", category.getUuid(), familyUuid, userId);

        return CategoryResponse.from(category);
    }

    /**
     * 가족의 카테고리 목록 조회
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getFamilyCategories(String userId, UUID familyUuid) {
        // 권한 확인
        validateFamilyAccess(userId, familyUuid);

        List<Category> categories = categoryRepository.findAllByFamilyUuid(familyUuid);

        return categories.stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 카테고리 상세 조회
     */
    @Transactional(readOnly = true)
    public CategoryResponse getCategory(String userId, UUID categoryUuid) {
        Category category = categoryRepository.findActiveByUuid(categoryUuid)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다"));

        // 권한 확인
        validateFamilyAccess(userId, category.getFamilyUuid());

        return CategoryResponse.from(category);
    }

    /**
     * 카테고리 수정
     */
    @Transactional
    public CategoryResponse updateCategory(String userId, UUID categoryUuid, UpdateCategoryRequest request) {
        Category category = categoryRepository.findActiveByUuid(categoryUuid)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다"));

        // 권한 확인
        validateFamilyAccess(userId, category.getFamilyUuid());

        // 이름 변경 시 중복 확인
        if (request.getName() != null && !request.getName().equals(category.getName())) {
            categoryRepository.findByFamilyUuidAndName(category.getFamilyUuid(), request.getName())
                    .ifPresent(c -> {
                        throw new IllegalStateException("이미 존재하는 카테고리 이름입니다");
                    });
            category.setName(request.getName());
        }

        if (request.getColor() != null) {
            category.setColor(request.getColor());
        }

        if (request.getIcon() != null) {
            category.setIcon(request.getIcon());
        }

        category = categoryRepository.save(category);
        log.info("Updated category: {} by user: {}", categoryUuid, userId);

        return CategoryResponse.from(category);
    }

    /**
     * 카테고리 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteCategory(String userId, UUID categoryUuid) {
        Category category = categoryRepository.findActiveByUuid(categoryUuid)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다"));

        // 권한 확인
        validateFamilyAccess(userId, category.getFamilyUuid());

        category.setDeletedAt(LocalDateTime.now());
        categoryRepository.save(category);

        log.info("Deleted category: {} by user: {}", categoryUuid, userId);
    }

    /**
     * 가족 접근 권한 확인
     */
    private void validateFamilyAccess(String userId, UUID familyUuid) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        boolean isMember = familyMemberRepository.existsByFamilyUuidAndUserUuidAndDeletedAtIsNull(
                familyUuid, user.getUuid()
        );

        if (!isMember) {
            throw new IllegalStateException("해당 가족에 접근할 권한이 없습니다");
        }
    }
}

