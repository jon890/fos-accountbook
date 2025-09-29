import {
  CreateFamilyInviteData,
  FamilyInviteRepository,
  FamilyInviteWithDetails,
} from "@/repositories/interfaces/family-invite.repository";
import { IFamilyRepository } from "@/repositories/interfaces/family.repository";
import { IUserRepository } from "@/repositories/interfaces/user.repository";
import {
  InviteValidationReason,
  MemberRole,
  MemberStatus,
} from "@/types/enums";
import { FamilyInvite } from "@prisma/client";

export interface CreateInviteRequest {
  familyUuid: string;
  invitedBy: string;
  expiresInDays?: number;
  usageLimit?: number;
}

export interface JoinFamilyRequest {
  inviteCode: string;
  userUuid: string;
}

export interface InviteValidationResult {
  isValid: boolean;
  reason?: InviteValidationReason;
  invite?: FamilyInviteWithDetails;
}

export class FamilyInviteService {
  constructor(
    private readonly familyInviteRepository: FamilyInviteRepository,
    private readonly familyRepository: IFamilyRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * 초대 링크 생성
   */
  async createInvite(request: CreateInviteRequest): Promise<FamilyInvite> {
    // 관리자 권한 확인
    const isAdmin = await this.familyRepository.isAdmin(
      request.familyUuid,
      request.invitedBy
    );
    if (!isAdmin) {
      throw new Error("초대 링크는 관리자만 생성할 수 있습니다.");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (request.expiresInDays || 7)); // 기본 7일

    const inviteData: CreateFamilyInviteData = {
      familyUuid: request.familyUuid,
      invitedBy: request.invitedBy,
      expiresAt,
      usageLimit: request.usageLimit,
    };

    return await this.familyInviteRepository.createInvite(inviteData);
  }

  /**
   * 초대 코드로 초대 정보 조회
   */
  async getInviteByCode(
    inviteCode: string
  ): Promise<FamilyInviteWithDetails | null> {
    return await this.familyInviteRepository.findByInviteCode(inviteCode);
  }

  /**
   * 초대 코드 유효성 검사
   */
  async validateInvite(
    inviteCode: string,
    userUuid: string
  ): Promise<InviteValidationResult> {
    const invite = await this.familyInviteRepository.findByInviteCode(
      inviteCode
    );

    if (!invite) {
      return { isValid: false, reason: InviteValidationReason.NOT_FOUND };
    }

    // 만료 확인
    if (invite.expiresAt < new Date()) {
      return { isValid: false, reason: InviteValidationReason.EXPIRED, invite };
    }

    // 활성화 상태 확인
    if (!invite.isActive) {
      return {
        isValid: false,
        reason: InviteValidationReason.INACTIVE,
        invite,
      };
    }

    // 사용 횟수 제한 확인
    if (invite.usageLimit && invite.usedCount >= invite.usageLimit) {
      return {
        isValid: false,
        reason: InviteValidationReason.LIMIT_EXCEEDED,
        invite,
      };
    }

    // 이미 멤버인지 확인
    const isMember = await this.familyRepository.isMember(
      invite.familyUuid,
      userUuid
    );
    if (isMember) {
      return {
        isValid: false,
        reason: InviteValidationReason.ALREADY_MEMBER,
        invite,
      };
    }

    return { isValid: true, invite };
  }

  /**
   * 가족 가입 신청
   */
  async joinFamily(request: JoinFamilyRequest): Promise<{
    success: boolean;
    message: string;
    memberStatus?: string;
  }> {
    // 초대 코드 유효성 검사
    const validation = await this.validateInvite(
      request.inviteCode,
      request.userUuid
    );

    if (!validation.isValid || !validation.invite) {
      const messages = {
        [InviteValidationReason.EXPIRED.code]: "만료된 초대 링크입니다.",
        [InviteValidationReason.INACTIVE.code]: "비활성화된 초대 링크입니다.",
        [InviteValidationReason.LIMIT_EXCEEDED.code]:
          "초대 링크 사용 횟수가 초과되었습니다.",
        [InviteValidationReason.NOT_FOUND.code]:
          "유효하지 않은 초대 코드입니다.",
        [InviteValidationReason.ALREADY_MEMBER.code]:
          "이미 해당 가족의 멤버입니다.",
      };

      return {
        success: false,
        message:
          messages[
            validation.reason?.code || InviteValidationReason.NOT_FOUND.code
          ],
      };
    }

    try {
      // 가족 멤버로 추가 (pending 상태)
      await this.familyRepository.addMember(
        validation.invite.familyUuid,
        request.userUuid,
        MemberRole.MEMBER
      );

      // 초대 링크 사용 횟수 증가
      await this.familyInviteRepository.incrementUsageCount(
        validation.invite.uuid
      );

      return {
        success: true,
        message: "가입 신청이 완료되었습니다. 관리자의 승인을 기다려 주세요.",
        memberStatus: MemberStatus.PENDING.code,
      };
    } catch (error) {
      console.error("Error joining family:", error);
      return {
        success: false,
        message: "가입 신청 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 가입 신청 승인
   */
  async approveMember(
    familyUuid: string,
    userUuid: string,
    adminUuid: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // 관리자 권한 확인
    const isAdmin = await this.familyRepository.isAdmin(familyUuid, adminUuid);
    if (!isAdmin) {
      return {
        success: false,
        message: "멤버 승인은 관리자만 할 수 있습니다.",
      };
    }

    try {
      const success = await this.familyRepository.approveMember(
        familyUuid,
        userUuid
      );

      if (success) {
        return {
          success: true,
          message: "멤버 승인이 완료되었습니다.",
        };
      } else {
        return {
          success: false,
          message: "멤버 승인에 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("Error approving member:", error);
      return {
        success: false,
        message: "멤버 승인 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 가입 신청 거절
   */
  async rejectMember(
    familyUuid: string,
    userUuid: string,
    adminUuid: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // 관리자 권한 확인
    const isAdmin = await this.familyRepository.isAdmin(familyUuid, adminUuid);
    if (!isAdmin) {
      return {
        success: false,
        message: "멤버 거절은 관리자만 할 수 있습니다.",
      };
    }

    try {
      const success = await this.familyRepository.rejectMember(
        familyUuid,
        userUuid
      );

      if (success) {
        return {
          success: true,
          message: "가입 신청이 거절되었습니다.",
        };
      } else {
        return {
          success: false,
          message: "가입 신청 거절에 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("Error rejecting member:", error);
      return {
        success: false,
        message: "가입 신청 거절 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 대기 중인 멤버 목록 조회
   */
  async getPendingMembers(
    familyUuid: string,
    adminUuid: string
  ): Promise<Array<{
    id: string;
    role: string;
    status: string;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }> | null> {
    // 관리자 권한 확인
    const isAdmin = await this.familyRepository.isAdmin(familyUuid, adminUuid);
    if (!isAdmin) {
      return null;
    }

    const members = await this.familyRepository.getPendingMembers(familyUuid);
    return members.map((member) => ({
      ...member,
      role: member.role.code,
      status: member.status.code,
    }));
  }

  /**
   * 가족의 활성 초대 링크 목록 조회
   */
  async getActiveInvites(
    familyUuid: string,
    adminUuid: string
  ): Promise<FamilyInvite[] | null> {
    // 관리자 권한 확인
    const isAdmin = await this.familyRepository.isAdmin(familyUuid, adminUuid);
    if (!isAdmin) {
      return null;
    }

    return await this.familyInviteRepository.findActiveInvitesByFamily(
      familyUuid
    );
  }

  /**
   * 초대 링크 비활성화
   */
  async deactivateInvite(
    inviteUuid: string,
    adminUuid: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const invite = await this.familyInviteRepository.findById(inviteUuid);
      if (!invite) {
        return {
          success: false,
          message: "초대 링크를 찾을 수 없습니다.",
        };
      }

      // 관리자 권한 확인
      const isAdmin = await this.familyRepository.isAdmin(
        invite.familyUuid,
        adminUuid
      );
      if (!isAdmin) {
        return {
          success: false,
          message: "초대 링크 비활성화는 관리자만 할 수 있습니다.",
        };
      }

      await this.familyInviteRepository.deactivateInvite(inviteUuid);

      return {
        success: true,
        message: "초대 링크가 비활성화되었습니다.",
      };
    } catch (error) {
      console.error("Error deactivating invite:", error);
      return {
        success: false,
        message: "초대 링크 비활성화 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 만료된 초대 링크들 정리 (크론 작업용)
   */
  async cleanupExpiredInvites(): Promise<number> {
    return await this.familyInviteRepository.deactivateExpiredInvites();
  }
}
