package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.invitation.CreateInvitationRequest;
import com.bifos.accountbook.application.dto.invitation.InvitationResponse;
import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.Invitation;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.InvitationRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.FamilyUuid;
import com.bifos.accountbook.presentation.annotation.UserUuid;
import com.bifos.accountbook.presentation.annotation.ValidateFamilyAccess;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvitationService {

  private final InvitationRepository invitationRepository;
  private final FamilyRepository familyRepository;
  private final FamilyMemberRepository familyMemberRepository;
  private final UserService userService; // 사용자 조회

  private static final String TOKEN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  private static final int TOKEN_LENGTH = 32;
  private static final SecureRandom RANDOM = new SecureRandom();

  /**
   * 초대장 생성
   */
  @ValidateFamilyAccess
  @Transactional
  public InvitationResponse createInvitation(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid,
                                             CreateInvitationRequest request) {
    // 사용자 조회
    User user = userService.getUser(userUuid);

    Family family = familyRepository.findActiveByUuid(familyUuid)
                                    .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                                        .addParameter("familyUuid", familyUuid.getValue()));

    // 초대장 생성
    int expirationHours = request.getExpirationHours() != null ? request.getExpirationHours() : 72; // 기본 3일
    LocalDateTime expiresAt = LocalDateTime.now().plusHours(expirationHours);

    Invitation invitation = Invitation.builder()
                                      .familyUuid(familyUuid)
                                      .inviterUserUuid(user.getUuid())
                                      .token(generateToken())
                                      .expiresAt(expiresAt)
                                      .build();

    invitation = invitationRepository.save(invitation);
    log.info("Created invitation: {} for family: {} by user: {}", invitation.getUuid(), familyUuid.getValue(),
             userUuid);

    return InvitationResponse.fromWithFamilyName(invitation, family.getName());
  }

  /**
   * 가족의 활성 초대장 목록 조회
   */
  @ValidateFamilyAccess
  @Transactional(readOnly = true)
  public List<InvitationResponse> getFamilyInvitations(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid) {
    Family family = familyRepository.findActiveByUuid(familyUuid)
                                    .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                                        .addParameter("familyUuid", familyUuid.getValue()));

    List<Invitation> invitations = invitationRepository.findActiveByFamilyUuid(familyUuid,
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
                                                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INVITATION_TOKEN)
                                                    .addParameter("token", token));

    Family family = familyRepository.findActiveByUuid(invitation.getFamilyUuid())
                                    .orElseThrow(() -> new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                                        .addParameter("familyUuid", invitation.getFamilyUuid().getValue()));

    return InvitationResponse.fromWithFamilyName(invitation, family.getName());
  }

  /**
   * 초대 수락
   */
  @Transactional
  public void acceptInvitation(CustomUuid userUuid, String token) {
    User user = userService.getUser(userUuid);

    Invitation invitation = invitationRepository.findValidByToken(token, LocalDateTime.now())
                                                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INVITATION_TOKEN)
                                                    .addParameter("token", token));

    // 이미 가족 멤버인지 확인
    boolean alreadyMember = familyMemberRepository.existsActiveByFamilyUuidAndUserUuid(
        invitation.getFamilyUuid(), user.getUuid());

    if (alreadyMember) {
      throw new BusinessException(ErrorCode.ALREADY_FAMILY_MEMBER)
          .addParameter("userUuid", userUuid.getValue())
          .addParameter("familyUuid", invitation.getFamilyUuid().getValue());
    }

    // 가족 멤버로 추가
    FamilyMember member = FamilyMember.builder()
                                      .familyUuid(invitation.getFamilyUuid())
                                      .userUuid(user.getUuid())
                                      .role("member")
                                      .build();

    familyMemberRepository.save(member);
    invitation.accept();
  }

  /**
   * 초대장 삭제/취소
   */
  @Transactional
  public void deleteInvitation(CustomUuid userUuid, String invitationUuid) {
    CustomUuid invitationCustomUuid = CustomUuid.from(invitationUuid);

    User user = userService.getUser(userUuid);

    Invitation invitation = invitationRepository.findByUuid(invitationCustomUuid)
                                                .orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_NOT_FOUND)
                                                    .addParameter("invitationUuid", invitationUuid));

    // 권한 확인 (초대장 생성자 또는 가족 owner만 삭제 가능)
    validateInvitationDeletePermission(user.getUuid(), invitation);

    invitationRepository.delete(invitation);
    log.info("Deleted invitation: {} by user: {}", invitationUuid, userUuid);
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
                                                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FAMILY_MEMBER)
                                                        .addParameter("userUuid", userUuid.getValue())
                                                        .addParameter("familyUuid", invitation.getFamilyUuid().getValue()));

    if (!"owner".equals(membership.getRole())) {
      throw new BusinessException(ErrorCode.FORBIDDEN, "초대장을 삭제할 권한이 없습니다")
          .addParameter("userUuid", userUuid.getValue())
          .addParameter("familyUuid", invitation.getFamilyUuid().getValue())
          .addParameter("role", membership.getRole());
    }
  }
}
