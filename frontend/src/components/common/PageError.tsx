import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageErrorProps {
  reset: () => void;
}

/**
 * 페이지 에러 UI
 * error.tsx 파일에서 사용 (레이아웃 내부에서 표시)
 */
export function PageError({ reset }: PageErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] py-12">
      <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-300 text-center px-4">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-red-400" />
        </div>
        <div className="flex flex-col items-center space-y-1">
          <p className="text-base md:text-lg text-gray-900 font-semibold">
            문제가 발생했습니다
          </p>
          <p className="text-xs md:text-sm text-gray-500">
            잠시 후 다시 시도해주세요
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          다시 시도
        </Button>
      </div>
    </div>
  );
}
