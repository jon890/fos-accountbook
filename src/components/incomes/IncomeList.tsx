import { getIncomesAction } from "@/app/actions/income/get-incomes-action";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryResponse } from "@/types/api";
import { IncomeListClient } from "./IncomeListClient";

interface IncomeListProps {
  familyId: string;
  categories: CategoryResponse[];
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function IncomeList({
  familyId,
  categories,
  categoryId,
  startDate,
  endDate,
  page = 1,
  limit = 25,
}: IncomeListProps) {
  // 수입 목록 조회
  const result = await getIncomesAction({
    familyId,
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

  const { incomes, totalElements, totalPages, currentPage } = result.data;

  if (incomes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-gray-500">
            수입 내역이 없습니다.
            <br />
            <span className="text-sm">
              우측 상단의 &quot;수입 추가&quot; 버튼으로 수입을 등록해보세요.
            </span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <IncomeListClient
      incomes={incomes}
      categories={categories}
      totalElements={totalElements}
      totalPages={totalPages}
      currentPage={currentPage + 1} // UI는 1-based
      limit={limit}
    />
  );
}

