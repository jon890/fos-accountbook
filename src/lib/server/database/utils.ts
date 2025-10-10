/**
 * 데이터베이스 관련 유틸리티
 */

import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError
} from '@prisma/client/runtime/library'
import { errorResponse } from '@/lib/server/api/responses'

// Prisma 에러 처리 (타입 안전한 방식)
export function handlePrismaError(error: unknown) {
  console.error('Prisma Error:', error)
  
  // Prisma Client Known Request Error (가장 일반적인 에러)
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint failed
        const target = error.meta?.target as string[] || []
        const field = Array.isArray(target) ? target.join(', ') : target
        return errorResponse(`이미 존재하는 ${field} 입니다`, 409)
      
      case 'P2025': // Record not found
        return errorResponse('데이터를 찾을 수 없습니다', 404)
      
      case 'P2003': // Foreign key constraint failed
        return errorResponse('관련된 데이터를 찾을 수 없습니다', 400)
      
      case 'P2014': // Invalid ID
        return errorResponse('잘못된 ID 형식입니다', 400)
      
      case 'P2011': // Null constraint violation
        const nullField = error.meta?.target || 'field'
        return errorResponse(`필수 필드 ${nullField}가 누락되었습니다`, 400)
      
      case 'P2004': // Constraint failed
        return errorResponse('데이터 제약 조건을 위반했습니다', 400)
      
      default:
        return errorResponse(`데이터베이스 오류: ${error.message}`, 400)
    }
  }
  
  // Prisma Client Validation Error (스키마 검증 오류)
  if (error instanceof PrismaClientValidationError) {
    return errorResponse('잘못된 데이터 형식입니다', 400)
  }
  
  // Prisma Client Initialization Error (연결 오류)
  if (error instanceof PrismaClientInitializationError) {
    return errorResponse('데이터베이스 연결에 실패했습니다', 503)
  }
  
  // Prisma Client Unknown Request Error
  if (error instanceof PrismaClientUnknownRequestError) {
    return errorResponse('알 수 없는 데이터베이스 오류가 발생했습니다', 500)
  }
  
  // Prisma Client Rust Panic Error (심각한 오류)
  if (error instanceof PrismaClientRustPanicError) {
    return errorResponse('심각한 데이터베이스 오류가 발생했습니다', 500)
  }
  
  // 기본 에러 (Prisma 에러가 아닌 경우)
  return errorResponse('데이터베이스 오류가 발생했습니다', 500)
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
