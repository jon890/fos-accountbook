/**
 * Expense Repository 구현체
 */

import {
  IExpenseRepository,
  ExpenseData,
  ExpenseWithCategory,
  CreateExpenseData,
  UpdateExpenseData,
} from "../interfaces/expense.repository";
import { PaginationResult, FilterOptions } from "../interfaces/base.repository";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialization";

export class ExpenseRepositoryImpl implements IExpenseRepository {
  async findById(id: string): Promise<ExpenseData | null> {
    const expense = await prisma.expense.findFirst({
      where: {
        uuid: id,
        deletedAt: null,
      },
    });

    return expense ? (serialize(expense) as ExpenseData) : null;
  }

  async findAll(options?: {
    pagination?: { page: number; limit: number };
    sort?: { field: string; order: "asc" | "desc" };
    filters?: FilterOptions;
  }): Promise<PaginationResult<ExpenseData>> {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    // filters에서 필요한 필드들을 추출
    if (options?.filters?.familyId) {
      where.familyUuid = options.filters.familyId;
    }

    if (options?.filters?.categoryId) {
      where.categoryUuid = options.filters.categoryId;
    }

    if (options?.filters?.startDate || options?.filters?.endDate) {
      const dateCondition: Record<string, Date> = {};
      if (options.filters.startDate)
        dateCondition.gte = options.filters.startDate as Date;
      if (options.filters.endDate)
        dateCondition.lte = options.filters.endDate as Date;
      where.date = dateCondition;
    }

    const page = options?.pagination?.page || 1;
    const limit = options?.pagination?.limit || 10;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      data: serialize(expenses) as ExpenseData[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: CreateExpenseData): Promise<ExpenseData> {
    const expense = await prisma.expense.create({
      data: {
        amount: data.amount,
        description: data.description || null,
        date: data.date || new Date(),
        familyUuid: data.familyId,
        categoryUuid: data.categoryId,
      },
    });

    return serialize(expense) as ExpenseData;
  }

  async update(
    id: string,
    data: UpdateExpenseData
  ): Promise<ExpenseData | null> {
    try {
      const expense = await prisma.expense.update({
        where: { uuid: id },
        data: {
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.date !== undefined && { date: data.date }),
          ...(data.categoryId !== undefined && {
            categoryUuid: data.categoryId,
          }),
          updatedAt: new Date(),
        },
      });

      return serialize(expense) as ExpenseData;
    } catch {
      return null;
    }
  }

  async softDelete(id: string): Promise<boolean> {
    try {
      await prisma.expense.update({
        where: { uuid: id },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async restore(id: string): Promise<boolean> {
    try {
      await prisma.expense.update({
        where: { uuid: id },
        data: { deletedAt: null },
      });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.expense.count({
      where: {
        uuid: id,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async count(filters?: FilterOptions): Promise<number> {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters?.familyId) {
      where.familyUuid = filters.familyId;
    }

    return prisma.expense.count({ where });
  }

  // Expense 특화 메서드들

  async findByFamilyId(
    familyId: string,
    options?: {
      categoryId?: string;
      startDate?: Date;
      endDate?: Date;
      pagination?: { page: number; limit: number };
    }
  ): Promise<PaginationResult<ExpenseWithCategory>> {
    const where: Record<string, unknown> = {
      familyUuid: familyId,
      deletedAt: null,
    };

    if (options?.categoryId) {
      where.categoryUuid = options.categoryId;
    }

    if (options?.startDate || options?.endDate) {
      const dateCondition: Record<string, Date> = {};
      if (options.startDate) dateCondition.gte = options.startDate;
      if (options.endDate) dateCondition.lte = options.endDate;
      where.date = dateCondition;
    }

    const page = options?.pagination?.page || 1;
    const limit = options?.pagination?.limit || 10;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: {
            select: {
              uuid: true,
              name: true,
              color: true,
              icon: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      data: this.mapToExpenseWithCategory(expenses),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByCategoryId(categoryId: string): Promise<ExpenseWithCategory[]> {
    const expenses = await prisma.expense.findMany({
      where: {
        categoryUuid: categoryId,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            uuid: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return this.mapToExpenseWithCategory(expenses);
  }

  async getTotalByFamilyId(
    familyId: string,
    filters?: {
      categoryId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<number> {
    const where: Record<string, unknown> = {
      familyUuid: familyId,
      deletedAt: null,
    };

    if (filters?.categoryId) {
      where.categoryUuid = filters.categoryId;
    }

    if (filters?.startDate || filters?.endDate) {
      const dateCondition: Record<string, Date> = {};
      if (filters.startDate) dateCondition.gte = filters.startDate;
      if (filters.endDate) dateCondition.lte = filters.endDate;
      where.date = dateCondition;
    }

    const result = await prisma.expense.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  async getMonthlyTotal(
    familyId: string,
    year: number,
    month: number
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.getTotalByFamilyId(familyId, { startDate, endDate });
  }

  async getCategoryTotals(
    familyId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<
    Array<{
      categoryId: string;
      categoryName: string;
      total: number;
      count: number;
    }>
  > {
    const where: Record<string, unknown> = {
      familyUuid: familyId,
      deletedAt: null,
    };

    if (filters?.startDate || filters?.endDate) {
      const dateCondition: Record<string, Date> = {};
      if (filters.startDate) dateCondition.gte = filters.startDate;
      if (filters.endDate) dateCondition.lte = filters.endDate;
      where.date = dateCondition;
    }

    const result = await prisma.expense.groupBy({
      by: ["categoryUuid"],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    // 카테고리 정보 조회
    const categoryIds = result.map((r) => r.categoryUuid);
    const categories = await prisma.category.findMany({
      where: {
        uuid: { in: categoryIds },
      },
      select: {
        uuid: true,
        name: true,
      },
    });

    const categoryMap = new Map(categories.map((c) => [c.uuid, c.name]));

    return result.map((r) => ({
      categoryId: r.categoryUuid,
      categoryName: categoryMap.get(r.categoryUuid) || "Unknown",
      total: Number(r._sum.amount || 0),
      count: r._count._all,
    }));
  }

  // Helper method to map expense with category
  private mapToExpenseWithCategory(expenses: unknown[]): ExpenseWithCategory[] {
    return expenses.map((expense) => {
      const expenseData = expense as Record<string, unknown>;
      const serializedExpense = serialize(expenseData) as Record<
        string,
        unknown
      >;
      const category = expenseData.category as Record<string, unknown>;
      return {
        ...serializedExpense,
        category: {
          id: category.uuid as string,
          name: category.name as string,
          color: category.color as string,
          icon: category.icon as string,
        },
      };
    }) as ExpenseWithCategory[];
  }
}
