import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { ExpensePageClient } from '@/components/expenses/ExpensePageClient'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { familyService } from '@/container'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
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
  const session = await getServerSession(authOptions)
  const resolvedSearchParams = await searchParams
  
  if (!session?.user?.id) {
    redirect('/api/auth/signin')
  }

  let family
  try {
    family = await familyService.getFamilyByUserId(session.user.id)
  } catch (error) {
    // 가족이 없는 경우 생성 페이지로 리다이렉트
    redirect('/families/create')
  }

  if (!family) {
    redirect('/families/create')
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
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* 페이지 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">지출 관리</h1>
          
          <ExpensePageClient categories={family.categories} />
        </div>

        {/* 필터 섹션 */}
        <div className="mb-6">
          <ExpenseFilters categories={family.categories} />
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
