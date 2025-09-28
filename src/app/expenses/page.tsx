'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Header } from '@/components/layout/Header'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { AddExpenseForm } from '@/components/expenses/AddExpenseForm'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { LoginPage } from '@/components/auth/LoginPage'

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

interface Family {
  id: string
  name: string
  categories: Category[]
}

export default function ExpensesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [family, setFamily] = useState<Family | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [familyLoaded, setFamilyLoaded] = useState(false)

  // 가족 정보 조회
  useEffect(() => {
    if (status === 'authenticated' && !familyLoaded) {
      const fetchFamily = async () => {
        try {
          setLoading(true)
          const response = await fetch('/api/families')
          
          if (response.status === 404) {
            // 가족이 없는 경우 생성 페이지로 리다이렉트
            router.push('/families/create')
            return
          }
          
          if (!response.ok) {
            throw new Error('가족 정보를 불러오는데 실패했습니다')
          }

          const familyData = await response.json()
          setFamily(familyData)
          setError(null)
          setFamilyLoaded(true)
        } catch (err) {
          setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
        } finally {
          setLoading(false)
        }
      }
      
      fetchFamily()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, familyLoaded, router])

  const fetchFamily = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/families')
      
      if (response.status === 404) {
        router.push('/families/create')
        return
      }
      
      if (!response.ok) {
        throw new Error('가족 정보를 불러오는데 실패했습니다')
      }

      const familyData = await response.json()
      setFamily(familyData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleExpenseAdded = () => {
    setIsAddDialogOpen(false)
    setRefreshTrigger(prev => prev + 1) // 지출 목록 새로고침 트리거
  }

  // 세션 로딩 중
  if (status === 'loading' || loading) {
    return <LoadingSpinner />
  }

  // 로그인되지 않은 상태
  if (status === 'unauthenticated' || !session) {
    return <LoginPage />
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchFamily}>다시 시도</Button>
        </div>
      </div>
    )
  }

  // 가족 정보가 없는 경우
  if (!family) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
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
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                + 지출 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 border-0 bg-transparent">
              <AddExpenseForm
                categories={family.categories}
                onSuccess={handleExpenseAdded}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* 지출 목록 */}
        <ExpenseList 
          categories={family.categories}
          refreshTrigger={refreshTrigger}
        />
      </main>

      <BottomNavigation />
    </div>
  )
}
