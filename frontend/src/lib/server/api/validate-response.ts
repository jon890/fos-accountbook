import type { z } from "zod";
import { ResponseValidationError } from "./types";

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * 엔드포인트에서 쿼리를 떼고 UUID 를 `:uuid` 로 바꾼다. 로그와 오류 message 용이다.
 */
function toPathTemplate(endpoint: string): string {
  return endpoint.split("?")[0].replace(UUID_PATTERN, ":uuid");
}

/**
 * 백엔드 응답 data 를 스키마로 검증한다 (ADR-F42).
 * 어긋나면 엔드포인트 경로 템플릿과 이슈 경로만 로그에 남기고 ResponseValidationError 를 던진다.
 * 응답 값은 로그와 오류에 넣지 않는다.
 */
export function validateResponse<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const template = toPathTemplate(endpoint);
  const issues = result.error.issues.map((issue) => ({
    path: issue.path.map(String).join(".").replace(UUID_PATTERN, ":uuid"),
    code: issue.code,
  }));
  console.error(
    `[ResponseValidation] ${template} ${issues.map((i) => `${i.path || "(root)"}:${i.code}`).join(", ")}`
  );
  throw new ResponseValidationError(template, issues);
}
