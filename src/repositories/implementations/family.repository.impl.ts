/**
 * Family Repository 구현
 */

import { prisma } from "@/lib/prisma";
import {
  MemberRole as AppMemberRole,
  MemberStatus as AppMemberStatus,
} from "@/types/enums";
import {
  MemberRole as PrismaMemberRole,
  MemberStatus as PrismaMemberStatus,
} from "@prisma/client";
import {
  FilterOptions,
  PaginationOptions,
  PaginationResult,
  SortOptions,
} from "../interfaces/base.repository";
import {
  CreateFamilyData,
  FamilyData,
  FamilyWithDetails,
  IFamilyRepository,
  UpdateFamilyData,
} from "../interfaces/family.repository";

export class FamilyRepositoryImpl implements IFamilyRepository {
  async findById(id: string): Promise<FamilyData | null> {
    const family = await prisma.family.findFirst({
      where: {
        id: BigInt(id),
        deletedAt: null,
      },
    });

    if (!family) return null;

    return this.mapToFamilyData(family);
  }

  async findWithDetails(id: string): Promise<FamilyWithDetails | null> {
    const family = await prisma.family.findFirst({
      where: {
        id: BigInt(id),
        deletedAt: null,
      },
      include: {
        members: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        categories: {
          where: { deletedAt: null },
          select: {
            uuid: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        _count: {
          select: {
            expenses: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!family) return null;

    return this.mapToFamilyWithDetails(family);
  }

  async findByUserUuid(userUuid: string): Promise<FamilyWithDetails | null> {
    const family = await prisma.family.findFirst({
      where: {
        members: {
          some: {
            userUuid: userUuid,
            deletedAt: null,
          },
        },
        deletedAt: null,
      },
      include: {
        members: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        categories: {
          where: { deletedAt: null },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!family) return null;

    return this.mapToFamilyWithDetails(family);
  }

  async findAllByUserUuid(userUuid: string): Promise<FamilyWithDetails[]> {
    const families = await prisma.family.findMany({
      where: {
        members: {
          some: {
            userUuid: userUuid,
            deletedAt: null,
          },
        },
        deletedAt: null,
      },
      include: {
        members: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        categories: {
          where: { deletedAt: null },
          select: {
            uuid: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        _count: {
          select: {
            expenses: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return families.map((family) => this.mapToFamilyWithDetails(family));
  }

  async findAll(options?: {
    pagination?: PaginationOptions;
    sort?: SortOptions;
    filters?: FilterOptions;
  }): Promise<PaginationResult<FamilyData>> {
    const { pagination, sort, filters } = options || {};

    const where = {
      deletedAt: null,
      ...filters,
    };

    const [families, total] = await Promise.all([
      prisma.family.findMany({
        where,
        ...(pagination && {
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
        }),
        ...(sort && {
          orderBy: { [sort.field]: sort.order },
        }),
      }),
      prisma.family.count({ where }),
    ]);

    return {
      data: families.map((family) => this.mapToFamilyData(family)),
      pagination: {
        page: pagination?.page || 1,
        limit: pagination?.limit || families.length,
        total,
        totalPages: pagination ? Math.ceil(total / pagination.limit) : 1,
      },
    };
  }

  async create(data: CreateFamilyData): Promise<FamilyData> {
    let defaultCategories = data.categories || [
      { name: "식비", color: "#ef4444", icon: "🍽️" },
      { name: "교통", color: "#3b82f6", icon: "🚗" },
      { name: "쇼핑", color: "#8b5cf6", icon: "🛍️" },
      { name: "의료", color: "#10b981", icon: "🏥" },
      { name: "문화", color: "#f59e0b", icon: "🎭" },
      { name: "기타", color: "#6b7280", icon: "📝" },
    ];

    // 개인 사용인 경우 추가 카테고리
    if (data.type === "personal") {
      defaultCategories = [
        ...defaultCategories,
        { name: "용돈", color: "#ec4899", icon: "💰" },
        { name: "저축", color: "#059669", icon: "🏦" },
      ];
    }

    const family = await prisma.family.create({
      data: {
        name: data.name,
        categories: {
          createMany: {
            data: defaultCategories,
          },
        },
      },
    });

    return this.mapToFamilyData(family);
  }

  async update(id: string, data: UpdateFamilyData): Promise<FamilyData | null> {
    try {
      const family = await prisma.family.update({
        where: { id: BigInt(id) },
        data,
      });

      return this.mapToFamilyData(family);
    } catch {
      return null;
    }
  }

  async softDelete(id: string): Promise<boolean> {
    try {
      await prisma.family.update({
        where: { id: BigInt(id) },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async restore(id: string): Promise<boolean> {
    try {
      await prisma.family.update({
        where: { id: BigInt(id) },
        data: { deletedAt: null },
      });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.family.count({
      where: {
        id: BigInt(id),
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async count(filters?: FilterOptions): Promise<number> {
    return await prisma.family.count({
      where: {
        deletedAt: null,
        ...filters,
      },
    });
  }

  async addMember(
    familyId: string,
    userUuid: string,
    role: AppMemberRole = AppMemberRole.MEMBER
  ): Promise<boolean> {
    try {
      await prisma.familyMember.create({
        data: {
          familyUuid: familyId,
          userUuid: userUuid,
          role: role.code as PrismaMemberRole,
          status: AppMemberStatus.ACTIVE.code as PrismaMemberStatus, // 멤버를 바로 활성 상태로 설정
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async removeMember(familyId: string, userUuid: string): Promise<boolean> {
    try {
      await prisma.familyMember.updateMany({
        where: {
          familyUuid: familyId,
          userUuid: userUuid,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async updateMemberRole(
    familyId: string,
    userUuid: string,
    role: AppMemberRole
  ): Promise<boolean> {
    try {
      await prisma.familyMember.updateMany({
        where: {
          familyUuid: familyId,
          userUuid: userUuid,
          deletedAt: null,
        },
        data: { role: role.code as PrismaMemberRole },
      });
      return true;
    } catch {
      return false;
    }
  }

  async updateMemberStatus(
    familyId: string,
    userUuid: string,
    status: AppMemberStatus
  ): Promise<boolean> {
    try {
      await prisma.familyMember.updateMany({
        where: {
          familyUuid: familyId,
          userUuid: userUuid,
          deletedAt: null,
        },
        data: { status: status.code as PrismaMemberStatus },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getPendingMembers(familyId: string): Promise<
    Array<{
      id: string;
      role: AppMemberRole;
      status: AppMemberStatus;
      joinedAt: Date;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
      };
    }>
  > {
    const members = await prisma.familyMember.findMany({
      where: {
        familyUuid: familyId,
        status: AppMemberStatus.PENDING.code as PrismaMemberStatus,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return members.map((member) => ({
      id: String(member.id),
      role: AppMemberRole.fromCode(member.role),
      status: AppMemberStatus.fromCode(member.status),
      joinedAt: member.joinedAt,
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
      },
    }));
  }

  async approveMember(familyId: string, userUuid: string): Promise<boolean> {
    return this.updateMemberStatus(familyId, userUuid, AppMemberStatus.ACTIVE);
  }

  async rejectMember(familyId: string, userUuid: string): Promise<boolean> {
    return this.updateMemberStatus(
      familyId,
      userUuid,
      AppMemberStatus.REJECTED
    );
  }

  async isMember(familyId: string, userUuid: string): Promise<boolean> {
    const count = await prisma.familyMember.count({
      where: {
        familyUuid: familyId,
        userUuid: userUuid,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async isAdmin(familyId: string, userUuid: string): Promise<boolean> {
    const count = await prisma.familyMember.count({
      where: {
        familyUuid: familyId,
        userUuid: userUuid,
        role: AppMemberRole.ADMIN.code as PrismaMemberRole,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  // Helper methods
  private mapToFamilyData(family: Record<string, unknown>): FamilyData {
    return {
      id: String(family.id),
      uuid: family.uuid as string,
      name: family.name as string,
      createdAt: family.createdAt as Date,
      updatedAt: family.updatedAt as Date,
      deletedAt: family.deletedAt as Date | null,
    };
  }

  private mapToFamilyWithDetails(
    family: Record<string, unknown>
  ): FamilyWithDetails {
    return {
      ...this.mapToFamilyData(family),
      members: (family.members as Record<string, unknown>[]).map((member) => ({
        id: String(member.id),
        role: AppMemberRole.fromCode(member.role as string),
        status: AppMemberStatus.fromCode(member.status as string),
        joinedAt: member.joinedAt as Date,
        user: {
          id: String((member.user as Record<string, unknown>).id),
          name: (member.user as Record<string, unknown>).name as string | null,
          email: (member.user as Record<string, unknown>).email as
            | string
            | null,
          image: (member.user as Record<string, unknown>).image as
            | string
            | null,
        },
      })),
      categories: (family.categories as Record<string, unknown>[]).map(
        (category) => ({
          id: category.uuid as string,
          name: category.name as string,
          color: category.color as string,
          icon: category.icon as string,
        })
      ),
      _count: family._count as { expenses: number } | undefined,
    };
  }
}
