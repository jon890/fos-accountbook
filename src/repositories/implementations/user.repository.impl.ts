/**
 * User Repository 구현체
 */

import {
  IUserRepository,
  UserData,
  CreateUserData,
  UpdateUserData,
} from "../interfaces/user.repository";
import { PaginationResult, FilterOptions } from "../interfaces/base.repository";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialization";

export class UserRepositoryImpl implements IUserRepository {
  async findById(id: string): Promise<UserData | null> {
    const user = await prisma.user.findFirst({
      where: {
        id: BigInt(id),
        deletedAt: null,
      },
    });

    return user ? (serialize(user) as UserData) : null;
  }

  async findAll(options?: {
    pagination?: { page: number; limit: number };
    sort?: { field: string; order: "asc" | "desc" };
    filters?: FilterOptions;
  }): Promise<PaginationResult<UserData>> {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    // 필터 적용
    if (options?.filters?.email) {
      where.email = { contains: options.filters.email as string };
    }

    const page = options?.pagination?.page || 1;
    const limit = options?.pagination?.limit || 10;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: serialize(users) as UserData[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: CreateUserData): Promise<UserData> {
    const user = await prisma.user.create({
      data: {
        authId: data.authId,
        name: data.name || null,
        email: data.email,
        emailVerified: data.emailVerified || null,
        image: data.image || null,
      },
    });

    return serialize(user) as UserData;
  }

  async update(id: string, data: UpdateUserData): Promise<UserData | null> {
    try {
      const user = await prisma.user.update({
        where: { id: BigInt(id) },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.emailVerified !== undefined && {
            emailVerified: data.emailVerified,
          }),
          ...(data.image !== undefined && { image: data.image }),
          updatedAt: new Date(),
        },
      });

      return serialize(user) as UserData;
    } catch {
      return null;
    }
  }

  async softDelete(id: string): Promise<boolean> {
    try {
      await prisma.user.update({
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
      await prisma.user.update({
        where: { id: BigInt(id) },
        data: { deletedAt: null },
      });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        id: BigInt(id),
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async count(filters?: FilterOptions): Promise<number> {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters?.email) {
      where.email = { contains: filters.email as string };
    }

    return prisma.user.count({ where });
  }

  // User 특화 메서드들

  async findByAuthId(authId: string): Promise<UserData | null> {
    const user = await prisma.user.findUnique({
      where: { authId },
    });

    return user && !user.deletedAt ? (serialize(user) as UserData) : null;
  }

  async findByUuid(uuid: string): Promise<UserData | null> {
    const user = await prisma.user.findUnique({
      where: { uuid },
    });

    return user && !user.deletedAt ? (serialize(user) as UserData) : null;
  }

  async findByEmail(email: string): Promise<UserData | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user && !user.deletedAt ? (serialize(user) as UserData) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        email,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async existsByAuthId(authId: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        authId,
        deletedAt: null,
      },
    });
    return count > 0;
  }
}
