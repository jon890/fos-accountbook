/**
 * Dashboard Server Actions
 * Next.js 15 Server Actions를 사용한 대시보드 데이터 로직
 */

'use server'

import { container } from "@/container"
import { auth } from "@/lib/auth"

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
    
    if (!session?.user?.id) {
      return null
    }

    const familyService = container.getFamilyService()
    const expenseService = container.getExpenseService()

    // 사용자의 가족 정보 조회
    const family = await familyService.getFamilyByUserId(session.user.id)
    
    if (!family) {
      return null
    }

    // 현재 연도와 월 계산
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // 이번 달 총 지출 조회
    const monthlyExpense = await expenseService.getMonthlyTotal(
      family.uuid,
      year,
      month
    )

    // 가족 구성원 수
    const familyMembers = family.members.length

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
    
    if (!session?.user?.id) {
      return { hasFamily: false }
    }

    const familyService = container.getFamilyService()
    const family = await familyService.getFamilyByUserId(session.user.id)
    
    return {
      hasFamily: !!family,
      familyId: family?.uuid
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
    
    if (!session?.user?.id) {
      return []
    }

    const familyService = container.getFamilyService()
    const expenseService = container.getExpenseService()

    // 사용자의 가족 정보 조회
    const family = await familyService.getFamilyByUserId(session.user.id)
    
    if (!family) {
      return []
    }

    // 최근 지출 조회
    const result = await expenseService.getExpensesByFamily(family.uuid, {
      page: 1,
      limit,
    })

    return result.data.map(expense => ({
      id: expense.id,
      uuid: expense.uuid,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      category: {
        id: expense.category.id,
        name: expense.category.name,
        color: expense.category.color,
        icon: expense.category.icon,
      }
    }))
  } catch (error) {
    console.error('Failed to load recent expenses:', error)
    return []
  }
}
