/**
 * Invitation Repository 구현체
 */

import { prisma } from "@/lib/prisma";
import {
  FilterOptions,
  PaginationResult,
} from "../interfaces/base.repository";
import {
  CreateInvitationData,
  IInvitationRepository,
  InvitationData,
  UpdateInvitationData,
} from "../interfaces/invitation.repository";

export class InvitationRepositoryImpl implements IInvitationRepository {
  async findById(id: string): Promise<InvitationData | null> {
    const invitation = await prisma.invitation.findFirst({
      where: {
        uuid: id,
      },
    });

    if (!invitation) return null;

    return this.mapToInvitationData(invitation);
  }

  async findAll(options?: {
    pagination?: { page: number; limit: number };
    sort?: { field: string; order: "asc" | "desc" };
    filters?: FilterOptions;
  }): Promise<PaginationResult<InvitationData>> {
    const page = options?.pagination?.page || 1;
    const limit = options?.pagination?.limit || 10;

    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invitation.count(),
    ]);

    return {
      data: invitations.map(this.mapToInvitationData),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: CreateInvitationData): Promise<InvitationData> {
    const invitation = await prisma.invitation.create({
      data: {
        familyUuid: data.familyUuid,
        createdByUuid: data.createdByUuid,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    });

    return this.mapToInvitationData(invitation);
  }

  async update(
    id: string,
    data: UpdateInvitationData
  ): Promise<InvitationData | null> {
    try {
      const invitation = await prisma.invitation.update({
        where: { uuid: id },
        data: {
          ...(data.usedAt !== undefined && { usedAt: data.usedAt }),
          ...(data.usedByUuid !== undefined && {
            usedByUuid: data.usedByUuid,
          }),
          updatedAt: new Date(),
        },
      });

      return this.mapToInvitationData(invitation);
    } catch {
      return null;
    }
  }

  async softDelete(_id: string): Promise<boolean> {
    // Invitation은 soft delete 대신 물리적 삭제 사용
    return this.delete(_id);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.invitation.delete({
        where: { uuid: id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async restore(_id: string): Promise<boolean> {
    // Invitation은 restore 불필요
    return false;
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.invitation.count({
      where: {
        uuid: id,
      },
    });
    return count > 0;
  }

  async count(filters?: FilterOptions): Promise<number> {
    return prisma.invitation.count();
  }

  // Invitation 특화 메서드들

  async findByToken(token: string): Promise<InvitationData | null> {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) return null;

    return this.mapToInvitationData(invitation);
  }

  async findByFamilyUuid(familyUuid: string): Promise<InvitationData[]> {
    const invitations = await prisma.invitation.findMany({
      where: {
        familyUuid,
      },
      orderBy: { createdAt: "desc" },
    });

    return invitations.map(this.mapToInvitationData);
  }

  async findActiveByFamilyUuid(familyUuid: string): Promise<InvitationData[]> {
    const now = new Date();
    const invitations = await prisma.invitation.findMany({
      where: {
        familyUuid,
        usedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return invitations.map(this.mapToInvitationData);
  }

  async markAsUsed(
    invitationId: string,
    usedByUuid: string
  ): Promise<InvitationData | null> {
    try {
      const invitation = await prisma.invitation.update({
        where: { uuid: invitationId },
        data: {
          usedAt: new Date(),
          usedByUuid,
        },
      });

      return this.mapToInvitationData(invitation);
    } catch {
      return null;
    }
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await prisma.invitation.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
        usedAt: null,
      },
    });

    return result.count;
  }

  // Helper method
  private mapToInvitationData(invitation: {
    id: bigint;
    uuid: string;
    familyUuid: string;
    createdByUuid: string;
    token: string;
    expiresAt: Date;
    usedAt: Date | null;
    usedByUuid: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): InvitationData {
    return {
      id: invitation.id.toString(),
      uuid: invitation.uuid,
      familyUuid: invitation.familyUuid,
      createdByUuid: invitation.createdByUuid,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      usedAt: invitation.usedAt,
      usedByUuid: invitation.usedByUuid,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }
}
