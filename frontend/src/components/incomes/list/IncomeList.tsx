import { getIncomesAction } from "@/actions/income/get-incomes-action";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty/EmptyState";
import { Inbox } from "lucide-react";
import type { FamilyMemberSummary } from "@/types/family";
import { IncomeListClient } from "./IncomeListClient";
import { LoadMoreButton } from "@/components/transactions/LoadMoreButton";
import { applyClientFilters, parseAmountFilter } from "@/services/transaction/transaction-service";

interface IncomeListProps {
  familyId: string;
  members: FamilyMemberSummary[];
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  q?: string;
  amountMin?: string;
  amountMax?: string;
}

export async function IncomeList({
  familyId,
  members,
  categoryId,
  startDate,
  endDate,
  limit = 300,
  q,
  amountMin,
  amountMax,
}: IncomeListProps) {
  const amountMinValue = parseAmountFilter(amountMin);
  const amountMaxValue = parseAmountFilter(amountMax);
  const hasClientFilter = Boolean(q?.trim()) || amountMinValue !== undefined || amountMaxValue !== undefined;
  const hasFilter = Boolean(categoryId) || hasClientFilter;
  // 수입 목록 조회
  const result = await getIncomesAction({
    familyUuid: familyId,
    categoryId,
    startDate,
    endDate,
    page: 1,
    limit,
  });

  if (!result.success) {
    return (
      <Card>
        <CardContent className="py-6 md:py-8">
          <p className="text-center text-fg-muted">{result.error?.message}</p>
        </CardContent>
      </Card>
    );
  }

  const {
    items: incomes,
    totalElements,
  } = result.data;

  const filteredIncomes = applyClientFilters(incomes, {
    amountMin: amountMinValue,
    amountMax: amountMaxValue,
    q,
    categoryNameOf: (income) => income.category?.name,
  });

  if (incomes.length === 0 && !hasFilter) {
    // ExpenseList 와 동일 카피 — 도메인 wording 만 다를 수 있으나 현재 plan 에선 통일
    return (
      <EmptyState
        icon={Inbox}
        title="아직 거래가 없어요"
        description={"지출이나 수입을 추가하면\n여기에 표시돼요.\n아래 가운데 + 버튼으로 거래를 추가해 보세요."}
        tip={{
          title: "팁",
          body: "가족 누구나 입력할 수 있어요. 카드 청구서 도착 전에\n그때 그때 짧게 적어두면 편해요.",
        }}
      />
    );
  }

  if (filteredIncomes.length === 0 && hasFilter) {
    return (
      <div className="space-y-3 md:space-y-4">
        <EmptyState
          icon={Inbox}
          title="조건에 맞는 거래가 없어요"
          description="검색어나 필터 조건을 바꿔 보세요."
        />
        {hasClientFilter && incomes.length < totalElements && (
          <p className="text-xs text-fg-muted">
            불러온 {incomes.length}건 안에서 찾았어요
          </p>
        )}
        <LoadMoreButton
          loadedCount={incomes.length}
          totalElements={totalElements}
          limit={limit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {hasClientFilter && incomes.length < totalElements && (
        <p className="text-xs text-fg-muted">
          불러온 {incomes.length}건 안에서 찾았어요
        </p>
      )}
      <IncomeListClient
        incomes={filteredIncomes}
        familyUuid={familyId}
        members={members}
      />
      <LoadMoreButton
        loadedCount={incomes.length}
        totalElements={totalElements}
        limit={limit}
      />
    </div>
  );
}
