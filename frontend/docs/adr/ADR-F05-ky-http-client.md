# ADR-F05: ky HTTP 클라이언트 (v2 갱신)

**결정**: axios 대신 ky 사용. **2026-05-09**: ky 1.x → 2.x 업그레이드 (plan004).

**현재 설치 상태 (2026-10-07)**: lockfile 의 ky 버전은 2.1.0 이고, hook 은 단일 state 객체 방식을 사용한다.

**이유**:

- Node 22+ native fetch 기반 → 추가 polyfill 없음
- 번들 크기: ky ~4KB vs axios ~13KB
- TypeScript 타입 기본 제공
- 자동 재시도 설정이 간결 (`retry` 옵션)

**재시도 설정**: 408, 413, 429, 500, 502, 503, 504 → 최대 2회 재시도

**대체된 부분**: 재시도 대상 메서드와 타임아웃은 [ADR-F31](ADR-F31-get-retry-timeout.md) 이 정한다. 재시도는 GET 만 한다.

**ky 2.x 마이그레이션 결정 (2026-05-09)**:

| 항목 | 결정 | 이유 |
|---|---|---|
| URL 베이스 옵션 | `prefixUrl` → `prefix` rename | 단순 string join 으로 현재 동작 유지. `baseUrl` 은 standard URL resolution 으로 leading slash 의미 달라져 회귀 위험 |
| Hook signature | 단일 state object (`{request, options, retryCount, ...}`) | ky 2.0 강제 변경. 기존 위치 인자 폐지 |
| `.json()` 빈 body 처리 | 가드를 두지 않는다 | ky 2.0 이 빈 body / 204 에서 throw 하지만, 백엔드는 모든 응답을 `ApiResponse<T>` envelope 로 보내고 204 를 쓰지 않는다 |
| `HTTPError.data` 활용 | `beforeError` / catch 의 `.json().catch(() => null)` 패턴 제거 | ky 2.0 이 자동 파싱 + resource leak 해결. 코드 단순화 |
| `beforeError` 시그니처 | 객체 인자 + 모든 에러 받음 (HTTPError 한정 아님) | ky 2.0 변경. `error.response` 가 undefined 가능 → 명시 가드 |

**적용 범위**: `src/lib/server/api/client.ts`, `src/__mocks__/ky.ts`.

---


