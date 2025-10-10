package com.bifos.accountbook.application.dto.category;

import com.bifos.accountbook.domain.entity.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    
    private UUID uuid;
    private UUID familyUuid;
    private String name;
    private String color;
    private String icon;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static CategoryResponse from(Category category) {
        return CategoryResponse.builder()
                .uuid(category.getUuid())
                .familyUuid(category.getFamilyUuid())
                .name(category.getName())
                .color(category.getColor())
                .icon(category.getIcon())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}

