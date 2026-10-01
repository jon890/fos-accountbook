# Phase 04. 느린 응답에서 대기 표시를 확인하는 브라우저 테스트

**Execution profile**: fast
**Domain**: app-router

## 목표

가짜 백엔드가 응답을 늦출 때, 같은 화면 전환과 화면 간 전환과 가족 전환 시트에서 대기 표시가 실제로 보이는 것을 브라우저 테스트가 확인한다.

**범위 외**: 구현은 phase 01 부터 03 에서 끝났다. 여기서는 테스트와 가짜 백엔드만 바꾼다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F39-navigation-pending-feedback.md`, `frontend/docs/adr/ADR-F34-browser-tests-fake-backend.md`.

코드에서 확인한 사실:

- `frontend/browser/fake-backend.mjs` 에는 알림 응답만 붙잡는 `POST /__test/notifications-delay`(`{ hold: boolean }`)가 있고, `POST /__test/reset` 이 그 상태를 되돌린다.
- 브라우저 테스트는 `frontend/browser/*.spec.ts` 이고 `pnpm test:browser` 로 돈다. 모바일 390px, 데스크톱 1280px 두 프로젝트로 돈다.

## 의도 메모

- 일반화한 지연 장치를 더한다. `POST /__test/delay` 가 `{ pathPrefix: string, ms: number }` 를 받아, 그 접두사로 시작하는 `/api/v1/...` 요청을 `ms` 만큼 늦춘다. `ms: 0` 이나 `/__test/reset` 이 해제한다. 기존 `notifications-delay` 는 그대로 둔다.
- 지연은 1500ms 로 둔다. 진행 막대가 뜨는 150ms 보다 충분히 길고, 테스트 시간은 짧다.

## 작업 항목

### 1. `fake-backend.mjs` 에 `/__test/delay` 추가

### 2. `frontend/browser/navigation-loading.spec.ts`(신규): 같은 화면 전환

- `/transactions` 에서 지출 목록 API 를 늦추고 「수입」 탭을 누르면, 응답 전에 `role="progressbar"` 가 보이고 목록 영역이 `aria-busy="true"` 다. 응답 뒤 둘 다 사라진다.
- `/calendar` 에서 달력 API 를 늦추고 다음 달로 가면 같은 두 가지가 보인다.

### 3. 같은 spec 에 화면 간 전환과 가족 전환 시트

- 하단 탭으로 다른 화면에 갈 때 `.ab-skel` 스켈레톤이 응답 전에 보인다(기존 동작의 회귀 방지).
- 모바일에서 헤더의 「가족 전환」 을 누르면 가족 목록 API 응답 전에 시트가 열리고 스켈레톤이 보인다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test:browser
pnpm test:browser browser/navigation-loading.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/browser/navigation-loading.spec.ts` | 신규 |
