package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.family.CreateFamilyRequest;
import com.bifos.accountbook.application.dto.family.FamilyResponse;
import com.bifos.accountbook.application.dto.family.UpdateFamilyRequest;
import com.bifos.accountbook.common.exception.BusinessException;
import com.bifos.accountbook.common.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;
    private final CategoryService categoryService;
    private final FamilyValidationService familyValidationService;
    private final UserProfileService userProfileService;

    /**
     * 가족 생성 (생성자를 owner로 자동 추가 + 기본 카테고리 생성)
     * 첫 가족 생성 시 자동으로 기본 가족으로 설정
     */
    @Transactional
    public FamilyResponse createFamily(CustomUuid userUuid, CreateFamilyRequest request) {
        // 사용자 조회
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)
                        .addParameter("userUuid", userUuid.toString()));

        // 가족 생성
        Family family = Family.builder()
                .name(request.getName())
                .build();

        family = familyRepository.save(family);

        // 생성자를 owner로 추가
        FamilyMember member = FamilyMember.builder()
                .familyUuid(family.getUuid())
                .userUuid(user.getUuid())
                .role("owner")
                .build();

        familyMemberRepository.save(member);
        log.info("Added owner to family: {}", family.getUuid());

        // 기본 카테고리 생성 (CategoryService에 위임)
        categoryService.createDefaultCategoriesForFamily(family.getUuid());

        // 첫 가족인 경우 자동으로 기본 가족으로 설정
        int userFamilyCount = familyMemberRepository.countByUserUuid(userUuid);
        if (userFamilyCount == 1) {
            userProfileService.setDefaultFamily(userUuid, family.getUuid().getValue());
            log.info("Set first family as default for user: {}", userUuid);
        }

        // memberCount 포함해서 반환 (방금 생성했으므로 1명)
        return FamilyResponse.fromWithMemberCount(family, 1);
    }

    /**
     * 사용자가 속한 가족 목록 조회
     */
    @Transactional(readOnly = true)
    public List<FamilyResponse> getUserFamilies(CustomUuid userUuid) {
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)
                        .addParameter("userUuid", userUuid.toString()));

        // 사용자가 속한 가족 멤버십 조회
        List<FamilyMember> memberships = familyMemberRepository.findAllByUserUuid(user.getUuid());

        // 가족 정보 조회 (memberCount 포함)
        return memberships.stream()
                .map(FamilyMember::getFamilyUuid)
                .map(familyUuid -> {
                    Family family = familyRepository.findActiveByUuid(familyUuid).orElse(null);
                    if (family == null)
                        return null;

                    int memberCount = familyMemberRepository.countByFamilyUuid(familyUuid);
                    return FamilyResponse.fromWithMemberCount(family, memberCount);
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * 가족 상세 조회
     */
    @Transactional(readOnly = true)
    public FamilyResponse getFamily(CustomUuid userUuid, String familyUuid) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인
        validateFamilyAccess(userUuid, familyCustomUuid);

        Family family = familyRepository.findActiveByUuid(familyCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                        .addParameter("familyUuid", familyUuid));

        int memberCount = familyMemberRepository.countByFamilyUuid(familyCustomUuid);
        return FamilyResponse.fromWithMemberCount(family, memberCount);
    }

    /**
     * 가족 정보 수정
     */
    @Transactional
    public FamilyResponse updateFamily(CustomUuid userUuid, String familyUuid, UpdateFamilyRequest request) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인 (owner만 수정 가능)
        validateFamilyOwner(userUuid, familyCustomUuid);

        Family family = familyRepository.findActiveByUuid(familyCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                        .addParameter("familyUuid", familyUuid));

        family.setName(request.getName());

        int memberCount = familyMemberRepository.countByFamilyUuid(familyCustomUuid);
        return FamilyResponse.fromWithMemberCount(family, memberCount);
    }

    /**
     * 가족 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteFamily(CustomUuid userUuid, String familyUuid) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인 (owner만 삭제 가능)
        validateFamilyOwner(userUuid, familyCustomUuid);

        Family family = familyRepository.findActiveByUuid(familyCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                        .addParameter("familyUuid", familyUuid));

        family.setDeletedAt(LocalDateTime.now());
        // 더티 체킹으로 자동 업데이트

        log.info("Deleted family: {} by user: {}", familyUuid, userUuid);
    }

    /**
     * 가족 접근 권한 확인
     * FamilyValidationService로 위임
     */
    private void validateFamilyAccess(CustomUuid userUuid, CustomUuid familyUuid) {
        familyValidationService.validateFamilyAccess(userUuid, familyUuid);
    }

    /**
     * 가족 소유자 권한 확인
     * FamilyValidationService로 위임
     */
    private void validateFamilyOwner(CustomUuid userUuid, CustomUuid familyUuid) {
        familyValidationService.validateFamilyOwner(userUuid, familyUuid);
    }
}
