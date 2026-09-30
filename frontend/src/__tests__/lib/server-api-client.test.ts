/**
 * serverApiClient beforeError 훅 단위 테스트 (ADR-F09 jest.mock 방식)
 * @jest-environment node
 */

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
  },
}));

jest.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

import { HTTPError } from "@/__mocks__/ky";
import { logAndImproveHttpError } from "@/lib/server/api/client";

describe("beforeError 훅", () => {
  it("훅이 지나간 뒤에도 응답 body 를 다시 읽을 수 있다", async () => {
    const message = "색상은 #RRGGBB 또는 oklch(L C H) 형식이어야 합니다";
    const response = new Response(
      JSON.stringify({ errors: [{ field: "color", message }] }),
      { status: 400, headers: { "content-type": "application/json" } }
    );

    await logAndImproveHttpError(new HTTPError(response));

    const body = (await response.json()) as {
      errors: { message: string }[];
    };
    expect(body.errors[0].message).toBe(message);
  });
});
