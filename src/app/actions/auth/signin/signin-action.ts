/**
 * 로그인 Server Action
 * Google OAuth 및 Naver OAuth를 통한 로그인 처리
 */

"use server";

import { signIn } from "@/lib/server/auth";
import { signInSchema } from "./schema";

/**
 * OAuth 로그인
 * FormData에서 provider와 callbackUrl을 읽어서 로그인 처리
 */
export async function signInAction(formData: FormData): Promise<void> {
  // FormData에서 데이터 추출
  const rawData = {
    provider: formData.get("provider")?.toString() || "google",
    callbackUrl: formData.get("callbackUrl")?.toString() || "/",
  };

  // Zod 스키마로 데이터 검증
  const validatedFields = signInSchema.safeParse(rawData);

  if (!validatedFields.success) {
    throw new Error(
      validatedFields.error.issues.map((issue) => issue.message).join(", ") ||
        "입력값을 확인해주세요"
    );
  }

  const { provider, callbackUrl } = validatedFields.data;

  await signIn(provider, { redirectTo: callbackUrl });
}
