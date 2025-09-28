'use client'

import { useSession } from "next-auth/react"
import { LoginPage } from "@/components/auth/LoginPage"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { Header } from "@/components/layout/Header"
import { BottomNavigation } from "@/components/layout/BottomNavigation"
import { WelcomeSection } from "@/components/dashboard/WelcomeSection"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { DashboardTabs } from "@/components/dashboard/DashboardTabs"
import { TailwindTest } from "@/components/common/TailwindTest"

export default function HomePage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <LoadingSpinner />
  }

  if (!session) {
    return <LoginPage />
  }

  // Mock data - 나중에 실제 데이터로 교체
  const statsData = {
    monthlyExpense: 0,
    remainingBudget: 0,
    familyMembers: 1
  }

  // 개발 중 Tailwind 테스트를 위한 임시 코드
  if (process.env.NODE_ENV === 'development' && session.user?.email === 'test@example.com') {
    return <TailwindTest />
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
        
        {/* Tailwind 테스트 섹션 - 개발 중에만 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 border-t pt-8">
            <TailwindTest />
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}
