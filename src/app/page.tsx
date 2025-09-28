'use client'

import { useSession } from "next-auth/react"
import { LoginPage } from "@/components/auth/LoginPage"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { Header } from "@/components/layout/Header"
import { BottomNavigation } from "@/components/layout/BottomNavigation"
import { WelcomeSection } from "@/components/dashboard/WelcomeSection"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { DashboardTabs } from "@/components/dashboard/DashboardTabs"

export default function HomePage() {
  const { data: session, status } = useSession()

  // 세션 로딩 중
  if (status === "loading") {
    return <LoadingSpinner />
  }

  // 로그인되지 않은 상태
  if (status === "unauthenticated" || !session) {
    return <LoginPage />
  }

  // Mock data - 나중에 실제 데이터로 교체
  const statsData = {
    monthlyExpense: 0,
    remainingBudget: 0,
    familyMembers: 1
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, rgba(59, 130, 246, 0.1) 50%, rgba(99, 102, 241, 0.1) 100%)'
      }}
    >
      <Header session={session} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <WelcomeSection userName={session.user?.name} />
        <StatsCards data={statsData} />
        <DashboardTabs />
      </main>

      <BottomNavigation />
    </div>
  )
}