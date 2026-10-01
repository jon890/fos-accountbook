"use client";

import { getFamiliesAction } from "@/actions/family/get-families-action";
import { InviteFamilyDialog } from "@/components/families/InviteFamilyDialog";
import { FamilySelectorList } from "@/components/families/FamilySelectorList";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Family } from "@/types/family";
import {
  Bell,
  ChevronRight,
  Folder,
  RefreshCw,
  Repeat,
  Settings,
  UserPlus,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface MenuPageClientProps {
  familyName: string;
  userName: string;
  selectedFamilyUuid: string;
}

const groups = [
  {
    title: "가계부",
    items: [
      { name: "카테고리", href: "/categories", icon: Folder },
      { name: "예산", href: "/budget", icon: Wallet },
      { name: "고정지출", href: "/transactions?tab=recurring", icon: Repeat },
    ],
  },
  {
    title: "가족",
    items: [],
  },
  {
    title: "알림",
    items: [{ name: "알림", href: "/notifications", icon: Bell }],
  },
  {
    title: "설정",
    items: [{ name: "설정", href: "/settings", icon: Settings }],
  },
];

const rowClassName =
  "flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-sm text-fg hover:bg-bg-muted";

export function MenuPageClient({
  familyName,
  userName,
  selectedFamilyUuid,
}: MenuPageClientProps) {
  const router = useRouter();
  const [familySheetOpen, setFamilySheetOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(false);

  const openFamilySheet = async () => {
    setLoadingFamilies(true);
    try {
      const result = await getFamiliesAction();
      if (result.success) {
        setFamilies(result.data);
        setFamilySheetOpen(true);
      } else {
        const isAuthError =
          result.error.code === "A001" || result.error.code === "A002";
        if (isAuthError) {
          const message = encodeURIComponent(result.error.message);
          router.push(`/auth/signin?error=auth&message=${message}`);
        } else {
          toast.error(result.error.message);
        }
      }
    } catch {
      toast.error("가족 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingFamilies(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-6">
      <div className="px-1 pt-3">
        <h1 className="text-2xl font-bold text-fg">전체 메뉴</h1>
        <p className="mt-3 font-semibold text-fg">{familyName}</p>
        <p className="mt-1 text-sm text-fg-muted">{userName}님</p>
      </div>
      {groups.map(({ title, items }) => (
        <section key={title} aria-label={title}>
          <h2 className="mb-2 px-1 text-xs font-semibold text-fg-muted">{title}</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-bg-elev divide-y divide-border">
            {title === "가족" && (
              <>
                <Button
                  variant="ghost"
                  disabled={loadingFamilies}
                  onClick={openFamilySheet}
                  className={`${rowClassName} h-auto justify-start rounded-none`}
                >
                  <RefreshCw className="size-5 text-fg-muted" />
                  <span className="flex-1 text-left">가족 전환</span>
                  <ChevronRight className="size-4 text-fg-subtle" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setInviteOpen(true)}
                  className={`${rowClassName} h-auto justify-start rounded-none`}
                >
                  <UserPlus className="size-5 text-fg-muted" />
                  <span className="flex-1 text-left">구성원 초대</span>
                  <ChevronRight className="size-4 text-fg-subtle" />
                </Button>
              </>
            )}
            {items.map(({ name, href, icon: Icon }) => (
              <Link key={name} href={href} className={rowClassName}>
                <Icon className="size-5 text-fg-muted" />
                <span className="flex-1">{name}</span>
                <ChevronRight className="size-4 text-fg-subtle" />
              </Link>
            ))}
          </div>
        </section>
      ))}
      <Sheet open={familySheetOpen} onOpenChange={setFamilySheetOpen}>
        <SheetContent side="bottom" className="bg-bg-elev safe-area-pb">
          <SheetHeader>
            <SheetTitle>가족 전환</SheetTitle>
          </SheetHeader>
          <FamilySelectorList
            families={families}
            selectedFamilyUuid={selectedFamilyUuid}
            onSelected={() => setFamilySheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <InviteFamilyDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
