"use client";

import { AddTransactionDialog } from "@/components/transactions/dialogs/AddTransactionDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Settings, UserPlus, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InviteFamilyDialog } from "./InviteFamilyDialog";

export function QuickActions() {
  const router = useRouter();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: "expense" | "income";
  }>({ open: false, type: "expense" });

  const handleAddExpenseClick = () => {
    setDialogState({ open: true, type: "expense" });
  };

  const handleAddIncomeClick = () => {
    setDialogState({ open: true, type: "income" });
  };

  const handleCategoryClick = () => {
    router.push("/categories");
  };

  const handleInviteClick = () => {
    setInviteDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card
          className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-bg-elev/80 backdrop-blur-sm"
          onClick={handleAddExpenseClick}
        >
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="w-10 h-10 md:w-14 md:h-14 gradient-expense rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Plus className="w-5 h-5 md:w-7 md:h-7 text-expense-fg" />
              </div>
              <div>
                <h3 className="font-semibold text-fg mb-0 md:mb-1 text-sm md:text-base">
                  지출 추가
                </h3>
                <p className="text-fg-muted text-xs md:text-sm">
                  새로운 지출 기록
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-bg-elev/80 backdrop-blur-sm"
          onClick={handleAddIncomeClick}
        >
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="w-10 h-10 md:w-14 md:h-14 gradient-income rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <TrendingUp className="w-5 h-5 md:w-7 md:h-7 text-income-fg" />
              </div>
              <div>
                <h3 className="font-semibold text-fg mb-0 md:mb-1 text-sm md:text-base">
                  수입 추가
                </h3>
                <p className="text-fg-muted text-xs md:text-sm">
                  새로운 수입 기록
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-bg-elev/80 backdrop-blur-sm"
          onClick={handleInviteClick}
        >
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="w-10 h-10 md:w-14 md:h-14 gradient-family rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <UserPlus className="w-5 h-5 md:w-7 md:h-7 text-brand-fg" />
              </div>
              <div>
                <h3 className="font-semibold text-fg mb-0 md:mb-1 text-sm md:text-base">
                  가족 초대
                </h3>
                <p className="text-fg-muted text-xs md:text-sm">구성원 추가</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-bg-elev/80 backdrop-blur-sm"
          onClick={handleCategoryClick}
        >
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="w-10 h-10 md:w-14 md:h-14 gradient-category rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Settings className="w-5 h-5 md:w-7 md:h-7 text-brand-fg" />
              </div>
              <div>
                <h3 className="font-semibold text-fg mb-0 md:mb-1 text-sm md:text-base">
                  카테고리
                </h3>
                <p className="text-fg-muted text-xs md:text-sm">분류 관리</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <InviteFamilyDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      <AddTransactionDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
        defaultType={dialogState.type}
      />
    </>
  );
}
