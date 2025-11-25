import { Wallet } from "lucide-react";

/**
 * 페이지 로딩 스피너
 * loading.tsx 파일에서 사용 (레이아웃 내부에서 표시)
 */
export function PageLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] py-12">
      <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-300">
        <div className="relative">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl">
            <Wallet className="w-8 h-8 md:w-10 md:h-10 text-white animate-pulse" />
          </div>
          <div className="absolute inset-0 w-16 h-16 md:w-20 md:h-20 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl md:rounded-3xl animate-ping opacity-20"></div>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="text-base md:text-lg text-gray-900 font-semibold">
            로딩 중...
          </div>
          <div className="text-xs md:text-sm text-gray-500">
            잠시만 기다려주세요
          </div>
        </div>
      </div>
    </div>
  );
}
