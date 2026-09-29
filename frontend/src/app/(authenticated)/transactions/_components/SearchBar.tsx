"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/client/utils";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushQ = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      router.replace(`/transactions?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleChange = (newValue: string) => {
    setValue(newValue);
    if (timerRef.current) clearTimeout(timerRef.current);
    // 300ms 디바운스: 마지막 입력 후 300ms 경과 시 URL 갱신
    timerRef.current = setTimeout(() => { pushQ(newValue); }, 300);
  };

  const clear = () => {
    setValue("");
    if (timerRef.current) clearTimeout(timerRef.current);
    pushQ("");
    setIsMobileOpen(false);
  };

  const inputClass = "pl-8 pr-8 h-9 text-sm bg-bg-elev border-border placeholder:text-fg-muted";

  return (
    <>
      {/* 데스크톱: 항상 노출 */}
      <div className="hidden md:flex items-center relative w-60 shrink-0">
        <Search
          size={14}
          className="absolute left-3 text-fg-muted pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="text"
          placeholder="메모 검색"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={inputClass}
          aria-label="거래 내역 검색"
        />
        {value && (
          <button
            onClick={clear}
            className="absolute right-2.5 text-fg-muted hover:text-fg"
            aria-label="검색어 지우기"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 모바일: 아이콘 클릭 시 expand */}
      <div className="md:hidden">
        {isMobileOpen ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none"
                aria-hidden="true"
              />
              <Input
                autoFocus
                type="text"
                placeholder="메모 검색"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                className={cn(inputClass, "w-full")}
                aria-label="거래 내역 검색"
              />
            </div>
            <button
              onClick={clear}
              className="shrink-0 p-1 text-fg-muted hover:text-fg"
              aria-label="검색 닫기"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-fg-muted hover:text-fg"
            aria-label="검색 열기"
          >
            <Search size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </>
  );
}
