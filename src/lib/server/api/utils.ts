import { auth } from '@/lib/server/auth'
import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/server/api/responses'

// BigInt 직렬화를 위한 유틸리티
export function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    return obj.toString()
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt)
  }

  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value)
    }
    return serialized
  }

  return obj
}

// 인증된 사용자 정보 가져오기 (Auth.js v5)
export async function getAuthenticatedUser() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image
  }
}

// API 핸들러 래퍼 - 인증 필수
export function withAuth<T extends unknown[]>(
  handler: (user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const user = await getAuthenticatedUser()
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return await handler(user, ...args)
    } catch (error) {
      console.error('API Error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Prisma 에러 처리  
export function handlePrismaError(error: unknown) {
  console.error('Prisma Error:', error)
  
  // 에러가 객체이고 code 속성이 있는지 확인
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error as { code: string }
    
    // P2002: Unique constraint failed
    if (prismaError.code === 'P2002') {
      return errorResponse('이미 존재하는 데이터입니다', 409)
    }
    
    // P2025: Record not found
    if (prismaError.code === 'P2025') {
      return errorResponse('데이터를 찾을 수 없습니다', 404)
    }
  }
  
  return errorResponse('데이터베이스 오류가 발생했습니다')
}

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
