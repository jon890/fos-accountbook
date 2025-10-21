package com.bifos.accountbook.application.service;

import com.bifos.accountbook.common.exception.BusinessException;
import com.bifos.accountbook.common.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FamilyMemberRepository familyMemberRepository;

    /**
     * 사용자의 기본 가족 설정
     */
    @Transactional
    public void setDefaultFamily(CustomUuid userUuid, String familyUuid) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 사용자 확인
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)
                        .addParameter("userUuid", userUuid.toString()));

        // 사용자가 해당 가족의 구성원인지 확인
        FamilyMember familyMember = familyMemberRepository
                .findByFamilyUuidAndUserUuid(familyCustomUuid, userUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FAMILY_MEMBER)
                        .addParameter("familyUuid", familyUuid)
                        .addParameter("userUuid", userUuid.toString()));

        // 기본 가족 설정
        user.setDefaultFamilyUuid(familyCustomUuid);
        userRepository.save(user);

        log.info("Set default family for user: {} to family: {}", userUuid, familyUuid);
    }

    /**
     * 사용자의 기본 가족 조회
     */
    @Transactional(readOnly = true)
    public String getDefaultFamily(CustomUuid userUuid) {
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)
                        .addParameter("userUuid", userUuid.toString()));

        CustomUuid defaultFamilyUuid = user.getDefaultFamilyUuid();
        return defaultFamilyUuid != null ? defaultFamilyUuid.getValue() : null;
    }

    /**
     * 사용자 정보 조회
     */
    @Transactional(readOnly = true)
    public User getUser(CustomUuid userUuid) {
        return userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)
                        .addParameter("userUuid", userUuid.toString()));
    }
}

