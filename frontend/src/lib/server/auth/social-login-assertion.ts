import "server-only";

import { createHmac } from "node:crypto";

/** 백엔드 SocialLoginAssertionVerifier 와 맞춰야 하는 값 */
export const SOCIAL_LOGIN_ASSERTION_HEADER = "X-Social-Login-Assertion";
const AUDIENCE = "accountbook-social-login";
const LIFETIME_SECONDS = 60;

type SocialLoginIdentity = {
  provider: string;
  providerId: string;
  email?: string | null;
};

const base64url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

/**
 * OAuth 로그인을 마친 신원에 AUTH_SECRET 으로 서명한 짧은 수명의 HS256 JWT 를 만든다.
 *
 * 백엔드는 이 서명이 있어야 social-login 요청을 받는다.
 * 서명이 없으면 백엔드에 닿는 누구든 providerId 만으로 다른 사용자의 토큰을 받을 수 있다.
 */
export function signSocialLoginAssertion(
  { provider, providerId, email }: SocialLoginIdentity,
  secret: string,
  now: number = Date.now()
): string {
  const issuedAt = Math.floor(now / 1000);
  const header = base64url({ alg: "HS256", typ: "JWT" });
  const payload = base64url({
    aud: AUDIENCE,
    sub: `${provider}:${providerId}`,
    email: email ?? null,
    iat: issuedAt,
    exp: issuedAt + LIFETIME_SECONDS,
  });
  const signature = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}
