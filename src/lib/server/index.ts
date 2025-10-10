/**
 * 서버 전용 모듈
 * 
 * ⚠️ 이 모듈은 서버 환경에서만 사용 가능합니다!
 * 클라이언트 컴포넌트에서 import하면 Prisma 번들링 에러가 발생합니다.
 * 
 * ✅ 사용 가능한 곳:
 * - Server Components (기본)
 * - Server Actions ('use server')
 * - API Routes (app/api/*)
 * 
 * ❌ 사용 금지:
 * - Client Components ('use client') → @/lib/client 사용!
 * 
 * 📦 포함된 모듈:
 * - api: API 응답 헬퍼 및 서버 유틸리티
 * - auth: NextAuth 설정 및 인증 유틸리티
 * - database: Prisma 클라이언트 및 데이터 직렬화
 * - config: 환경 변수 관리
 */

export * from './api'
export * from './auth'
export * from './database'
export * from './config'

