package com.bifos.accountbook.application.dto.profile;

import com.bifos.accountbook.domain.entity.UserProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 사용자 프로필 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private String userUuid;
    private String timezone;
    private String language;
    private String currency;
    private String defaultFamilyUuid;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Entity → DTO 변환
     */
    public static UserProfileResponse from(UserProfile profile) {
        return UserProfileResponse.builder()
                .userUuid(profile.getUserUuid().getValue())
                .timezone(profile.getTimezone())
                .language(profile.getLanguage())
                .currency(profile.getCurrency())
                .defaultFamilyUuid(profile.getDefaultFamilyUuid() != null ? 
                        profile.getDefaultFamilyUuid().getValue() : null)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}

