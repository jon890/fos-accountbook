/**
 * 서버 API 타입 정의
 */

import type { z } from "zod";

/**
 * 서버 API 에러 클래스
 */
export class ServerApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorData?: unknown
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

/**
 * 응답 data 가 기대한 스키마와 어긋날 때 던지는 에러 (ADR-F42)
 * message 와 issues 에는 응답 값과 UUID 를 담지 않는다. 경로와 코드만 담는다.
 */
export interface ResponseValidationIssue {
  path: string;
  code: string;
}

export class ResponseValidationError extends Error {
  constructor(
    public endpoint: string,
    public issues: ResponseValidationIssue[]
  ) {
    super(`응답 계약 위반: ${endpoint}`);
    this.name = "ResponseValidationError";
  }
}

/**
 * 백엔드 API 응답 타입
 */
export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message?: string; error?: string };

/**
 * 서버 사이드 API 호출 옵션
 */
export interface ServerApiOptions extends RequestInit {
  /** 인증 헤더를 포함하지 않음 (공개 API 호출 시 사용) */
  skipAuth?: boolean;
}

/**
 * 응답 검증을 켜는 선택 인자. 있으면 response.data 를 이 스키마로 검증한다.
 */
export interface ResponseSchemaOption<T> {
  schema?: z.ZodType<T>;
}
