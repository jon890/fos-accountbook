/**
 * Expense Service
 * 지출 관련 비즈니스 로직 처리
 */

import {
  IExpenseRepository,
  ExpenseWithCategory,
  CreateExpenseData,
  UpdateExpenseData,
} from "@/repositories/interfaces/expense.repository";
import { PaginationResult } from "@/repositories/interfaces/base.repository";

export interface ExpenseFilters {
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ExpenseQueryOptions {
  page?: number;
  limit?: number;
  filters?: ExpenseFilters;
}

export class ExpenseService {
  constructor(private expenseRepository: IExpenseRepository) {}

  /**
   * 가족의 지출 목록 조회 (페이지네이션)
   */
  async getExpensesByFamily(
    familyId: string,
    options: ExpenseQueryOptions = {}
  ): Promise<PaginationResult<ExpenseWithCategory>> {
    const { page = 1, limit = 10, filters = {} } = options;

    return this.expenseRepository.findByFamilyId(familyId, {
      categoryId: filters.categoryId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      pagination: { page, limit },
    });
  }

  /**
   * 지출 생성
   */
  async createExpense(data: CreateExpenseData): Promise<ExpenseWithCategory> {
    const expense = await this.expenseRepository.create(data);

    // 생성된 지출을 카테고리 정보와 함께 조회
    const expenseWithCategory = await this.expenseRepository.findByFamilyId(
      data.familyId,
      { pagination: { page: 1, limit: 1 } }
    );

    // 방금 생성한 지출이 첫 번째에 위치
    return expenseWithCategory.data[0];
  }

  /**
   * 지출 수정
   */
  async updateExpense(
    expenseId: string,
    data: UpdateExpenseData
  ): Promise<boolean> {
    const result = await this.expenseRepository.update(expenseId, data);
    return result !== null;
  }

  /**
   * 지출 삭제 (Soft Delete)
   */
  async deleteExpense(expenseId: string): Promise<boolean> {
    return this.expenseRepository.softDelete(expenseId);
  }

  /**
   * 카테고리별 지출 목록 조회
   */
  async getExpensesByCategory(
    categoryId: string
  ): Promise<ExpenseWithCategory[]> {
    return this.expenseRepository.findByCategoryId(categoryId);
  }

  /**
   * 가족의 총 지출 금액 계산
   */
  async getTotalExpenses(
    familyId: string,
    filters?: ExpenseFilters
  ): Promise<number> {
    return this.expenseRepository.getTotalByFamilyId(familyId, filters);
  }

  /**
   * 월별 총 지출 금액 계산
   */
  async getMonthlyTotal(
    familyId: string,
    year: number,
    month: number
  ): Promise<number> {
    return this.expenseRepository.getMonthlyTotal(familyId, year, month);
  }

  /**
   * 카테고리별 지출 통계
   */
  async getCategoryStats(
    familyId: string,
    filters?: ExpenseFilters
  ): Promise<
    Array<{
      categoryId: string;
      categoryName: string;
      total: number;
      count: number;
      percentage: number;
    }>
  > {
    const categoryTotals = await this.expenseRepository.getCategoryTotals(
      familyId,
      filters
    );
    const totalAmount = categoryTotals.reduce(
      (sum, item) => sum + item.total,
      0
    );

    return categoryTotals.map((item) => ({
      ...item,
      percentage: totalAmount > 0 ? (item.total / totalAmount) * 100 : 0,
    }));
  }

  /**
   * 기간별 지출 트렌드 (일별)
   */
  async getDailyExpenseTrend(
    familyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; total: number; count: number }>> {
    // 이 메서드는 필요에 따라 Repository에 추가 메서드를 만들어서 구현할 수 있습니다.
    // 현재는 기본적인 구조만 제공
    throw new Error("getDailyExpenseTrend는 아직 구현되지 않았습니다.");
  }

  /**
   * 예산 대비 지출 현황 (추후 예산 기능 추가 시)
   */
  async getBudgetComparison(
    familyId: string,
    year: number,
    month: number
  ): Promise<{
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
  }> {
    const monthlyTotal = await this.getMonthlyTotal(familyId, year, month);

    // 예산 기능이 구현되면 실제 예산을 조회하도록 수정
    const budget = 0; // 임시값

    return {
      budget,
      spent: monthlyTotal,
      remaining: Math.max(0, budget - monthlyTotal),
      percentage: budget > 0 ? (monthlyTotal / budget) * 100 : 0,
    };
  }
}
