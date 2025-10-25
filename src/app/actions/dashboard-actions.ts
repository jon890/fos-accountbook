/**
 * Dashboard Server Actions
 * 대시보드 페이지 전용 데이터 조회
 */

"use server";

import { serverApiGet } from "@/lib/server/api";
import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";
import type { DashboardStats, RecentExpense } from "@/types/actions";
import type {
  CategoryResponse,
  ExpenseResponse,
  FamilyResponse,
  IncomeResponse,
  PageResponse,
} from "@/types/api";

/**
 * 대시보드 통계 데이터 조회
 */
export async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    // 선택된 가족 UUID 가져오기
    let selectedFamilyUuid = await getSelectedFamilyUuid();

    // 선택된 가족이 없으면 첫 번째 가족 사용 (쿠키에 저장하지 않음)
    if (!selectedFamilyUuid) {
      const families = await serverApiGet<FamilyResponse[]>("/families");

      if (!families || families.length === 0) {
        return null;
      }

      selectedFamilyUuid = families[0].uuid;
    }

    // 선택된 가족 정보 조회
    const family = await serverApiGet<FamilyResponse>(
      `/families/${selectedFamilyUuid}`
    );

    // 현재 연도와 월 계산
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 이번 달 지출 목록 조회 (간단하게 전체 조회 후 필터링)
    const expenses = await serverApiGet<PageResponse<ExpenseResponse>>(
      `/families/${family.uuid}/expenses?page=0&size=1000`
    );

    // 이번 달 지출만 필터링하고 합계 계산
    const monthlyExpense = expenses.content
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getFullYear() === year &&
          expenseDate.getMonth() + 1 === month
        );
      })
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    // 이번 달 수입 목록 조회
    const incomes = await serverApiGet<PageResponse<IncomeResponse>>(
      `/families/${family.uuid}/incomes?page=0&size=1000`
    );

    // 이번 달 수입만 필터링하고 합계 계산
    const monthlyIncome = incomes.content
      .filter((income) => {
        const incomeDate = new Date(income.date);
        return (
          incomeDate.getFullYear() === year &&
          incomeDate.getMonth() + 1 === month
        );
      })
      .reduce((sum, income) => sum + parseFloat(income.amount), 0);

    // 가족 구성원 수
    const familyMembers = family.memberCount || 0;

    // 예산 정보 (추후 예산 기능 구현 시 실제 데이터로 대체)
    const budget = 0;
    const remainingBudget = Math.max(0, budget - monthlyExpense);

    return {
      monthlyExpense,
      monthlyIncome,
      remainingBudget,
      familyMembers,
      budget,
      year,
      month,
    };
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);
    return null;
  }
}

/**
 * 최근 지출 내역 조회 (대시보드용, 최대 10개)
 */
export async function getRecentExpenses(
  limit: number = 10
): Promise<RecentExpense[]> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return [];
    }

    // 선택된 가족 UUID 가져오기
    let selectedFamilyUuid = await getSelectedFamilyUuid();

    // 선택된 가족이 없으면 첫 번째 가족 사용 (쿠키에 저장하지 않음)
    if (!selectedFamilyUuid) {
      const families = await serverApiGet<FamilyResponse[]>("/families");

      if (!families || families.length === 0) {
        return [];
      }

      selectedFamilyUuid = families[0].uuid;
    }

    // 최근 지출 조회 (페이징)
    const expensesPage = await serverApiGet<PageResponse<ExpenseResponse>>(
      `/families/${selectedFamilyUuid}/expenses?page=0&size=${limit}&sort=-date`
    );

    // 카테고리 정보 조회
    const categories = await serverApiGet<CategoryResponse[]>(
      `/families/${selectedFamilyUuid}/categories`
    );

    // 카테고리 맵 생성
    const categoryMap = new Map(categories.map((cat) => [cat.uuid, cat]));

    return expensesPage.content.map((expense) => {
      const category = categoryMap.get(expense.categoryUuid);
      return {
        id: expense.uuid, // UUID를 id로 사용
        uuid: expense.uuid,
        amount: expense.amount,
        description: expense.description || null,
        date: new Date(expense.date),
        category: {
          id: expense.categoryUuid,
          name: category?.name || "Unknown",
          color: category?.color || "#6366f1",
          icon: category?.icon || "💰",
        },
      };
    });
  } catch (error) {
    console.error("Failed to load recent expenses:", error);
    return [];
  }
}
