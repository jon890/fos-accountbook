import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecentExpense } from "@/types/actions";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Car,
  Coffee,
  Gift,
  Heart,
  Home,
  Plus,
  ShoppingBag,
  Utensils,
  Wallet,
} from "lucide-react";
import Link from "next/link";

interface RecentActivityProps {
  expenses: RecentExpense[];
}

// 카테고리 아이콘 매핑
const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  shopping: ShoppingBag,
  food: Utensils,
  coffee: Coffee,
  home: Home,
  transport: Car,
  health: Heart,
  gift: Gift,
  default: Wallet,
};

function getCategoryIcon(iconName: string) {
  const IconComponent =
    categoryIcons[iconName.toLowerCase()] || categoryIcons.default;
  return IconComponent;
}

export function RecentActivity({ expenses }: RecentActivityProps) {
  const hasExpenses = expenses.length > 0;

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-xl font-bold text-gray-900">
            최근 활동
          </CardTitle>
          <Badge variant="secondary" className="bg-gray-100 text-xs">
            {expenses.length}건
          </Badge>
        </div>
        <CardDescription className="text-xs md:text-sm">
          최근 추가된 지출 내역을 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        {!hasExpenses ? (
          <div className="text-center py-10 md:py-16">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Wallet className="w-7 h-7 md:w-10 md:h-10 text-gray-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1.5 md:mb-2">
              아직 지출 내역이 없습니다
            </h3>
            <p className="text-sm md:text-base text-gray-500 mb-4 md:mb-6">
              첫 번째 지출을 추가해보세요!
            </p>
            <Link href="/expenses">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl md:rounded-2xl px-6 md:px-8 text-sm md:text-base">
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />첫 지출 추가하기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {expenses.map((expense) => {
              const IconComponent = getCategoryIcon(expense.category.icon);
              return (
                <div
                  key={expense.uuid}
                  className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-2.5 md:space-x-4 flex-1">
                    <div
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm"
                      style={{
                        backgroundColor: `${expense.category.color}20`,
                      }}
                    >
                      <div style={{ color: expense.category.color }}>
                        <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 md:space-x-2 mb-0.5 md:mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                          {expense.description || expense.category.name}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="text-[10px] md:text-xs px-1.5 py-0 shrink-0"
                          style={{
                            backgroundColor: `${expense.category.color}15`,
                            color: expense.category.color,
                            border: "none",
                          }}
                        >
                          {expense.category.name}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500">
                        {format(new Date(expense.date), "M월 d일 (E) HH:mm", {
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm md:text-lg font-bold text-gray-900 whitespace-nowrap">
                      -₩{Number(expense.amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}

            {expenses.length >= 10 && (
              <div className="pt-3 md:pt-4">
                <Link href="/expenses">
                  <Button
                    variant="outline"
                    className="w-full border-2 border-gray-200 hover:bg-gray-50 rounded-xl md:rounded-2xl text-sm md:text-base"
                  >
                    모든 지출 내역 보기
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
