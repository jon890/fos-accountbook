import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/utils";
import { FamilyInvite } from "@prisma/client";
import {
  FilterOptions,
  PaginationOptions,
  PaginationResult,
  SortOptions,
} from "../interfaces/base.repository";
import {
  CreateFamilyInviteData,
  CreateInviteData,
  FamilyInviteRepository,
  FamilyInviteWithDetails,
  UpdateInviteData,
} from "../interfaces/family-invite.repository";

export class FamilyInviteRepositoryImpl implements FamilyInviteRepository {
  async findById(id: string): Promise<FamilyInvite | null> {
    return prisma.familyInvite.findFirst({
      where: {
        uuid: id,
        deletedAt: null,
      },
    });
  }

  async findMany(limit?: number): Promise<FamilyInvite[]> {
    return prisma.familyInvite.findMany({
      where: {
        deletedAt: null,
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async create(data: CreateInviteData): Promise<FamilyInvite> {
    return prisma.familyInvite.create({
      data,
    });
  }

  async update(
    id: string,
    data: UpdateInviteData
  ): Promise<FamilyInvite | null> {
    try {
      return await prisma.familyInvite.update({
        where: { uuid: id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.familyInvite.update({
      where: { uuid: id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async createInvite(data: CreateFamilyInviteData): Promise<FamilyInvite> {
    const inviteCode = generateInviteCode();

    return prisma.familyInvite.create({
      data: {
        familyUuid: data.familyUuid,
        inviteCode,
        invitedBy: data.invitedBy,
        expiresAt: data.expiresAt,
        usageLimit: data.usageLimit,
      },
    });
  }

  async findByInviteCode(
    inviteCode: string
  ): Promise<FamilyInviteWithDetails | null> {
    return prisma.familyInvite.findFirst({
      where: {
        inviteCode,
        deletedAt: null,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        family: {
          select: {
            uuid: true,
            name: true,
          },
        },
        inviter: {
          select: {
            uuid: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findActiveInvitesByFamily(familyUuid: string): Promise<FamilyInvite[]> {
    return prisma.familyInvite.findMany({
      where: {
        familyUuid,
        deletedAt: null,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async incrementUsageCount(uuid: string): Promise<FamilyInvite> {
    return prisma.familyInvite.update({
      where: { uuid },
      data: {
        usedCount: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });
  }

  async deactivateInvite(uuid: string): Promise<FamilyInvite> {
    return prisma.familyInvite.update({
      where: { uuid },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  async deactivateExpiredInvites(): Promise<number> {
    const result = await prisma.familyInvite.updateMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        isActive: true,
        deletedAt: null,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return result.count;
  }

  // BaseRepository 인터페이스 구현
  async findAll(options?: {
    pagination?: PaginationOptions;
    sort?: SortOptions;
    filters?: FilterOptions;
  }): Promise<PaginationResult<FamilyInvite>> {
    const page = options?.pagination?.page || 1;
    const limit = options?.pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...options?.filters,
    };

    const orderBy: Record<string, "asc" | "desc"> = {};
    if (options?.sort) {
      orderBy[options.sort.field] = options.sort.order;
    } else {
      orderBy.createdAt = "desc";
    }

    const [data, total] = await Promise.all([
      prisma.familyInvite.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.familyInvite.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async softDelete(id: string): Promise<boolean> {
    try {
      await prisma.familyInvite.update({
        where: { uuid: id },
        data: {
          deletedAt: new Date(),
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async restore(id: string): Promise<boolean> {
    try {
      await prisma.familyInvite.update({
        where: { uuid: id },
        data: {
          deletedAt: null,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.familyInvite.count({
      where: {
        uuid: id,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async count(filters?: FilterOptions): Promise<number> {
    return prisma.familyInvite.count({
      where: {
        deletedAt: null,
        ...filters,
      },
    });
  }
}
