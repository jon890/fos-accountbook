'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

interface Expense {
  id: string
  amount: string
  description: string | null
  date: string
  category: Category
  createdAt: string
}

interface ExpenseListProps {
  categories: Category[]
  refreshTrigger?: number // 새로고침 트리거용
}

export function ExpenseList({ categories }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (selectedCategory) params.append('categoryId', selectedCategory)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/expenses?${params}`)
      
      if (!response.ok) {
        throw new Error('지출 목록을 불러오는데 실패했습니다')
      }

      const data = await response.json()
      setExpenses(data.expenses)
      setTotalPages(data.pagination.totalPages)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [currentPage, selectedCategory, startDate, endDate])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: string) => {
    return Number(amount).toLocaleString() + '원'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <Button 
              onClick={fetchExpenses} 
              className="mt-4"
              variant="outline"
            >
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 필터 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>지출 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 카테고리 필터 */}
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="전체 카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체 카테고리</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 시작 날짜 */}
            <div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="시작 날짜"
              />
            </div>

            {/* 종료 날짜 */}
            <div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="종료 날짜"
              />
            </div>
          </div>

          {/* 필터 초기화 버튼 */}
          {(selectedCategory || startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('')
                setStartDate('')
                setEndDate('')
                setCurrentPage(1)
              }}
            >
              필터 초기화
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 지출 목록 */}
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <p>등록된 지출이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary"
                        className="text-white"
                        style={{ backgroundColor: expense.category.color }}
                      >
                        <span className="mr-1">{expense.category.icon}</span>
                        {expense.category.name}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(expense.date)}
                      </span>
                    </div>
                    
                    {expense.description && (
                      <p className="text-gray-700 mb-1">{expense.description}</p>
                    )}
                    
                    <p className="text-xs text-gray-400">
                      {formatDate(expense.createdAt)}에 추가됨
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600">
                      -{formatAmount(expense.amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            이전
          </Button>
          
          <span className="flex items-center px-3 text-sm">
            {currentPage} / {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
