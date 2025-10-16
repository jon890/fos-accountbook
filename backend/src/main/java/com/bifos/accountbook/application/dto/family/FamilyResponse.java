package com.bifos.accountbook.application.dto.family;

import com.bifos.accountbook.domain.entity.Family;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyResponse {

    private String uuid;
    private String name;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer memberCount;

    public static FamilyResponse from(Family family) {
        return FamilyResponse.builder()
                .uuid(family.getUuid().getValue())
                .name(family.getName())
                .createdAt(family.getCreatedAt())
                .updatedAt(family.getUpdatedAt())
                .memberCount(family.getMembers() != null ? family.getMembers().size() : 0)
                .build();
    }
    
    public static FamilyResponse fromWithMemberCount(Family family, int memberCount) {
        return FamilyResponse.builder()
                .uuid(family.getUuid().getValue())
                .name(family.getName())
                .createdAt(family.getCreatedAt())
                .updatedAt(family.getUpdatedAt())
                .memberCount(memberCount)
                .build();
    }
}
