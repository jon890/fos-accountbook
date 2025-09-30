/**
 * Invitation Repository 인터페이스
 */

import { BaseRepository } from "./base.repository";

export interface InvitationData {
  id: string;
  uuid: string;
  familyUuid: string;
  createdByUuid: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  usedByUuid: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvitationData {
  familyUuid: string;
  createdByUuid: string;
  token: string;
  expiresAt: Date;
}

export interface UpdateInvitationData {
  usedAt?: Date;
  usedByUuid?: string;
}

export interface IInvitationRepository
  extends BaseRepository<
    InvitationData,
    CreateInvitationData,
    UpdateInvitationData
  > {
  // Invitation 특화 메서드
  findByToken(token: string): Promise<InvitationData | null>;
  findByFamilyUuid(familyUuid: string): Promise<InvitationData[]>;
  findActiveByFamilyUuid(familyUuid: string): Promise<InvitationData[]>;
  markAsUsed(
    invitationId: string,
    usedByUuid: string
  ): Promise<InvitationData | null>;
  deleteExpired(): Promise<number>;
}
