/**
 * Dashboard Server Actions
 * 백엔드 API를 호출하여 대시보드 데이터 조회
 */

'use server'

import { auth } from "@/lib/auth"
import { apiGet } from "@/lib/api"
import type { FamilyResponse, ExpenseResponse, CategoryResponse, PageResponse } from "@/types/api"

export interface DashboardStats {
  monthlyExpense: number
  remainingBudget: number
  familyMembers: number
  budget: number
  year: number
  month: number
}

/**
 * 대시보드 통계 데이터 조회
 */
export async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !session?.user?.accessToken) {
      return null
    }

    // 사용자의 첫 번째 가족 정보 조회
    const families = await apiGet<FamilyResponse[]>(
      "/families",
      { token: session.user.accessToken }
    )
    
    if (!families || families.length === 0) {
      return null
    }

    const family = families[0]

    // 현재 연도와 월 계산
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // 이번 달 지출 목록 조회 (간단하게 전체 조회 후 필터링)
    const expenses = await apiGet<PageResponse<ExpenseResponse>>(
      `/families/${family.uuid}/expenses?page=0&size=1000`,
      { token: session.user.accessToken }
    )

    // 이번 달 지출만 필터링하고 합계 계산
    const monthlyExpense = expenses.content
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getFullYear() === year && 
               expenseDate.getMonth() + 1 === month
      })
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0)

    // 가족 구성원 수
    const familyMembers = family.memberCount || 0

    // 예산 정보 (추후 예산 기능 구현 시 실제 데이터로 대체)
    const budget = 0
    const remainingBudget = Math.max(0, budget - monthlyExpense)

    return {
      monthlyExpense,
      remainingBudget,
      familyMembers,
      budget,
      year,
      month,
    }
  } catch (error) {
    console.error('Failed to load dashboard stats:', error)
    return null
  }
}

/**
 * 가족 정보 존재 여부 확인
 */
export async function checkUserFamily(): Promise<{ 
  hasFamily: boolean
  familyId?: string 
}> {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !session?.user?.accessToken) {
      return { hasFamily: false }
    }

    const families = await apiGet<FamilyResponse[]>(
      "/families",
      { token: session.user.accessToken }
    )
    
    return {
      hasFamily: families && families.length > 0,
      familyId: families && families.length > 0 ? families[0].uuid : undefined
    }
  } catch (error) {
    console.error('Failed to check family:', error)
    return { hasFamily: false }
  }
}

/**
 * 최근 지출 내역 조회 (최대 10개)
 */
export interface RecentExpense {
  id: string
  uuid: string
  amount: string
  description: string | null
  date: Date
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
}

export async function getRecentExpenses(limit: number = 10): Promise<RecentExpense[]> {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !session?.user?.accessToken) {
      return []
    }

    // 사용자의 첫 번째 가족 정보 조회
    const families = await apiGet<FamilyResponse[]>(
      "/families",
      { token: session.user.accessToken }
    )
    
    if (!families || families.length === 0) {
      return []
    }

    const family = families[0]

    // 최근 지출 조회 (페이징)
    const expensesPage = await apiGet<PageResponse<ExpenseResponse>>(
      `/families/${family.uuid}/expenses?page=0&size=${limit}&sort=-date`,
      { token: session.user.accessToken }
    )

    // 카테고리 정보 조회
    const categories = await apiGet<CategoryResponse[]>(
      `/families/${family.uuid}/categories`,
      { token: session.user.accessToken }
    )

    // 카테고리 맵 생성
    const categoryMap = new Map(categories.map(cat => [cat.uuid, cat]))

    return expensesPage.content.map(expense => {
      const category = categoryMap.get(expense.categoryUuid)
      return {
        id: expense.uuid, // UUID를 id로 사용
        uuid: expense.uuid,
        amount: expense.amount,
        description: expense.description || null,
        date: new Date(expense.date),
        category: {
          id: expense.categoryUuid,
          name: category?.name || 'Unknown',
          color: category?.color || '#6366f1',
          icon: category?.icon || '💰',
        }
      }
    })
  } catch (error) {
    console.error('Failed to load recent expenses:', error)
    return []
  }
}

/**
 * 가족의 카테고리 목록 조회
 */
export async function getFamilyCategories(): Promise<CategoryResponse[]> {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !session?.user?.accessToken) {
      return []
    }

    // 사용자의 첫 번째 가족 정보 조회
    const families = await apiGet<FamilyResponse[]>(
      "/families",
      { token: session.user.accessToken }
    )
    
    if (!families || families.length === 0) {
      return []
    }

    const family = families[0]

    // 카테고리 목록 조회
    const categories = await apiGet<CategoryResponse[]>(
      `/families/${family.uuid}/categories`,
      { token: session.user.accessToken }
    )

    return categories
  } catch (error) {
    console.error('Failed to load categories:', error)
    return []
  }
}
