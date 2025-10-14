package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.invitation.CreateInvitationRequest;
import com.bifos.accountbook.application.dto.invitation.InvitationResponse;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.Invitation;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.InvitationRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;

    private static final String TOKEN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int TOKEN_LENGTH = 32;
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * 초대장 생성
     */
    @Transactional
    public InvitationResponse createInvitation(String userId, String familyUuid, CreateInvitationRequest request) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인 (가족 멤버만 초대 가능)
        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        validateFamilyAccess(user.getUuid(), familyCustomUuid);

        Family family = familyRepository.findActiveByUuid(familyCustomUuid)
                .orElseThrow(() -> new IllegalArgumentException("가족을 찾을 수 없습니다"));

        // 초대장 생성
        int expirationHours = request.getExpirationHours() != null ? request.getExpirationHours() : 72; // 기본 3일
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(expirationHours);

        Invitation invitation = Invitation.builder()
                .familyUuid(familyCustomUuid)
                .inviterUserUuid(user.getUuid())
                .token(generateToken())
                .expiresAt(expiresAt)
                .build();

        invitation = invitationRepository.save(invitation);
        log.info("Created invitation: {} for family: {} by user: {}", invitation.getUuid(), familyUuid, userId);

        return InvitationResponse.fromWithFamilyName(invitation, family.getName());
    }

    /**
     * 가족의 활성 초대장 목록 조회
     */
    @Transactional(readOnly = true)
    public List<InvitationResponse> getFamilyInvitations(String userId, String familyUuid) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인
        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        validateFamilyAccess(user.getUuid(), familyCustomUuid);

        Family family = familyRepository.findActiveByUuid(familyCustomUuid)
                .orElseThrow(() -> new IllegalArgumentException("가족을 찾을 수 없습니다"));

        List<Invitation> invitations = invitationRepository.findActiveByFamilyUuid(familyCustomUuid,
                LocalDateTime.now());

        return invitations.stream()
                .map(inv -> InvitationResponse.fromWithFamilyName(inv, family.getName()))
                .collect(Collectors.toList());
    }

    /**
     * 초대장으로 가족 정보 조회 (공개 API - 인증 불필요)
     */
    @Transactional(readOnly = true)
    public InvitationResponse getInvitationByToken(String token) {
        Invitation invitation = invitationRepository.findValidByToken(token, LocalDateTime.now())
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않거나 만료된 초대장입니다"));

        Family family = familyRepository.findActiveByUuid(invitation.getFamilyUuid())
                .orElseThrow(() -> new IllegalArgumentException("가족을 찾을 수 없습니다"));

        return InvitationResponse.fromWithFamilyName(invitation, family.getName());
    }

    /**
     * 초대 수락
     */
    @Transactional
    public void acceptInvitation(String userId, String token) {
        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Invitation invitation = invitationRepository.findValidByToken(token, LocalDateTime.now())
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않거나 만료된 초대장입니다"));

        // 이미 가족 멤버인지 확인
        boolean alreadyMember = familyMemberRepository.existsByFamilyUuidAndUserUuidAndDeletedAtIsNull(
                invitation.getFamilyUuid(), user.getUuid());

        if (alreadyMember) {
            throw new IllegalStateException("이미 가족 멤버입니다");
        }

        // 가족 멤버로 추가
        FamilyMember member = FamilyMember.builder()
                .familyUuid(invitation.getFamilyUuid())
                .userUuid(user.getUuid())
                .role("member")
                .build();

        familyMemberRepository.save(member);

        // 초대장 사용 처리
        invitation.setStatus("ACCEPTED");
        invitationRepository.save(invitation);

        log.info("User: {} accepted invitation: {} and joined family: {}",
                userId, invitation.getUuid(), invitation.getFamilyUuid());
    }

    /**
     * 초대장 삭제/취소
     */
    @Transactional
    public void deleteInvitation(String userId, String invitationUuid) {
        CustomUuid invitationCustomUuid = CustomUuid.from(invitationUuid);

        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Invitation invitation = invitationRepository.findByUuid(invitationCustomUuid)
                .orElseThrow(() -> new IllegalArgumentException("초대장을 찾을 수 없습니다"));

        // 권한 확인 (초대장 생성자 또는 가족 owner만 삭제 가능)
        validateInvitationDeletePermission(user.getUuid(), invitation);

        invitationRepository.delete(invitation);
        log.info("Deleted invitation: {} by user: {}", invitationUuid, userId);
    }

    /**
     * 랜덤 토큰 생성
     */
    private String generateToken() {
        StringBuilder token = new StringBuilder(TOKEN_LENGTH);
        for (int i = 0; i < TOKEN_LENGTH; i++) {
            token.append(TOKEN_CHARS.charAt(RANDOM.nextInt(TOKEN_CHARS.length())));
        }
        return token.toString();
    }

    /**
     * 가족 접근 권한 확인
     */
    private void validateFamilyAccess(CustomUuid userUuid, CustomUuid familyUuid) {
        boolean isMember = familyMemberRepository.existsByFamilyUuidAndUserUuidAndDeletedAtIsNull(
                familyUuid, userUuid);

        if (!isMember) {
            throw new IllegalStateException("해당 가족에 접근할 권한이 없습니다");
        }
    }

    /**
     * 초대장 삭제 권한 확인
     */
    private void validateInvitationDeletePermission(CustomUuid userUuid, Invitation invitation) {
        // 초대장 생성자인지 확인
        if (invitation.getInviterUserUuid().equals(userUuid)) {
            return;
        }

        // 가족 owner인지 확인
        FamilyMember membership = familyMemberRepository.findByFamilyUuidAndUserUuid(
                        invitation.getFamilyUuid(), userUuid)
                .orElseThrow(() -> new IllegalStateException("해당 가족에 접근할 권한이 없습니다"));

        if (!"owner".equals(membership.getRole())) {
            throw new IllegalStateException("초대장을 삭제할 권한이 없습니다");
        }
    }
}
