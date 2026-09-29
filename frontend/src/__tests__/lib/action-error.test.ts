/**
 * handleActionError 변환기 단위 테스트 (ADR-F09 jest.mock 방식)
 * @jest-environment node
 */

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
  },
}));

import { handleActionError, ActionError } from "@/lib/errors/action-error";
import { ServerApiError } from "@/lib/server/api/types";

describe("handleActionError 변환기", () => {
  describe("ServerApiError 401 → A002 변환", () => {
    it("status 401 ServerApiError를 A002(SESSION_EXPIRED)로 변환한다", () => {
      const error = new ServerApiError("Unauthorized", 401);
      const result = handleActionError(error, "기본 에러 메시지");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("A002");
        expect(result.error.message).toBe("세션이 만료되었습니다");
      }
    });

    it("status 401이 아닌 ServerApiError(500)는 internalError(C 계열)로 변환한다 (회귀 방지)", () => {
      const error = new ServerApiError("Internal Server Error", 500);
      const result = handleActionError(error, "서버 오류");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("C003");
      }
    });

    it("status 없는 ServerApiError는 internalError(C 계열)로 변환한다", () => {
      const error = new ServerApiError("Unknown error");
      const result = handleActionError(error, "서버 오류");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("C003");
      }
    });
  });

  describe("이미 ActionError인 경우 그대로 통과", () => {
    it("ActionError는 변환 없이 그대로 반환한다", () => {
      const error = ActionError.unauthorized();
      const result = handleActionError(error, "기본 메시지");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("A001");
      }
    });
  });

  describe("ActionError.sessionExpired() 헬퍼", () => {
    it("기본 메시지로 A002 에러를 생성한다", () => {
      const error = ActionError.sessionExpired();
      expect(error.code).toBe("A002");
      expect(error.message).toBe("세션이 만료되었습니다");
    });

    it("커스텀 메시지로 A002 에러를 생성한다", () => {
      const error = ActionError.sessionExpired("토큰이 만료되었습니다");
      expect(error.code).toBe("A002");
      expect(error.message).toBe("토큰이 만료되었습니다");
    });
  });
});
