"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CategoryResponse } from "@/types/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface ExpenseFiltersProps {
  categories: CategoryResponse[];
  defaultStartDate?: string;
  defaultEndDate?: string;
}

const PAGE_SIZE_OPTIONS = [
  { value: 25, label: "25개씩" },
  { value: 50, label: "50개씩" },
  { value: 100, label: "100개씩" },
];

export function ExpenseFilters({
  categories,
  defaultStartDate,
  defaultEndDate,
}: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("categoryId") || "all"
  );
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || defaultStartDate || ""
  );
  const [endDate, setEndDate] = useState(
    searchParams.get("endDate") || defaultEndDate || ""
  );
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("limit")) || 25
  );

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (selectedCategory && selectedCategory !== "all")
      params.set("categoryId", selectedCategory);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("limit", pageSize.toString());

    // 페이지를 1로 리셋
    params.set("page", "1");

    router.push(`/expenses?${params.toString()}`);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newSize.toString());
    params.set("page", "1"); // 페이지 크기 변경 시 1페이지로 리셋
    router.push(`/expenses?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setStartDate("");
    setEndDate("");
    setPageSize(25);
    router.push("/expenses");
  };

  const hasActiveFilters = selectedCategory !== "all" || startDate || endDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>지출 내역 필터</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* 카테고리 필터 */}
          <div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체 카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.uuid} value={category.uuid}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 시작 날짜 */}
          <div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="시작 날짜"
            />
          </div>

          {/* 종료 날짜 */}
          <div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="종료 날짜"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={applyFilters}
              className="bg-blue-600 hover:bg-blue-700"
            >
              필터 적용
            </Button>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                필터 초기화
              </Button>
            )}
          </div>

          {/* 페이지 크기 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">표시 개수:</span>
            <div className="flex gap-1.5">
              {PAGE_SIZE_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={pageSize === option.value ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    pageSize === option.value
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => handlePageSizeChange(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
