/**
 * Invitation Service
 * 초대 링크 관련 비즈니스 로직 처리
 */

import {
  IInvitationRepository,
  InvitationData,
  CreateInvitationData,
} from "@/repositories/interfaces/invitation.repository";
import { IFamilyRepository } from "@/repositories/interfaces/family.repository";
import { IUserRepository } from "@/repositories/interfaces/user.repository";
import { randomBytes } from "crypto";

export class InvitationService {
  constructor(
    private invitationRepository: IInvitationRepository,
    private familyRepository: IFamilyRepository,
    private userRepository: IUserRepository
  ) {}

  /**
   * 초대 링크 생성
   * @param familyUuid 가족 UUID
   * @param createdByUserUuid 생성자 User UUID
   * @param expiresInHours 만료 시간 (시간 단위, 기본 24시간)
   */
  async createInvitation(
    familyUuid: string,
    createdByUserUuid: string,
    expiresInHours: number = 24
  ): Promise<InvitationData> {
    // 가족 존재 여부 확인
    const family = await this.familyRepository.findById(familyUuid);
    if (!family) {
      throw new Error("가족을 찾을 수 없습니다");
    }

    // 사용자가 해당 가족의 멤버인지 확인
    const isMember = await this.familyRepository.isMember(
      familyUuid,
      createdByUserUuid
    );
    if (!isMember) {
      throw new Error("가족 구성원만 초대 링크를 생성할 수 있습니다");
    }

    // 랜덤 토큰 생성 (32바이트 = 64자 hex)
    const token = randomBytes(32).toString("hex");

    // 만료 시간 계산
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const invitationData: CreateInvitationData = {
      familyUuid,
      createdByUuid: createdByUserUuid,
      token,
      expiresAt,
    };

    return await this.invitationRepository.create(invitationData);
  }

  /**
   * 토큰으로 초대 정보 조회
   */
  async getInvitationByToken(
    token: string
  ): Promise<InvitationData | null> {
    return await this.invitationRepository.findByToken(token);
  }

  /**
   * 초대 유효성 검증
   */
  async validateInvitation(token: string): Promise<{
    valid: boolean;
    invitation: InvitationData | null;
    reason?: string;
  }> {
    const invitation = await this.invitationRepository.findByToken(token);

    if (!invitation) {
      return { valid: false, invitation: null, reason: "초대 링크를 찾을 수 없습니다" };
    }

    if (invitation.usedAt) {
      return { valid: false, invitation, reason: "이미 사용된 초대 링크입니다" };
    }

    if (new Date() > invitation.expiresAt) {
      return { valid: false, invitation, reason: "만료된 초대 링크입니다" };
    }

    return { valid: true, invitation };
  }

  /**
   * 초대 수락 (가족에 멤버 추가)
   */
  async acceptInvitation(
    token: string,
    userAuthId: string
  ): Promise<{
    success: boolean;
    familyUuid?: string;
    message: string;
  }> {
    // 초대 유효성 검증
    const validation = await this.validateInvitation(token);
    if (!validation.valid || !validation.invitation) {
      return {
        success: false,
        message: validation.reason || "유효하지 않은 초대 링크입니다",
      };
    }

    const invitation = validation.invitation;

    // 사용자 UUID 가져오기
    const user = await this.userRepository.findByAuthId(userAuthId);
    if (!user) {
      return {
        success: false,
        message: "사용자 정보를 찾을 수 없습니다",
      };
    }

    // 이미 가족 멤버인지 확인
    const isAlreadyMember = await this.familyRepository.isMember(
      invitation.familyUuid,
      user.uuid
    );

    if (isAlreadyMember) {
      return {
        success: false,
        message: "이미 가족 구성원입니다",
      };
    }

    // 가족에 멤버로 추가
    const added = await this.familyRepository.addMember(
      invitation.familyUuid,
      user.uuid,
      "member"
    );

    if (!added) {
      return {
        success: false,
        message: "가족 추가에 실패했습니다",
      };
    }

    // 초대 사용 처리
    await this.invitationRepository.markAsUsed(invitation.uuid, user.uuid);

    return {
      success: true,
      familyUuid: invitation.familyUuid,
      message: "가족에 성공적으로 추가되었습니다",
    };
  }

  /**
   * 가족의 활성 초대 목록 조회
   */
  async getActiveInvitations(familyUuid: string): Promise<InvitationData[]> {
    return await this.invitationRepository.findActiveByFamilyUuid(familyUuid);
  }

  /**
   * 초대 삭제
   */
  async deleteInvitation(
    invitationId: string,
    userUuid: string
  ): Promise<boolean> {
    const invitation = await this.invitationRepository.findById(invitationId);
    
    if (!invitation) {
      throw new Error("초대를 찾을 수 없습니다");
    }

    // 삭제 권한 확인 (생성자 또는 관리자)
    const isAdmin = await this.familyRepository.isAdmin(
      invitation.familyUuid,
      userUuid
    );
    const isCreator = invitation.createdByUuid === userUuid;

    if (!isAdmin && !isCreator) {
      throw new Error("초대를 삭제할 권한이 없습니다");
    }

    return await this.invitationRepository.delete(invitationId);
  }

  /**
   * 만료된 초대 정리
   */
  async cleanupExpiredInvitations(): Promise<number> {
    return await this.invitationRepository.deleteExpired();
  }
}
