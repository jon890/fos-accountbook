/**
 * 대시보드 통계 데이터 조회 Server Action
 */

"use server";

import { serverApiGet } from "@/lib/server/api";
import { auth } from "@/lib/server/auth";
import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";
import type { DashboardStats } from "@/types/actions";
import type {
  ExpenseResponse,
  FamilyResponse,
  IncomeResponse,
  PageResponse,
} from "@/types/api";

export async function getDashboardStatsAction(): Promise<
  ActionResult<DashboardStats>
> {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      throw ActionError.unauthorized();
    }

    // 선택된 가족 UUID 가져오기
    const selectedFamilyUuid = await getSelectedFamilyUuid();

    // 선택된 가족이 없으면 에러
    if (!selectedFamilyUuid) {
      throw ActionError.familyNotSelected();
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

    return successResult({
      monthlyExpense,
      monthlyIncome,
      remainingBudget,
      familyMembers,
      budget,
      year,
      month,
    });
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);
    return handleActionError(error, "대시보드 통계를 불러오는데 실패했습니다");
  }
}
