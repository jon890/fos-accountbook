/**
 * 클라이언트 전용 모듈
 * 
 * 브라우저 환경에서 안전하게 사용 가능한 모듈들입니다.
 * 클라이언트 컴포넌트 ('use client')에서 이 모듈만 사용하세요.
 * 
 * ✅ 사용 가능한 곳:
 * - Client Components ('use client')
 * - Server Components
 * - Server Actions
 * 
 * 📦 포함된 모듈:
 * - api: 백엔드 API 호출 함수들
 * - utils: Tailwind 병합 등 범용 유틸리티
 */

export * from './api'
export * from './utils'

