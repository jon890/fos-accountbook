/**
 * 클라이언트 환경변수 스키마 정의
 *
 * 클라이언트 사이드에서 사용되는 환경변수의 Zod 스키마를 정의합니다.
 * NEXT_PUBLIC_ 접두사가 있는 환경변수만 클라이언트에 노출됩니다.
 *
 * 현재는 사용되지 않지만, 향후 클라이언트 환경변수가 필요할 때 쉽게 추가할 수 있도록 구조를 유지합니다.
 */

import { z } from "zod";

// 사용 시 주석을 해제하고 필요한 환경변수를 추가하세요
// export const clientEnvSchema = z.object({
//   // Public API URL (클라이언트에서 백엔드 API 호출)
//   NEXT_PUBLIC_API_BASE_URL: z.url({
//     message: "NEXT_PUBLIC_API_BASE_URL must be a valid URL",
//   }),
// });
