import { FamilyInvite } from "@prisma/client";
import { BaseRepository } from "./base.repository";

export interface CreateInviteData {
  familyUuid: string;
  inviteCode: string;
  invitedBy: string;
  expiresAt: Date;
  usageLimit?: number | null;
}

export interface UpdateInviteData {
  usageLimit?: number | null;
  isActive?: boolean;
  usedCount?: number;
}

export interface CreateFamilyInviteData {
  familyUuid: string;
  invitedBy: string;
  expiresAt: Date;
  usageLimit?: number;
}

export interface FamilyInviteWithDetails extends FamilyInvite {
  family: {
    uuid: string;
    name: string;
  };
  inviter: {
    uuid: string;
    name: string | null;
    email: string;
  };
}

export interface FamilyInviteRepository
  extends BaseRepository<FamilyInvite, CreateInviteData, UpdateInviteData> {
  /**
   * 초대 링크 생성
   */
  createInvite(data: CreateFamilyInviteData): Promise<FamilyInvite>;

  /**
   * 초대 코드로 초대 정보 조회
   */
  findByInviteCode(inviteCode: string): Promise<FamilyInviteWithDetails | null>;

  /**
   * 가족의 활성 초대 링크 목록 조회
   */
  findActiveInvitesByFamily(familyUuid: string): Promise<FamilyInvite[]>;

  /**
   * 초대 링크 사용 횟수 증가
   */
  incrementUsageCount(uuid: string): Promise<FamilyInvite>;

  /**
   * 초대 링크 비활성화
   */
  deactivateInvite(uuid: string): Promise<FamilyInvite>;

  /**
   * 만료된 초대 링크들 비활성화
   */
  deactivateExpiredInvites(): Promise<number>;
}
