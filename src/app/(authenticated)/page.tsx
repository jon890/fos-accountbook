/**
 * Home Page - Server Component
 * Next.js 15 Server Component 패턴 사용
 */

import { DashboardClient } from "@/components/dashboard/DashboardClient"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { WelcomeSection } from "@/components/dashboard/WelcomeSection"
import { auth } from "@/lib/server/auth"
import { redirect } from 'next/navigation'
import { checkUserFamily, getDashboardStats, getRecentExpenses } from "../actions/dashboard-actions"

export default async function HomePage() {
  // Layout에서 이미 인증 체크 완료 ✅
  const session = await auth()
  if (!session) {
    // Layout에서 이미 체크했으니 도달하지 않음
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