package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 가족 관련 검증 로직을 담당하는 서비스
 * 순환 의존성을 피하기 위해 검증 로직만 분리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyValidationService {

    private final FamilyMemberRepository familyMemberRepository;
    private final FamilyRepository familyRepository;

    /**
     * 가족 접근 권한 확인
     * 사용자가 해당 가족의 멤버인지 확인
     *
     * @param userUuid   사용자 UUID
     * @param familyUuid 가족 UUID
     * @throws BusinessException 가족 멤버가 아닌 경우
     */
    @Transactional(readOnly = true)
    public void validateFamilyAccess(CustomUuid userUuid, CustomUuid familyUuid) {
        boolean isMember = familyMemberRepository.existsActiveByFamilyUuidAndUserUuid(
                familyUuid, userUuid);

        if (!isMember) {
            throw new BusinessException(ErrorCode.NOT_FAMILY_MEMBER)
                    .addParameter("userUuid", userUuid.getValue())
                    .addParameter("familyUuid", familyUuid.getValue());
        }
    }

    /**
     * 가족 소유자 권한 확인
     * 사용자가 해당 가족의 owner인지 확인
     *
     * @param userUuid   사용자 UUID
     * @param familyUuid 가족 UUID
     * @throws BusinessException 가족 멤버가 아니거나 owner가 아닌 경우
     */
    @Transactional(readOnly = true)
    public void validateFamilyOwner(CustomUuid userUuid, CustomUuid familyUuid) {
        FamilyMember membership = familyMemberRepository.findByFamilyUuidAndUserUuid(familyUuid, userUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FAMILY_MEMBER)
                        .addParameter("userUuid", userUuid.getValue())
                        .addParameter("familyUuid", familyUuid.getValue()));

        if (!"owner".equals(membership.getRole())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "가족 소유자만 이 작업을 수행할 수 있습니다")
                    .addParameter("userUuid", userUuid.getValue())
                    .addParameter("familyUuid", familyUuid.getValue())
                    .addParameter("role", membership.getRole());
        }
    }

    /**
     * 가족 멤버 여부 확인 (예외 발생 없이 boolean 반환)
     *
     * @param userUuid   사용자 UUID
     * @param familyUuid 가족 UUID
     * @return 가족 멤버 여부
     */
    @Transactional(readOnly = true)
    public boolean isFamilyMember(CustomUuid userUuid, CustomUuid familyUuid) {
        return familyMemberRepository.existsActiveByFamilyUuidAndUserUuid(
                familyUuid, userUuid);
    }

    /**
     * 가족 엔티티 조회
     * JPA 연관관계 설정을 위해 사용
     *
     * @param familyUuid 가족 UUID
     * @return Family 엔티티
     * @throws BusinessException 가족을 찾을 수 없는 경우
     */
    @Transactional(readOnly = true)
    public Family getFamily(CustomUuid familyUuid) {
        return familyRepository.findByUuid(familyUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                        .addParameter("familyUuid", familyUuid.getValue()));
    }

    /**
     * 가족 접근 권한 확인 + Family 엔티티 반환
     * 권한 확인과 엔티티 조회를 원자적으로 처리
     *
     * @param userUuid   사용자 UUID
     * @param familyUuid 가족 UUID
     * @return Family 엔티티
     * @throws BusinessException 가족을 찾을 수 없거나 가족 멤버가 아닌 경우
     */
    @Transactional(readOnly = true)
    public Family validateAndGetFamily(CustomUuid userUuid, CustomUuid familyUuid) {
        // 1. Family 엔티티 조회
        Family family = familyRepository.findByUuid(familyUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                        .addParameter("familyUuid", familyUuid.getValue()));

        // 2. 권한 확인
        boolean isMember = familyMemberRepository.existsActiveByFamilyUuidAndUserUuid(
                familyUuid, userUuid);

        if (!isMember) {
            throw new BusinessException(ErrorCode.NOT_FAMILY_MEMBER)
                    .addParameter("userUuid", userUuid.getValue())
                    .addParameter("familyUuid", familyUuid.getValue());
        }

        return family;
    }
}

