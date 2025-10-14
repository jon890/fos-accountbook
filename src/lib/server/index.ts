/**
 * 서버 전용 모듈
 *
 * ⚠️ 이 모듈은 서버 환경에서만 사용 가능합니다!
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
 * - api: 백엔드 API 클라이언트 및 응답 헬퍼
 * - auth: NextAuth 설정 및 인증 유틸리티
 * - config: 환경 변수 관리
 *
 * 💡 데이터베이스: 백엔드 API를 통해서만 접근
 */

export * from "./api";
export * from "./auth";
export * from "./config";
