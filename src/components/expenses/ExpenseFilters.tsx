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
import type { CategoryResponse } from "@/types/category";
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
    const params = new URLSearchParams(searchParams.toString());

    // 필터 값 설정
    if (selectedCategory && selectedCategory !== "all") {
      params.set("categoryId", selectedCategory);
    } else {
      params.delete("categoryId");
    }

    if (startDate) {
      params.set("startDate", startDate);
    } else {
      params.delete("startDate");
    }

    if (endDate) {
      params.set("endDate", endDate);
    } else {
      params.delete("endDate");
    }

    params.set("limit", pageSize.toString());
    params.set("page", "1"); // 페이지를 1로 리셋

    router.push(`/transactions?${params.toString()}`);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newSize.toString());
    params.set("page", "1"); // 페이지 크기 변경 시 1페이지로 리셋
    router.push(`/transactions?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setStartDate(defaultStartDate || "");
    setEndDate(defaultEndDate || "");
    setPageSize(25);

    const params = new URLSearchParams(searchParams.toString());
    // 필터 관련 파라미터만 제거
    params.delete("categoryId");
    params.delete("page");
    // startDate와 endDate는 기본값으로 설정
    if (defaultStartDate) {
      params.set("startDate", defaultStartDate);
    } else {
      params.delete("startDate");
    }
    if (defaultEndDate) {
      params.set("endDate", defaultEndDate);
    } else {
      params.delete("endDate");
    }
    params.set("limit", "25");
    params.set("page", "1");

    router.push(`/transactions?${params.toString()}`);
  };

  const hasActiveFilters = selectedCategory !== "all" || startDate || endDate;

  return (
    <Card>
      <CardHeader className="py-3 md:py-4">
        <CardTitle className="text-sm md:text-base">내역 필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 카테고리 필터 */}
        <div className="md:max-w-md">
          <label className="text-xs text-gray-600 mb-1 block">카테고리</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="전체 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.uuid} value={category.uuid}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{category.icon}</span>
                    <span className="text-sm">{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 날짜 필터 - 한 줄로 배치 */}
        <div className="md:max-w-md">
          <label className="text-xs text-gray-600 mb-1 block">기간</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="시작 날짜"
              className="h-9 text-sm"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="종료 날짜"
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* 버튼 및 페이지 크기 */}
        <div className="flex flex-col gap-2 pt-1">
          {/* 필터 버튼 */}
          <div className="flex gap-2">
            <Button
              onClick={applyFilters}
              className="bg-blue-600 hover:bg-blue-700 h-9 text-sm flex-1 md:flex-initial md:max-w-[120px]"
            >
              필터 적용
            </Button>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="h-9 text-sm md:max-w-[100px]"
              >
                초기화
              </Button>
            )}
          </div>

          {/* 페이지 크기 선택 */}
          <div className="flex items-center gap-2 justify-between">
            <span className="text-xs text-gray-600">표시 개수:</span>
            <div className="flex gap-1.5">
              {PAGE_SIZE_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={pageSize === option.value ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors text-xs px-2 py-0.5",
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
