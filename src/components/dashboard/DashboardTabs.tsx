import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RecentExpense } from "@/types/actions";
import { BarChart3, CreditCard } from "lucide-react";
import { QuickActions } from "./QuickActions";
import { RecentActivity } from "./RecentActivity";

interface DashboardTabsProps {
  recentExpenses: RecentExpense[];
}

export function DashboardTabs({ recentExpenses }: DashboardTabsProps) {
  return (
    <Tabs defaultValue="overview" className="mb-8">
      <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/60 backdrop-blur-sm">
        <TabsTrigger
          value="overview"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          개요
        </TabsTrigger>
        <TabsTrigger
          value="expenses"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          지출 내역
        </TabsTrigger>
        <TabsTrigger
          value="analytics"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          분석
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <QuickActions />
        <RecentActivity expenses={recentExpenses} />
      </TabsContent>

      <TabsContent value="expenses">
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle>지출 내역</CardTitle>
            <CardDescription>모든 지출 내역을 관리하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-16">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">지출 내역이 없습니다</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analytics">
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle>분석</CardTitle>
            <CardDescription>지출 패턴을 분석해보세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-16">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">분석할 데이터가 없습니다</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
