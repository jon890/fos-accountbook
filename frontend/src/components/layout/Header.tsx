"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LogOut, User, Users, Wallet } from "lucide-react";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { signOutAction } from "@/actions/auth/signout-action";
import { getFamiliesAction } from "@/actions/family/get-families-action";
import { FamilySelectorList } from "@/components/families/FamilySelectorList";
import type { Family } from "@/types/family";
import { toast } from "sonner";

interface HeaderProps {
  session: Session;
  selectedFamilyUuid: string | null;
}

// TODO: SSR에서 훅 순서 불일치를 막기 위해 헤더 하위 클라이언트 위젯들을 클라이언트 전용으로 로딩.
// 추후 서버에서 필요한 데이터를 주입해 SSR/CSR 트리를 일치시키는 방향으로 개선 검토.
const FamilySelectorDropdown = dynamic(
  () =>
    import("@/components/families/FamilySelectorDropdown").then(
      (mod) => mod.FamilySelectorDropdown
    ),
  { ssr: false }
);

const NotificationBell = dynamic(
  () =>
    import("@/components/notifications/NotificationBell").then(
      (mod) => mod.NotificationBell
    ),
  { ssr: false }
);

export function Header({ session, selectedFamilyUuid }: HeaderProps) {
  const router = useRouter();
  const [familySheetOpen, setFamilySheetOpen] = useState(false);
  const [sheetFamilies, setSheetFamilies] = useState<Family[]>([]);

  const handleOpenFamilySheet = async () => {
    const result = await getFamiliesAction();
    if (result.success && result.data) {
      setSheetFamilies(result.data);
      setFamilySheetOpen(true);
    } else {
      toast.error("가족 목록을 불러오지 못했습니다.");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg-elev/95 border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 md:space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-4 h-4 md:w-5 md:h-5 text-brand-fg" />
              </div>
              <h1 className="text-base md:text-xl font-bold text-fg tracking-tight">
                우리집 가계부
              </h1>
            </Link>

            <div className="flex items-center space-x-1.5 md:space-x-3">
              <div className="hidden md:block">
                <FamilySelectorDropdown />
              </div>
              {selectedFamilyUuid && (
                <NotificationBell familyUuid={selectedFamilyUuid} />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-8 h-8 md:w-9 md:h-9 p-0 rounded-full"
                  >
                    <Avatar className="w-8 h-8 md:w-9 md:h-9 ring-2 ring-brand-100">
                      <AvatarImage src={session.user?.image || ""} />
                      <AvatarFallback className="bg-brand-500 text-brand-fg font-semibold text-xs md:text-sm">
                        {session.user?.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-bg-elev border-border">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-fg leading-none">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-fg-muted leading-none">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* 모바일 전용 — 가족 전환 진입점 */}
                  <DropdownMenuItem className="md:hidden" onClick={handleOpenFamilySheet}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>가족 전환</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="md:hidden" />

                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>설정</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-expense focus:text-expense"
                    onSelect={(e) => {
                      e.preventDefault();
                      void signOutAction();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <Sheet open={familySheetOpen} onOpenChange={setFamilySheetOpen}>
        <SheetContent side="bottom" className="h-auto bg-bg-elev">
          <SheetHeader>
            <SheetTitle>가족 전환</SheetTitle>
          </SheetHeader>
          <FamilySelectorList
            families={sheetFamilies}
            selectedFamilyUuid={selectedFamilyUuid ?? ""}
            onSelected={() => setFamilySheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
