import { Wallet } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="absolute inset-0 w-12 h-12 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl animate-ping opacity-20"></div>
        </div>
        <div className="text-sm text-gray-600 font-medium">로딩 중...</div>
      </div>
    </div>
  );
}
