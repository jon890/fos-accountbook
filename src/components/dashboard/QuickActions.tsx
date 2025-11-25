"use client";

import { AddExpenseDialog } from "@/components/expenses/dialogs/AddExpenseDialog";
import { AddIncomeDialog } from "@/components/incomes/dialogs/AddIncomeDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Settings, UserPlus, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InviteFamilyDialog } from "./InviteFamilyDialog";

export function QuickActions() {
  const router = useRouter();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [addIncomeDialogOpen, setAddIncomeDialogOpen] = useState(false);

  const handleAddExpenseClick = () => {
    setAddExpenseDialogOpen(true);
  };

  const handleAddIncomeClick = () => {
    setAddIncomeDialogOpen(true);
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
          className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm"
          onClick={handleAddExpenseClick}
        >
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-r from-blue-500 to-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Plus className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-0 md:mb-1 text-sm md:text-base">
                  지출 추가
                </h3>
                <p className="text-gray-600 text-xs md:text-sm">
                  새로운 지출 기록
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm"
          onClick={handleAddIncomeClick}
        >
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-r from-emerald-500 to-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <TrendingUp className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-0 md:mb-1 text-sm md:text-base">
                  수입 추가
                </h3>
                <p className="text-gray-600 text-xs md:text-sm">
                  새로운 수입 기록
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm"
          onClick={handleInviteClick}
        >
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-r from-purple-500 to-pink-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <UserPlus className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-0 md:mb-1 text-sm md:text-base">
                  가족 초대
                </h3>
                <p className="text-gray-600 text-xs md:text-sm">구성원 추가</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm"
          onClick={handleCategoryClick}
        >
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-linear-to-r from-green-500 to-green-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Settings className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-0 md:mb-1 text-sm md:text-base">
                  카테고리
                </h3>
                <p className="text-gray-600 text-xs md:text-sm">분류 관리</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <InviteFamilyDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      <AddExpenseDialog
        open={addExpenseDialogOpen}
        onOpenChange={setAddExpenseDialogOpen}
      />

      <AddIncomeDialog
        open={addIncomeDialogOpen}
        onOpenChange={setAddIncomeDialogOpen}
      />
    </>
  );
}
