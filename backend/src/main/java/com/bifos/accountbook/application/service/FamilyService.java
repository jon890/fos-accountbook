package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.family.CreateFamilyRequest;
import com.bifos.accountbook.application.dto.family.FamilyResponse;
import com.bifos.accountbook.application.dto.family.UpdateFamilyRequest;
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

    /**
     * 가족 생성 (생성자를 owner로 자동 추가)
     */
    @Transactional
    public FamilyResponse createFamily(CustomUuid userUuid, CreateFamilyRequest request) {
        // 사용자 조회
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

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

        // memberCount 포함해서 반환 (방금 생성했으므로 1명)
        return FamilyResponse.fromWithMemberCount(family, 1);
    }

    /**
     * 사용자가 속한 가족 목록 조회
     */
    @Transactional(readOnly = true)
    public List<FamilyResponse> getUserFamilies(CustomUuid userUuid) {
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

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
    public FamilyResponse getFamily(String userId, String familyUuid) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인
        validateFamilyAccess(userId, familyCustomUuid);

        Family family = familyRepository.findActiveByUuid(familyCustomUuid)
                .orElseThrow(() -> new IllegalArgumentException("가족을 찾을 수 없습니다"));

        int memberCount = familyMemberRepository.countByFamilyUuid(familyCustomUuid);
        return FamilyResponse.fromWithMemberCount(family, memberCount);
    }

    /**
     * 가족 정보 수정
     */
    @Transactional
    public FamilyResponse updateFamily(String userId, String familyUuid, UpdateFamilyRequest request) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인 (owner만 수정 가능)
        validateFamilyOwner(userId, familyCustomUuid);

        Family family = familyRepository.findActiveByUuid(familyCustomUuid)
                .orElseThrow(() -> new IllegalArgumentException("가족을 찾을 수 없습니다"));

        family.setName(request.getName());
        family = familyRepository.save(family);

        log.info("Updated family: {} by user: {}", familyUuid, userId);

        int memberCount = familyMemberRepository.countByFamilyUuid(familyCustomUuid);
        return FamilyResponse.fromWithMemberCount(family, memberCount);
    }

    /**
     * 가족 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteFamily(String userId, String familyUuid) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인 (owner만 삭제 가능)
        validateFamilyOwner(userId, familyCustomUuid);

        Family family = familyRepository.findActiveByUuid(familyCustomUuid)
                .orElseThrow(() -> new IllegalArgumentException("가족을 찾을 수 없습니다"));

        family.setDeletedAt(LocalDateTime.now());
        familyRepository.save(family);

        log.info("Deleted family: {} by user: {}", familyUuid, userId);
    }

    /**
     * 가족 접근 권한 확인
     */
    private void validateFamilyAccess(String userId, CustomUuid familyUuid) {
        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        boolean isMember = familyMemberRepository.existsByFamilyUuidAndUserUuidAndDeletedAtIsNull(
                familyUuid, user.getUuid());

        if (!isMember) {
            throw new IllegalStateException("해당 가족에 접근할 권한이 없습니다");
        }
    }

    /**
     * 가족 소유자 권한 확인
     */
    private void validateFamilyOwner(String userId, CustomUuid familyUuid) {
        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        FamilyMember membership = familyMemberRepository.findByFamilyUuidAndUserUuid(familyUuid, user.getUuid())
                .orElseThrow(() -> new IllegalStateException("해당 가족에 접근할 권한이 없습니다"));

        if (!"owner".equals(membership.getRole())) {
            throw new IllegalStateException("가족 소유자만 이 작업을 수행할 수 있습니다");
        }
    }
}
