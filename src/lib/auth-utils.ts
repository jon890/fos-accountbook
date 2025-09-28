/**
 * 인증 관련 유틸리티
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

// 인증된 사용자 정보 타입
export interface AuthenticatedUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

// 인증된 사용자 정보 가져오기
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name || null,
    email: session.user.email || null,
    image: session.user.image || null
  }
}

// 인증 필수 API 핸들러 래퍼
export function withAuth<T extends unknown[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const user = await getAuthenticatedUser()
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return await handler(user, ...args)
    } catch (error) {
      console.error('API Auth Error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// 선택적 인증 API 핸들러 래퍼
export function withOptionalAuth<T extends unknown[]>(
  handler: (user: AuthenticatedUser | null, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const user = await getAuthenticatedUser()
      return await handler(user, ...args)
    } catch (error) {
      console.error('API Optional Auth Error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}
