import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/utils/category-icons";
import type { CategoryResponse, ExpenseResponse } from "@/types/api";

interface CategoryExpenseSummaryProps {
  expenses: ExpenseResponse[];
  categories: CategoryResponse[];
}

interface CategoryStat {
  category: CategoryResponse;
  total: number;
  count: number;
  percentage: number;
}

export function CategoryExpenseSummary({
  expenses,
  categories,
}: CategoryExpenseSummaryProps) {
  // 카테고리별 지출 집계
  const categoryStats = new Map<string, { total: number; count: number }>();

  expenses.forEach((expense) => {
    const current = categoryStats.get(expense.categoryUuid) || {
      total: 0,
      count: 0,
    };
    categoryStats.set(expense.categoryUuid, {
      total: current.total + parseFloat(expense.amount),
      count: current.count + 1,
    });
  });

  // 전체 지출 합계
  const totalExpense = Array.from(categoryStats.values()).reduce(
    (sum, stat) => sum + stat.total,
    0
  );

  // 카테고리 통계 생성 및 정렬
  const stats: CategoryStat[] = categories
    .map((category) => {
      const stat = categoryStats.get(category.uuid);
      if (!stat) return null;

      return {
        category,
        total: stat.total,
        count: stat.count,
        percentage: totalExpense > 0 ? (stat.total / totalExpense) * 100 : 0,
      };
    })
    .filter((stat): stat is CategoryStat => stat !== null)
    .sort((a, b) => b.total - a.total); // 금액 내림차순 정렬

  if (stats.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-xl font-bold text-gray-900">
            카테고리별 지출
          </CardTitle>
          <Badge variant="secondary" className="bg-gray-100 text-xs md:text-sm">
            총 ₩{totalExpense.toLocaleString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <div className="space-y-3 md:space-y-4">
          {stats.map((stat) => {
            const IconComponent = getCategoryIcon(
              stat.category.icon || "default"
            );
            const useEmoji = !IconComponent;

            return (
              <div
                key={stat.category.uuid}
                className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 p-3 md:p-4"
              >
                {/* 배경 프로그레스 바 */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `linear-gradient(to right, ${stat.category.color} 0%, ${stat.category.color} ${stat.percentage}%, transparent ${stat.percentage}%)`,
                  }}
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 md:space-x-3 flex-1">
                    {/* 카테고리 아이콘 */}
                    <div
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm shrink-0"
                      style={{
                        backgroundColor: `${stat.category.color}20`,
                      }}
                    >
                      {useEmoji ? (
                        <span className="text-xl md:text-2xl">
                          {stat.category.icon}
                        </span>
                      ) : (
                        <div style={{ color: stat.category.color }}>
                          {IconComponent && (
                            <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* 카테고리 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">
                          {stat.category.name}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="text-[10px] md:text-xs"
                          style={{
                            backgroundColor: `${stat.category.color}15`,
                            color: stat.category.color,
                            border: "none",
                          }}
                        >
                          {stat.count}건
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${stat.percentage}%`,
                              backgroundColor: stat.category.color,
                            }}
                          />
                        </div>
                        <span className="text-xs md:text-sm text-gray-500 tabular-nums">
                          {stat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 금액 */}
                  <div className="text-right ml-3 md:ml-4">
                    <p className="text-sm md:text-lg font-bold text-gray-900 whitespace-nowrap">
                      ₩{stat.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
