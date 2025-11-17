/**
 * 최근 지출 내역 조회 Server Action (대시보드용)
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiGet } from "@/lib/server/api";
import { requireAuth, getSelectedFamilyUuid } from "@/lib/server/auth-helpers";
import type { RecentExpense } from "@/types/dashboard";
import type { CategoryResponse } from "@/types/category";
import type { ExpenseResponse } from "@/types/expense";
import type { PaginationResponse } from "@/types/common";

export async function getRecentExpensesAction(
  limit: number = 10
): Promise<ActionResult<RecentExpense[]>> {
  try {
    // 인증 확인
    await requireAuth();

    // limit 검증
    if (limit < 1 || limit > 100) {
      throw ActionError.invalidInput(
        "limit",
        limit,
        "1에서 100 사이의 값이어야 합니다"
      );
    }

    // 선택된 가족 UUID 가져오기
    const selectedFamilyUuid = await getSelectedFamilyUuid();

    // 선택된 가족이 없으면 에러
    if (!selectedFamilyUuid) {
      throw ActionError.familyNotSelected();
    }

    // 최근 지출 조회 (페이징)
    const expensesPage = await serverApiGet<
      PaginationResponse<ExpenseResponse>
    >(
      `/families/${selectedFamilyUuid}/expenses?page=0&size=${limit}&sort=-date`
    );

    // 카테고리 정보 조회
    const categories = await serverApiGet<CategoryResponse[]>(
      `/families/${selectedFamilyUuid}/categories`
    );

    // 카테고리 맵 생성
    const categoryMap = new Map(categories.map((cat) => [cat.uuid, cat]));

    const recentExpenses = expensesPage.items.map((expense) => {
      const category = categoryMap.get(expense.categoryUuid);
      return {
        id: expense.uuid, // UUID를 id로 사용
        uuid: expense.uuid,
        amount: expense.amount,
        description: expense.description || null,
        date: expense.date, // ISO 8601 문자열 그대로 전달
        category: {
          uuid: expense.categoryUuid,
          name: category?.name || "Unknown",
          color: category?.color || "#6366f1",
          icon: category?.icon || "💰",
        },
      };
    });

    return successResult(recentExpenses);
  } catch (error) {
    console.error("Failed to load recent expenses:", error);
    return handleActionError(error, "최근 지출 내역을 불러오는데 실패했습니다");
  }
}
