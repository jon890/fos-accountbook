/**
 * 응답 검증 단위 테스트 (ADR-F42, ADR-F09 jest.mock 방식)
 * @jest-environment node
 */

import { z } from "zod";
import ky from "@/__mocks__/ky";
import { serverApiGet, serverApiPost } from "@/lib/server/api/client";
import { validateResponse } from "@/lib/server/api/validate-response";
import { ResponseValidationError } from "@/lib/server/api/types";
import { paginationSchema } from "@/lib/schemas/responses/common";

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
  },
}));

jest.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

const itemSchema = z.object({ name: z.string(), amount: z.number() });

function mockBody(method: "get" | "post", body: unknown) {
  ky[method].mockResolvedValueOnce({
    json: jest.fn().mockResolvedValue(body),
    status: 200,
  });
}

describe("validateResponse", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("맞는 데이터는 그대로 돌려준다", () => {
    expect(
      validateResponse("/expenses", itemSchema, { name: "점심", amount: 9000 })
    ).toEqual({ name: "점심", amount: 9000 });
  });

  it("모르는 필드는 버리고 통과한다", () => {
    expect(
      validateResponse("/expenses", itemSchema, {
        name: "점심",
        amount: 9000,
        extra: "x",
      })
    ).toEqual({ name: "점심", amount: 9000 });
  });

  it("필드가 빠지면 ResponseValidationError 와 이슈 경로를 낸다", () => {
    let thrown: unknown;
    try {
      validateResponse("/expenses", itemSchema, { name: "점심" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ResponseValidationError);
    const error = thrown as ResponseValidationError;
    expect(error.endpoint).toBe("/expenses");
    expect(error.issues).toEqual([{ path: "amount", code: "invalid_type" }]);
  });

  it("엔드포인트의 UUID 와 쿼리를 경로 템플릿으로 바꾼다", () => {
    const endpoint =
      "/families/123e4567-e89b-12d3-a456-426614174000/expenses?page=1";

    expect(() => validateResponse(endpoint, itemSchema, {})).toThrow(
      "응답 계약 위반: /families/:uuid/expenses"
    );
  });

  it("로그와 오류 message 에 응답 값이 없다", () => {
    const secret = "비밀-응답-값-9876";
    let thrown: unknown;
    try {
      validateResponse("/expenses", itemSchema, { name: secret, amount: "x" });
    } catch (error) {
      thrown = error;
    }

    const logged = errorSpy.mock.calls.flat().join(" ");
    expect(logged).toContain("/expenses");
    expect(logged).toContain("amount");
    expect(logged).not.toContain(secret);
    expect((thrown as Error).message).not.toContain(secret);
    expect(
      JSON.stringify((thrown as ResponseValidationError).issues)
    ).not.toContain(secret);
  });

  it("빈 목록은 통과하고 페이지 필드가 빠지면 실패한다", () => {
    const schema = paginationSchema(itemSchema);

    expect(
      validateResponse("/expenses", schema, {
        items: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
      }).items
    ).toEqual([]);
    expect(() => validateResponse("/expenses", schema, { items: [] })).toThrow(
      ResponseValidationError
    );
  });
});

describe("API 래퍼의 schema 인자", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("serverApiGet 은 맞는 응답 data 를 돌려준다", async () => {
    mockBody("get", {
      success: true,
      data: { name: "점심", amount: 9000, extra: 1 },
    });

    await expect(
      serverApiGet("/expenses/1", { schema: itemSchema })
    ).resolves.toEqual({ name: "점심", amount: 9000 });
  });

  it("serverApiGet 은 어긋난 응답이면 ResponseValidationError 를 던진다", async () => {
    mockBody("get", { success: true, data: { name: "점심" } });

    await expect(
      serverApiGet("/expenses/1", { schema: itemSchema })
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });

  it("serverApiPost 도 schema 로 검증한다", async () => {
    mockBody("post", { success: true, data: { name: 1, amount: 2 } });

    await expect(
      serverApiPost("/expenses", { a: 1 }, { schema: itemSchema })
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });

  it("schema 가 없으면 검증하지 않는다", async () => {
    mockBody("get", { success: true, data: { anything: true } });

    await expect(serverApiGet("/expenses/1")).resolves.toEqual({
      anything: true,
    });
  });
});
