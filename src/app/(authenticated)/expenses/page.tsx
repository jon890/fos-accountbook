import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { ExpensePageClient } from '@/components/expenses/ExpensePageClient'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { serverApiGet } from '@/lib/server/api/client'
import { auth } from '@/lib/server/auth'
import type { FamilyResponse } from '@/types/api'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

interface SearchParams {
  categoryId?: string
  startDate?: string
  endDate?: string
  page?: string
}

interface ExpensesPageProps {
  searchParams: Promise<SearchParams>
}

async function ExpenseListWrapper({ 
  familyId, 
  searchParams 
}: { 
  familyId: string
  searchParams: SearchParams 
}) {
  const page = parseInt(searchParams.page || '1', 10)
  
  return (
    <ExpenseList
      familyId={familyId}
      categoryId={searchParams.categoryId}
      startDate={searchParams.startDate}
      endDate={searchParams.endDate}
      page={page}
    />
  )
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  // Layout에서 이미 인증 체크 완료 ✅
  const session = await auth()
  if (!session) {
    // Layout에서 이미 체크했으니 도달하지 않음
    redirect('/auth/signin')
  }
  
  const resolvedSearchParams = await searchParams

  // 백엔드 API에서 가족 정보 조회 (Server-side API 호출)
  let families: FamilyResponse[]
  try {
    families = await serverApiGet<FamilyResponse[]>("/families")
  } catch (error) {
    console.error("Failed to fetch families:", error)
    redirect('/families/create')
  }

  if (!families || families.length === 0) {
    redirect('/families/create')
  }

  const family = families[0] // 첫 번째 가족 사용

  return (
    <div 
      className="min-h-screen"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, rgba(59, 130, 246, 0.1) 50%, rgba(99, 102, 241, 0.1) 100%)'
      }}
    >
      <Header session={session} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* 페이지 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">지출 관리</h1>
          
          <ExpensePageClient categories={family.categories || []} />
        </div>

        {/* 필터 섹션 */}
        <div className="mb-6">
          <ExpenseFilters categories={family.categories || []} />
        </div>

        {/* 지출 목록 */}
        <Suspense 
          fallback={
            <Card>
              <CardContent className="flex justify-center items-center py-8">
                <LoadingSpinner />
              </CardContent>
            </Card>
          }
        >
          <ExpenseListWrapper 
            familyId={family.uuid}
            searchParams={resolvedSearchParams}
          />
        </Suspense>
      </main>

      <BottomNavigation />
    </div>
  )
}
