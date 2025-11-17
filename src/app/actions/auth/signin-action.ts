/**
 * 로그인 Server Action
 * Google OAuth를 통한 로그인 처리
 */

"use server";

import { signIn } from "@/lib/server/auth";

/**
 * Google OAuth 로그인
 * FormData에서 callbackUrl을 읽어서 로그인 처리
 */
export async function signInAction(formData: FormData): Promise<void> {
  const callbackUrl = formData.get("callbackUrl")?.toString() || "/";
  await signIn("google", { redirectTo: callbackUrl });
}
