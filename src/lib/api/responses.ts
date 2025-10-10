/**
 * API 응답 관련 유틸리티
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { serialize } from '../database/serialization'

// API 응답 래퍼 - 자동 직렬화
export function apiResponse(data: unknown, options?: { status?: number }) {
  const serializedData = serialize(data)
  return NextResponse.json(serializedData, { status: options?.status || 200 })
}

// 성공 응답 생성
export function successResponse(data: unknown, status: number = 200) {
  return apiResponse(data, { status })
}

// 에러 응답 생성
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status })
}

// 생성 성공 응답
export function createdResponse(data: unknown) {
  return successResponse(data, 201)
}

// 삭제 성공 응답
export function deletedResponse() {
  return NextResponse.json({ message: 'Deleted successfully' }, { status: 204 })
}

// Validation 에러 처리
export function handleValidationError(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { 
        error: 'Validation error', 
        details: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      },
      { status: 400 }
    )
  }
  return null
}

// 페이지네이션 응답
export function paginatedResponse(data: unknown[], pagination: {
  page: number
  limit: number
  total: number
}) {
  return successResponse({
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  })
}
