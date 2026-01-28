"use server";

import { serverApiGet } from "@/lib/server/api";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";

interface ExpenseResponse {
  uuid: string;
  amount: number;
  date: string; // "2024-01-01T00:00:00"
  categoryName: string;
}

interface IncomeResponse {
  uuid: string;
  amount: number;
  date: string; // "2024-01-01T00:00:00"
  source: string;
}

export interface DailyTransactionSummary {
  date: string; // YYYY-MM-DD
  income: number;
  expense: number;
}

/**
 * 월별 일일 수입/지출 합계 조회
 * (API가 없으므로 목록 조회 후 집계)
 */
export async function getMonthlyDailyStatsAction(year: number, month: number) {
  const familyUuid = await getSelectedFamilyUuid();
  if (!familyUuid) {
    return { success: false, error: "가족이 선택되지 않았습니다.", data: [] };
  }

  try {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    // 해당 월의 마지막 날 계산
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

    // 병렬로 데이터 조회 (최대 1000개로 가정)
    console.log(
      `[Calendar] Fetching stats for family ${familyUuid} from ${startDate} to ${endDate}`,
    );
    const [expensesResult, incomesResult] = await Promise.all([
      serverApiGet<{ items: ExpenseResponse[] }>(
        `/families/${familyUuid}/expenses?size=1000&startDate=${startDate}&endDate=${endDate}`,
      ).catch((e) => {
        console.error("[Calendar] Failed to fetch expenses:", e);
        return { items: [] as ExpenseResponse[] };
      }),
      serverApiGet<{ items: IncomeResponse[] }>(
        `/families/${familyUuid}/incomes?size=1000&startDate=${startDate}&endDate=${endDate}`,
      ).catch((e) => {
        console.error("[Calendar] Failed to fetch incomes:", e);
        return { items: [] as IncomeResponse[] };
      }),
    ]);
    console.log(`[Calendar] Expenses count: ${expensesResult?.items?.length}`);
    console.log(`[Calendar] Incomes count: ${incomesResult?.items?.length}`);

    // 일별 집계
    const dailyMap = new Map<string, { income: number; expense: number }>();

    // 지출 집계
    if (expensesResult?.items) {
      expensesResult.items.forEach((expense) => {
        const dateStr = expense.date.split("T")[0]; // YYYY-MM-DD
        const current = dailyMap.get(dateStr) || { income: 0, expense: 0 };
        current.expense += expense.amount;
        dailyMap.set(dateStr, current);
      });
    }

    // 수입 집계
    if (incomesResult?.items) {
      incomesResult.items.forEach((income) => {
        const dateStr = income.date.split("T")[0]; // YYYY-MM-DD
        const current = dailyMap.get(dateStr) || { income: 0, expense: 0 };
        current.income += income.amount;
        dailyMap.set(dateStr, current);
      });
    }

    // 배열로 변환
    const result: DailyTransactionSummary[] = Array.from(
      dailyMap.entries(),
    ).map(([date, stats]) => ({
      date,
      income: stats.income,
      expense: stats.expense,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to fetch monthly transactions:", error);
    return { success: false, error: "데이터 조회 실패", data: [] };
  }
}
