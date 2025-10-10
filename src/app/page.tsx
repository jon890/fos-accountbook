/**
 * Home Page - Server Component
 * Next.js 15 Server Component 패턴 사용
 */

import { redirect } from 'next/navigation'
import { auth } from "@/lib/auth"
import { getDashboardStats, checkUserFamily, getRecentExpenses } from "./actions/dashboard-actions"
import { WelcomeSection } from "@/components/dashboard/WelcomeSection"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { DashboardClient } from "@/components/dashboard/DashboardClient"

export default async function HomePage() {
  // 서버에서 세션 확인
  const session = await auth()

  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // 가족 정보 확인
  const { hasFamily } = await checkUserFamily()
  
  // 가족이 없으면 생성 페이지로 리다이렉트
  if (!hasFamily) {
    redirect('/families/create')
  }

  // 대시보드 데이터 병렬로 가져오기
  const [stats, recentExpenses] = await Promise.all([
    getDashboardStats(),
    getRecentExpenses(10)
  ])

  // 기본값 설정 (데이터를 가져오지 못한 경우)
  const statsData = stats || {
    monthlyExpense: 0,
    remainingBudget: 0,
    familyMembers: 0,
    budget: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  }

  return (
    <DashboardClient initialSession={session} recentExpenses={recentExpenses}>
      <WelcomeSection userName={session.user.name} />
      <StatsCards data={statsData} />
    </DashboardClient>
  )
}