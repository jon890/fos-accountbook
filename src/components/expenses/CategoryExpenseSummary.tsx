"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/utils/category-icons";
import type { CategoryExpenseSummaryResponse } from "@/types/expense";
import { useRouter, useSearchParams } from "next/navigation";

interface CategoryExpenseSummaryProps {
  summary: CategoryExpenseSummaryResponse;
}

export function CategoryExpenseSummary({
  summary,
}: CategoryExpenseSummaryProps) {
  const { totalExpense, categoryStats } = summary;
  const router = useRouter();
  const searchParams = useSearchParams();

  if (categoryStats.length === 0) {
    return null;
  }

  const handleCategoryClick = (categoryUuid: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("categoryId", categoryUuid);
    params.set("page", "1"); // 페이지를 1로 리셋
    router.push(`/transactions?${params.toString()}`);
  };

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
          {categoryStats.map((stat) => {
            const IconComponent = getCategoryIcon(
              stat.categoryIcon || "default"
            );
            const useEmoji = !IconComponent;
            const isSelected =
              searchParams.get("categoryId") === stat.categoryUuid;

            return (
              <div
                key={stat.categoryUuid}
                onClick={() => handleCategoryClick(stat.categoryUuid)}
                className={cn(
                  "relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r from-gray-50 to-white p-3 md:p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                  isSelected ? "border-2 shadow-md" : "border border-gray-100"
                )}
                style={
                  isSelected ? { borderColor: stat.categoryColor } : undefined
                }
              >
                {/* 배경 프로그레스 바 */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `linear-gradient(to right, ${stat.categoryColor} 0%, ${stat.categoryColor} ${stat.percentage}%, transparent ${stat.percentage}%)`,
                  }}
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 md:space-x-3 flex-1">
                    {/* 카테고리 아이콘 */}
                    <div
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm shrink-0"
                      style={{
                        backgroundColor: `${stat.categoryColor}20`,
                      }}
                    >
                      {useEmoji ? (
                        <span className="text-xl md:text-2xl">
                          {stat.categoryIcon}
                        </span>
                      ) : (
                        <div style={{ color: stat.categoryColor }}>
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
                          {stat.categoryName}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="text-[10px] md:text-xs"
                          style={{
                            backgroundColor: `${stat.categoryColor}15`,
                            color: stat.categoryColor,
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
                              backgroundColor: stat.categoryColor,
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
                      ₩{stat.totalAmount.toLocaleString()}
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
