'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CategoryResponse } from '@/types/api'

interface ExpenseFiltersProps {
  categories: CategoryResponse[]
}

export function ExpenseFilters({ categories }: ExpenseFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || 'all')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    if (selectedCategory && selectedCategory !== 'all') params.set('categoryId', selectedCategory)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    
    // 페이지를 1로 리셋
    params.set('page', '1')
    
    router.push(`/expenses?${params.toString()}`)
  }

  const clearFilters = () => {
    setSelectedCategory('all')
    setStartDate('')
    setEndDate('')
    router.push('/expenses')
  }

  const hasActiveFilters = selectedCategory !== 'all' || startDate || endDate

  return (
    <Card>
      <CardHeader>
        <CardTitle>지출 내역 필터</CardTitle>
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
                <SelectItem value="all">전체 카테고리</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.uuid} value={category.uuid}>
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

        <div className="flex gap-2">
          <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
            필터 적용
          </Button>
          
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              필터 초기화
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
