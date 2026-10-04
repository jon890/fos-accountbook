"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import { useAppRouter, useNavigationPending } from "@/lib/client/navigation";
import { revealAndFocus } from "@/lib/client/reveal";
import { AddTransactionDialog } from "@/components/transactions/dialogs/AddTransactionDialog";
import { EditTransactionDialog } from "@/components/transactions/dialogs/EditTransactionDialog";
import { buildMemberColorMap } from "@/lib/utils/member-color";
import type { CalendarMonth } from "@/types/calendar";
import { MonthHeader } from "./MonthHeader";
import { BudgetSummaryCard } from "./BudgetSummaryCard";
import { MemberLegend } from "./MemberLegend";
import { CalendarGrid } from "./CalendarGrid";
import { DayTransactionList, type CalendarTransaction } from "./DayTransactionList";

interface CalendarHomeProps {
  data: CalendarMonth;
  initialDate: string;
  today: string;
  familyUuid: string;
}

export function CalendarHome(props: CalendarHomeProps) {
  return <CalendarMonthContent key={`${props.familyUuid}-${props.data.year}-${props.data.month}`} {...props} />;
}

function CalendarMonthContent({ data, initialDate, today, familyUuid }: CalendarHomeProps) {
  const router = useAppRouter();
  const isNavigationPending = useNavigationPending();
  const urlDate = useSearchParams().get("date");
  const [dateDraft, setDateDraft] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [previousInitialDate, setPreviousInitialDate] = useState(initialDate);
  const [previousUrlDate, setPreviousUrlDate] = useState(urlDate);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarTransaction | null>(null);
  const handleEditOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setEditing(null);
    }
  }, []);

  if (initialDate !== previousInitialDate) {
    setPreviousInitialDate(initialDate);
    setDateDraft(null);
  }
  if (urlDate !== previousUrlDate) {
    setPreviousUrlDate(urlDate);
    if (urlDate === null) {
      setDateDraft(null);
    }
  }

  const selectedDate = dateDraft ?? initialDate;
  const colors = buildMemberColorMap(data.members);
  const expenseTotal = data.daily.dailyStats.find((day) => day.date === selectedDate)?.expense ?? 0;
  const editingTransactions = editing?.type === "expense" ? data.expenses : data.incomes;
  const editingTransaction = editingTransactions.find((transaction) => transaction.uuid === editing?.transaction.uuid);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("date") === selectedDate) {
      return;
    }
    url.searchParams.set("date", selectedDate);
    // Next.js가 내부 history 상태를 복사하고 useSearchParams도 갱신하도록 맡긴다.
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [selectedDate, urlDate]);

  function selectDate(date: string) {
    // 제목에 새 날짜가 그려진 뒤 포커스를 옮겨야 화면 낭독기가 고른 날짜를 읽는다
    flushSync(() => setDateDraft(date));
    revealAndFocus(headingRef.current);
  }

  function moveMonth(direction: -1 | 1) {
    if (isNavigationPending) {
      return;
    }

    const nextMonth = new Date(Date.UTC(data.year, data.month - 1 + direction, 1));
    const year = nextMonth.getUTCFullYear();
    if (year < 2000 || year > 2100) {
      return;
    }
    const month = String(nextMonth.getUTCMonth() + 1).padStart(2, "0");
    router.push(`/calendar?month=${year}-${month}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <MonthHeader
        year={data.year}
        month={data.month}
        onMove={moveMonth}
        isNavigationPending={isNavigationPending}
      />
      <BudgetSummaryCard summary={data.budgetSummary} />
      <MemberLegend colors={colors} />
      <div
        aria-busy={isNavigationPending}
        className={`space-y-4 transition-opacity ${isNavigationPending ? "pointer-events-none opacity-60" : ""}`}
      >
        <CalendarGrid
          year={data.year}
          month={data.month}
          dailyStats={data.daily.dailyStats}
          colors={colors}
          selectedDate={selectedDate}
          today={today}
          onSelect={selectDate}
        />
        <DayTransactionList
          headingRef={headingRef}
          selectedDate={selectedDate}
          expenseTotal={expenseTotal}
          expenses={data.expenses}
          incomes={data.incomes}
          colors={colors}
          onAdd={() => setAddOpen(true)}
          onEdit={setEditing}
        />
      </div>
      <AddTransactionDialog open={addOpen} onOpenChange={setAddOpen} defaultDate={selectedDate} />
      {editing && editingTransaction && (
        <EditTransactionDialog
          open={true}
          type={editing.type}
          transaction={editingTransaction}
          familyUuid={familyUuid}
          onOpenChange={handleEditOpenChange}
        />
      )}
    </div>
  );
}
