/**
 * 소셜 로그인 서명 단위 테스트
 * @jest-environment node
 */

jest.mock("server-only", () => ({}));

import { createHmac } from "node:crypto";
import { signSocialLoginAssertion } from "@/lib/server/auth/social-login-assertion";

const SECRET = "shared-auth-secret-between-frontend-and-backend";
const NOW = Date.UTC(2026, 8, 30, 0, 0, 0);

const decode = (part: string) =>
  JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

describe("signSocialLoginAssertion", () => {
  const token = signSocialLoginAssertion(
    { provider: "google", providerId: "google-123", email: "user@example.com" },
    SECRET,
    NOW
  );
  const [header, payload, signature] = token.split(".");

  it("HS256 JWT 세 부분으로 만든다", () => {
    expect(token.split(".")).toHaveLength(3);
    expect(decode(header)).toEqual({ alg: "HS256", typ: "JWT" });
  });

  it("백엔드가 비교하는 수신자, 신원, 60초 수명을 싣는다", () => {
    expect(decode(payload)).toEqual({
      aud: "accountbook-social-login",
      sub: "google:google-123",
      email: "user@example.com",
      iat: NOW / 1000,
      exp: NOW / 1000 + 60,
    });
  });

  it("AUTH_SECRET 에서 파생한 키로 HMAC-SHA256 서명한다", () => {
    const key = createHmac("sha256", SECRET)
      .update("accountbook-social-login")
      .digest();
    const expected = createHmac("sha256", key)
      .update(`${header}.${payload}`)
      .digest("base64url");
    expect(signature).toBe(expected);
  });

  it("이메일이 없으면 null 로 싣는다", () => {
    const withoutEmail = signSocialLoginAssertion(
      { provider: "naver", providerId: "n-1" },
      SECRET,
      NOW
    );
    expect(decode(withoutEmail.split(".")[1]).email).toBeNull();
  });
});
