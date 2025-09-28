'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ExpensePaginationProps {
  pagination: PaginationInfo
}

export function ExpensePagination({ pagination }: ExpensePaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  if (pagination.totalPages <= 1) {
    return null
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/expenses?${params.toString()}`)
  }

  return (
    <div className="flex justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(pagination.page - 1)}
        disabled={pagination.page === 1}
      >
        이전
      </Button>
      
      <span className="flex items-center px-3 text-sm">
        {pagination.page} / {pagination.totalPages}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(pagination.page + 1)}
        disabled={pagination.page === pagination.totalPages}
      >
        다음
      </Button>
    </div>
  )
}
