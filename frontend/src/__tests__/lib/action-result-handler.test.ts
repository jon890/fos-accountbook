/**
 * action-result-handler 단위 테스트 (ADR-F09 jest.mock 방식)
 * @jest-environment node
 */

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
  },
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { redirect } from "next/navigation";
import {
  getActionDataOrDefault,
  handleActionError,
} from "@/lib/server/action-result-handler";
import type { ActionResult } from "@/lib/errors";

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe("getActionDataOrDefault", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it("성공 결과는 데이터를 반환한다", () => {
    const result: ActionResult<number> = { success: true, data: 42 };
    const value = getActionDataOrDefault(result, 0);
    expect(value).toBe(42);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("A002(SESSION_EXPIRED) 실패 결과는 redirect를 호출한다 (ADR-F26)", () => {
    const result: ActionResult<number> = {
      success: false,
      error: { code: "A002", message: "세션이 만료되었습니다" },
    };

    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    expect(() => getActionDataOrDefault(result, 0)).toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("/auth/signin")
    );
  });

  it("A001(UNAUTHORIZED) 실패 결과는 redirect를 호출한다 (ADR-F26)", () => {
    const result: ActionResult<number> = {
      success: false,
      error: { code: "A001", message: "로그인이 필요합니다" },
    };

    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    expect(() => getActionDataOrDefault(result, 0)).toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("/auth/signin")
    );
  });

  it("비인증 실패 결과(C 계열)는 기본값을 반환한다", () => {
    const result: ActionResult<number> = {
      success: false,
      error: { code: "C003", message: "서버 오류" },
    };

    const value = getActionDataOrDefault(result, 99);
    expect(value).toBe(99);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

describe("handleActionError (redirect 처리기)", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it("A002 에러는 /auth/signin?error=auth 로 redirect한다", () => {
    const result = {
      success: false as const,
      error: { code: "A002" as const, message: "세션이 만료되었습니다" },
    };

    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    expect(() => handleActionError(result)).toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error=auth")
    );
  });
});
