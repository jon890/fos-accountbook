/**
 * Next.js Instrumentation
 *
 * 앱이 시작될 때 실행되는 설정 파일입니다.
 * 환경변수 검증, 초기화 등을 수행합니다.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // 환경변수 검증 (import하는 순간 검증됨)
    await import("@/lib/env/server.env");
    // 클라이언트 환경변수는 현재 사용되지 않음
    // 필요 시 client.env.ts의 주석을 해제하세요
    // await import("@/lib/env/client.env");

    console.log("✅ Environment variables validated successfully");
  }
}
