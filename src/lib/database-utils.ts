/**
 * 데이터베이스 관련 유틸리티
 */

import { errorResponse } from './api-responses'

// Prisma 에러 처리
export function handlePrismaError(error: unknown) {
  console.error('Prisma Error:', error)
  
  // 에러가 객체이고 code 속성이 있는지 확인
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error as { code: string; meta?: { target?: string | string[] } }
    
    // P2002: Unique constraint failed
    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target || []
      const field = Array.isArray(target) ? target.join(', ') : target
      return errorResponse(`이미 존재하는 ${field} 입니다`, 409)
    }
    
    // P2025: Record not found
    if (prismaError.code === 'P2025') {
      return errorResponse('데이터를 찾을 수 없습니다', 404)
    }
    
    // P2003: Foreign key constraint failed
    if (prismaError.code === 'P2003') {
      return errorResponse('관련된 데이터를 찾을 수 없습니다', 400)
    }
    
    // P2014: Invalid ID
    if (prismaError.code === 'P2014') {
      return errorResponse('잘못된 ID 형식입니다', 400)
    }
    
    // P2011: Null constraint violation
    if (prismaError.code === 'P2011') {
      const target = prismaError.meta?.target || 'field'
      return errorResponse(`필수 필드 ${target}가 누락되었습니다`, 400)
    }
  }
  
  // 기본 에러
  return errorResponse('데이터베이스 오류가 발생했습니다')
}

// Soft delete 조건 생성
export function createSoftDeleteCondition() {
  return { deletedAt: null }
}

// Soft delete 실행
export function createSoftDeleteData() {
  return { deletedAt: new Date() }
}

// 페이지네이션을 위한 Prisma 옵션 생성
export function createPaginationOptions(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit
  }
}

// 정렬을 위한 Prisma 옵션 생성
export function createSortOptions(sort: string, order: 'asc' | 'desc' = 'desc') {
  return {
    [sort]: order
  }
}
