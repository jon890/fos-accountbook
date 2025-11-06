package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.UpdateUserProfileRequest;
import com.bifos.accountbook.application.dto.UserProfileResponse;
import com.bifos.accountbook.domain.entity.UserProfile;
import com.bifos.accountbook.domain.repository.UserProfileRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자 프로필 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;

    /**
     * 사용자 프로필 조회 (없으면 기본 프로필 생성)
     */
    @Transactional
    public UserProfileResponse getOrCreateProfile(CustomUuid userUuid) {
        UserProfile profile = userProfileRepository.findByUserUuid(userUuid)
                .orElseGet(() -> createDefaultProfile(userUuid));

        return UserProfileResponse.from(profile);
    }

    /**
     * 사용자 프로필 수정
     */
    @Transactional
    public UserProfileResponse updateProfile(CustomUuid userUuid, UpdateUserProfileRequest request) {
        UserProfile profile = userProfileRepository.findByUserUuid(userUuid)
                .orElseThrow(() -> new IllegalArgumentException("프로필을 찾을 수 없습니다: " + userUuid.getValue()));

        // 각 필드가 null이 아닐 때만 업데이트
        if (request.getTimezone() != null) {
            profile.updateTimezone(request.getTimezone());
        }
        if (request.getLanguage() != null) {
            profile.updateLanguage(request.getLanguage());
        }
        if (request.getCurrency() != null) {
            profile.updateCurrency(request.getCurrency());
        }

        UserProfile saved = userProfileRepository.save(profile);
        return UserProfileResponse.from(saved);
    }

    /**
     * 기본 프로필 생성
     */
    private UserProfile createDefaultProfile(CustomUuid userUuid) {
        UserProfile profile = UserProfile.createDefault(userUuid);
        return userProfileRepository.save(profile);
    }
}

