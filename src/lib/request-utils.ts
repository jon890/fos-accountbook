/**
 * HTTP 요청 관련 유틸리티
 */

import { NextRequest } from 'next/server'

// 페이지네이션 파라미터 파싱
export function parsePaginationParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10'))) // 최대 100개로 제한
  
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit
  }
}

// 날짜 파라미터 파싱
export function parseDateParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  
  return {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined
  }
}

// 검색 파라미터 파싱
export function parseSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const sort = searchParams.get('sort')
  const order = searchParams.get('order') as 'asc' | 'desc' || 'desc'
  
  return {
    search: search?.trim() || undefined,
    sort: sort || 'createdAt',
    order
  }
}

// 필터 파라미터 파싱
export function parseFilterParams(request: NextRequest, allowedFilters: string[]) {
  const { searchParams } = new URL(request.url)
  const filters: Record<string, string> = {}
  
  allowedFilters.forEach(filter => {
    const value = searchParams.get(filter)
    if (value) {
      filters[filter] = value
    }
  })
  
  return filters
}

// 숫자 파라미터 파싱 (ID 등)
export function parseNumericParam(param: string | null, defaultValue?: number): number | undefined {
  if (!param) return defaultValue
  const parsed = parseInt(param)
  return isNaN(parsed) ? defaultValue : parsed
}

// 불린 파라미터 파싱
export function parseBooleanParam(param: string | null, defaultValue?: boolean): boolean | undefined {
  if (!param) return defaultValue
  return param.toLowerCase() === 'true'
}
