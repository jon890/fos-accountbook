/**
 * 외부 에이전트 연동 토큰 (backend ADR-B18)
 */

export interface ApiToken {
  uuid: string;
  name: string;
  tokenPrefix: string; // 표시용 앞부분 (fab_ + 8자)
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreatedApiToken extends ApiToken {
  token: string; // 원문. 발급 응답에서만 받는다
}
