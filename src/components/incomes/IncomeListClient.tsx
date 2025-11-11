"use client";

import type { Income } from "@/app/actions/income/get-incomes-action";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryResponse } from "@/types/api";
import { useRouter, useSearchParams } from "next/navigation";
import { IncomeItem } from "./IncomeItem";

interface IncomeListClientProps {
  incomes: Income[];
  categories: CategoryResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export function IncomeListClient({
  incomes,
  categories,
  totalElements,
  totalPages,
  currentPage,
  limit,
}: IncomeListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/transactions?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* 수입 목록 카드 */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2">
            {incomes.map((income) => (
              <IncomeItem key={income.uuid} income={income} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            이전
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

