import { Card } from "@/components/ui/card";
import { FolderTree } from "lucide-react";

interface CategoriesHeroProps {
  familyName: string | null;
  categoryCount: number;
}

export function CategoriesHero({
  familyName,
  categoryCount,
}: CategoriesHeroProps) {
  return (
    <Card className="overflow-hidden border-0 gradient-category text-brand-fg">
      <div className="p-5 md:p-6">
        <p className="text-xs md:text-sm text-brand-fg/80 mb-1">카테고리 관리</p>
        <h1 className="text-xl md:text-2xl font-bold mb-3">
          {familyName ?? "가족"}
          <span className="block text-sm md:text-base font-normal text-brand-fg/80 mt-0.5">
            지출 카테고리를 추가, 수정, 삭제할 수 있습니다
          </span>
        </h1>
        <div className="flex items-center gap-2 text-sm md:text-base">
          <FolderTree className="w-4 h-4 text-brand-fg/80" />
          <span className="font-num font-medium tabular-nums">
            {categoryCount}
          </span>
          <span className="text-xs text-brand-fg/70">개 등록됨</span>
        </div>
      </div>
    </Card>
  );
}
