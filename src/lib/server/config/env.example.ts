/**
 * 환경 유틸리티 사용 예시
 * 
 * 이 파일은 예시일 뿐이며, 실제로는 src/lib/env.ts를 import해서 사용하세요.
 */

import { isDev, isProduction, isTest, isLocal, getEnvInfo } from "./env";

// ✅ 기본 사용법
if (isDev()) {
  console.log("개발 환경입니다");
}

if (isProduction()) {
  console.log("프로덕션 환경입니다");
}

if (isTest()) {
  console.log("테스트 환경입니다");
}

// ✅ 조건부 로직
const apiUrl = isDev() 
  ? "http://localhost:3000" 
  : "https://api.production.com";

// ✅ 로그 레벨 설정
const logLevel = isDev() ? "debug" : "error";

// ✅ Prisma 설정
const prismaLogConfig = isDev()
  ? [
      { level: "query", emit: "event" },
      { level: "error", emit: "stdout" },
    ]
  : [];

// ✅ 로컬 개발 환경 체크 (Vercel이 아닌 환경)
if (isLocal()) {
  console.log("로컬 개발 환경입니다 (Vercel Preview가 아님)");
}

// ✅ 환경 정보 출력 (디버깅용)
if (isDev()) {
  console.log("Environment Info:", getEnvInfo());
  /**
   * 출력 예시:
   * {
   *   nodeEnv: 'development',
   *   vercelEnv: undefined,
   *   isDev: true,
   *   isProduction: false,
   *   isTest: false,
   *   isPreview: false,
   *   isLocal: true,
   *   isServer: true
   * }
   */
}

// ✅ Server vs Client 구분
import { isServer, isClient } from "./env";

if (isServer()) {
  // 서버에서만 실행되는 코드
  console.log("서버 사이드 렌더링");
}

if (isClient()) {
  // 클라이언트에서만 실행되는 코드
  console.log("클라이언트 사이드 렌더링");
}

// ✅ 환경별 설정 객체
const config = {
  database: {
    logging: isDev(),
    connectionPoolSize: isProduction() ? 20 : 5,
  },
  cache: {
    ttl: isDev() ? 60 : 3600, // 개발: 1분, 프로덕션: 1시간
  },
  features: {
    debugMode: isDev(),
    analytics: isProduction(),
    mockData: isTest(),
  },
};

export { config };
