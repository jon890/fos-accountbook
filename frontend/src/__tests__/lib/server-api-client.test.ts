/**
 * serverApiClient beforeError 훅 단위 테스트 (ADR-F09 jest.mock 방식)
 * @jest-environment node
 */

import ky, { HTTPError, TimeoutError } from "@/__mocks__/ky";
import {
  logAndImproveHttpError,
  serverApiClient,
} from "@/lib/server/api/client";

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
  },
}));

jest.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

describe("beforeError 훅", () => {
  it("ky 가 미리 읽어 둔 error.data 로 오류 메시지를 만든다", async () => {
    const message = "색상은 #RRGGBB 또는 oklch(L C H) 형식이어야 합니다";
    const response = new Response(null, { status: 400 });
    const error = new HTTPError(response);
    error.data = { message };

    const result = await logAndImproveHttpError({ error });

    expect(result).toBe(error);
    expect(result.message).toBe(message);
  });

  it("본문이 없으면 상태 코드로 메시지를 만든다", async () => {
    const response = new Response(null, {
      status: 503,
      statusText: "Service Unavailable",
    });
    const error = new HTTPError(response);

    const result = await logAndImproveHttpError({ error });

    expect(result.message).toBe("API 오류: 503 Service Unavailable");
  });

  it("응답이 없는 오류는 그대로 돌려준다", async () => {
    const error = new TimeoutError();

    const result = await logAndImproveHttpError({ error });

    expect(result).toBe(error);
    expect(result.message).toBe("Request timed out");
  });
});

describe("백엔드 요청 정책", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(["GET", "POST", "PUT", "DELETE", "PATCH"])(
    "%s 요청에서 GET 재시도와 5초 타임아웃을 설정한다",
    async (method) => {
      await serverApiClient("/expenses", { method, skipAuth: true });

      expect(ky.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000,
          retry: {
            methods: ["get"],
            limit: 2,
            statusCodes: [408, 413, 429, 500, 502, 503, 504],
          },
        }),
      );
    },
  );

  it("타임아웃 오류를 호출자에게 전달한다", async () => {
    const error = new TimeoutError();
    ky.get.mockRejectedValueOnce(error);

    await expect(
      serverApiClient("/expenses", { skipAuth: true }),
    ).rejects.toBe(error);
  });
});
