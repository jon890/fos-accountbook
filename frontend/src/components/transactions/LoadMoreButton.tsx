"use client";

import { Button } from "@/components/ui/button";
import { useAppRouter } from "@/lib/client/navigation";
import { LIST_LIMIT_STEP, MAX_LIST_LIMIT } from "@/lib/utils/list-limit";
import { useSearchParams } from "next/navigation";

interface LoadMoreButtonProps {
  loadedCount: number;
  totalElements: number;
  limit: number;
}

export function LoadMoreButton({
  loadedCount,
  totalElements,
  limit,
}: LoadMoreButtonProps) {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const remainingCount = totalElements - loadedCount;

  if (remainingCount <= 0) {
    return null;
  }

  if (limit >= MAX_LIST_LIMIT) {
    return (
      <p className="text-center text-sm text-fg-muted">
        최대 {MAX_LIST_LIMIT}건까지 불러왔어요. 조회 기간을 줄여 주세요
      </p>
    );
  }

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(limit + LIST_LIMIT_STEP));

    router.replace(`/transactions?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex justify-center">
      <Button type="button" variant="outline" onClick={handleLoadMore}>
        더 보기 ({remainingCount}건 남음)
      </Button>
    </div>
  );
}
