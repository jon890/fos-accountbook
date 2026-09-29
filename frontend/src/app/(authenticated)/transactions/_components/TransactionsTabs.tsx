"use client";

import { cn } from "@/lib/client/utils";
import { useRouter, useSearchParams } from "next/navigation";

type TabType = "expenses" | "incomes" | "recurring";

const TABS: { id: TabType; label: string }[] = [
  { id: "expenses", label: "지출" },
  { id: "incomes", label: "수입" },
  { id: "recurring", label: "반복지출" },
];

interface TransactionsTabsProps {
  activeTab: TabType;
  onChange?: (tab: TabType) => void;
}

export function TransactionsTabs({ activeTab, onChange }: TransactionsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tab: TabType) => {
    if (onChange) {
      onChange(tab);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.set("page", "1");
    router.push(`/transactions?${params.toString()}`);
  };

  return (
    <div
      role="tablist"
      aria-label="거래 내역 탭"
      className="flex bg-bg-muted rounded-md p-1"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={cn(
            "flex-1 text-center py-2 text-sm font-semibold rounded-sm transition-all duration-150",
            activeTab === tab.id
              ? "bg-bg-elev shadow-[var(--shadow-subtle)] text-fg"
              : "text-fg-muted hover:text-fg"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
