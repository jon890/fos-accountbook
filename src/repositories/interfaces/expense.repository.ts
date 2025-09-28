/**
 * Expense Repository 인터페이스
 */

import { BaseRepository, PaginationResult, FilterOptions } from './base.repository'

export interface ExpenseData {
  id: string
  uuid: string
  familyId: string
  categoryId: string
  amount: string
  description: string | null
  date: Date
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ExpenseWithCategory extends ExpenseData {
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
}

export interface CreateExpenseData {
  familyId: string
  categoryId: string
  amount: number
  description?: string
  date?: Date
}

export interface UpdateExpenseData {
  categoryId?: string
  amount?: number
  description?: string
  date?: Date
}

export interface ExpenseFilterOptions extends FilterOptions {
  familyId: string
  categoryId?: string
  startDate?: Date
  endDate?: Date
  minAmount?: number
  maxAmount?: number
}

export interface IExpenseRepository extends BaseRepository<ExpenseData, CreateExpenseData, UpdateExpenseData> {
  // Expense 특화 메서드
  findByFamilyId(
    familyId: string, 
    options?: {
      categoryId?: string
      startDate?: Date
      endDate?: Date
      pagination?: { page: number; limit: number }
    }
  ): Promise<PaginationResult<ExpenseWithCategory>>
  
  findByCategoryId(categoryId: string): Promise<ExpenseWithCategory[]>
  
  getTotalByFamilyId(familyId: string, filters?: {
    categoryId?: string
    startDate?: Date
    endDate?: Date
  }): Promise<number>
  
  getMonthlyTotal(familyId: string, year: number, month: number): Promise<number>
  
  getCategoryTotals(familyId: string, filters?: {
    startDate?: Date
    endDate?: Date
  }): Promise<Array<{
    categoryId: string
    categoryName: string
    total: number
    count: number
  }>>
}
