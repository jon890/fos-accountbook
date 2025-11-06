import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExpenseItem } from "@/components/expenses/ExpenseItem";
import type { RecentExpense } from "@/types/actions";
import { Plus, Wallet } from "lucide-react";
import Link from "next/link";

interface RecentActivityProps {
  expenses: RecentExpense[];
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
            {expenses.map((expense) => (
              <ExpenseItem
                key={expense.uuid}
                expense={{
                  uuid: expense.uuid,
                  amount: expense.amount,
                  description: expense.description,
                  date: expense.date,
                  category: expense.category,
                }}
              />
            ))}

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
