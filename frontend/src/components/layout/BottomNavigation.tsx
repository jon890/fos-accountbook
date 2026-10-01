"use client";

import { AddTransactionDialog } from "@/components/transactions/dialogs/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/client/utils";
import { BarChart3, CalendarDays, CreditCard, LayoutGrid, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";

const tabs = [
  {
    href: "/calendar",
    label: "달력",
    icon: CalendarDays,
    paths: ["/calendar"],
  },
  {
    href: "/transactions",
    label: "내역",
    icon: CreditCard,
    paths: ["/transactions", "/expenses"],
  },
  {
    href: "/analytics",
    label: "분석",
    icon: BarChart3,
    paths: ["/analytics"],
  },
  {
    href: "/menu",
    label: "전체",
    icon: LayoutGrid,
    paths: ["/menu"],
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const hidden =
    pathname === "/families/create" ||
    pathname === "/families/select" ||
    pathname.startsWith("/invite/");

  if (hidden) {
    return null;
  }

  const defaultDate =
    pathname === "/calendar" ? searchParams.get("date") ?? undefined : undefined;

  return (
    <>
      <nav
        aria-label="주 메뉴"
        className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-bg-elev/95 backdrop-blur-xl safe-area-pb"
      >
        <div className="relative mx-auto flex h-16 max-w-7xl items-center px-2 md:px-4">
          {tabs.map(({ href, label, icon: Icon, paths }, index) => {
            const active = paths.some((path) => pathname.startsWith(path));
            return (
              <Fragment key={href}>
                {index === 2 && (
                  <div aria-hidden="true" className="h-full flex-1" />
                )}
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-md hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-brand-500",
                    active ? "text-brand-600" : "text-fg-subtle"
                  )}
                >
                  <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.6} />
                  <span className={cn("text-xs", active && "font-semibold")}>
                    {label}
                  </span>
                </Link>
              </Fragment>
            );
          })}
          <Button
            type="button"
            aria-label="지출 추가"
            onClick={() => setDialogOpen(true)}
            className="absolute bottom-7 left-1/2 size-14 -translate-x-1/2 rounded-full border-4 border-bg-elev bg-brand-500 p-0 text-brand-fg shadow-[var(--shadow-fab)] hover:bg-brand-600"
          >
            <Plus className="size-6" strokeWidth={2.4} />
          </Button>
        </div>
      </nav>
      <AddTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType="expense"
        defaultDate={defaultDate}
      />
    </>
  );
}
