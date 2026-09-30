"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AddTransactionDialog } from "@/components/transactions/dialogs/AddTransactionDialog";
import { EditTransactionDialog } from "@/components/transactions/dialogs/EditTransactionDialog";
import { buildMemberColorMap } from "@/lib/utils/member-color";
import type { CalendarMonth } from "@/types/calendar";
import { MonthHeader } from "./MonthHeader";
import { MemberTotals } from "./MemberTotals";
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
  const router = useRouter();
  const [dateDraft, setDateDraft] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarTransaction | null>(null);
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
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [selectedDate]);

  function selectDate(date: string) {
    setDateDraft(date);
  }

  function moveMonth(direction: -1 | 1) {
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
      <MonthHeader year={data.year} month={data.month} onMove={moveMonth} />
      <MemberTotals daily={data.daily} colors={colors} />
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
        selectedDate={selectedDate}
        expenseTotal={expenseTotal}
        expenses={data.expenses}
        incomes={data.incomes}
        colors={colors}
        onAdd={() => setAddOpen(true)}
        onEdit={setEditing}
      />
      <AddTransactionDialog open={addOpen} onOpenChange={setAddOpen} defaultDate={selectedDate} />
      {editing && editingTransaction && (
        <EditTransactionDialog
          open={true}
          type={editing.type}
          transaction={editingTransaction}
          familyUuid={familyUuid}
          onOpenChange={(open) => {
            if (!open) {
              setEditing(null);
            }
          }}
        />
      )}
    </div>
  );
}
