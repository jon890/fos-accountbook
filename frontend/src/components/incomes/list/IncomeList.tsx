import { getIncomesAction } from "@/actions/income/get-incomes-action";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty/EmptyState";
import { Inbox } from "lucide-react";
import { IncomeListClient } from "./IncomeListClient";

interface IncomeListProps {
  familyId: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  q?: string;
  amountMin?: string;
  amountMax?: string;
}

export async function IncomeList({
  familyId,
  categoryId,
  startDate,
  endDate,
  page = 1,
  limit = 25,
  q,
  amountMin,
  amountMax,
}: IncomeListProps) {
  const hasFilter = !!(categoryId || q || amountMin || amountMax);
  // 수입 목록 조회
  const result = await getIncomesAction({
    familyUuid: familyId,
    categoryId,
    startDate,
    endDate,
    page,
    limit,
  });

  if (!result.success) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">{result.error?.message}</p>
        </CardContent>
      </Card>
    );
  }

  const {
    items: incomes,
    totalElements,
    totalPages,
    currentPage,
  } = result.data;

  if (incomes.length === 0 && !hasFilter) {
    // ExpenseList 와 동일 카피 — 도메인 wording 만 다를 수 있으나 현재 plan 에선 통일
    return (
      <EmptyState
        icon={Inbox}
        title="아직 거래가 없어요"
        description={"지출이나 수입을 추가하면\n여기에 표시돼요."}
        tip={{
          title: "팁",
          body: "가족 누구나 입력할 수 있어요. 카드 청구서 도착 전에\n그때 그때 짧게 적어두면 편해요.",
        }}
      />
    );
  }

  return (
    <IncomeListClient
      incomes={incomes}
      familyUuid={familyId}
      totalElements={totalElements}
      totalPages={totalPages}
      currentPage={currentPage + 1} // UI는 1-based
      limit={limit}
    />
  );
}
