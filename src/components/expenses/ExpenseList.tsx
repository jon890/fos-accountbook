import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getExpenses } from "@/app/actions/expense-actions";
import { ExpensePagination } from "./ExpensePagination";

interface ExpenseListProps {
  familyId: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Date 객체가 유효한지 확인
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return "유효하지 않은 날짜";
  }

  return dateObj.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatAmount = (amount: string | number) => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) {
    return "0원";
  }
  return numAmount.toLocaleString() + "원";
};

export async function ExpenseList({
  familyId,
  categoryId,
  startDate,
  endDate,
  page = 1,
}: ExpenseListProps) {
  // Server Action으로 지출 목록 조회
  const result = await getExpenses({
    familyId,
    categoryId,
    startDate,
    endDate,
    page,
  });

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">
            {result.message || "지출 내역을 불러오는데 실패했습니다."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { expenses, totalPages, totalElements, currentPage } = result.data;
  const limit = 10;

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">
            아직 지출 내역이 없습니다. 첫 번째 지출을 추가해보세요!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {expenses.map((expense) => (
          <Card
            key={expense.uuid}
            className="hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {/* 카테고리 아이콘 */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: `${
                        expense.categoryColor || "#6366f1"
                      }20`,
                    }}
                  >
                    💰
                  </div>

                  {/* 지출 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {expense.description || "지출"}
                      </h3>
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${
                            expense.categoryColor || "#6366f1"
                          }20`,
                          color: expense.categoryColor || "#6366f1",
                        }}
                      >
                        {expense.categoryName || "기타"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(expense.date)}
                    </p>
                  </div>

                  {/* 금액 */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatAmount(expense.amount)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <ExpensePagination
          pagination={{
            page: currentPage + 1, // 백엔드는 0-based, UI는 1-based
            limit: limit,
            total: totalElements,
            totalPages: totalPages,
          }}
        />
      )}
    </div>
  );
}
