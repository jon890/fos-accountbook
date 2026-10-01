# ADR-F29: Tailwind v4 markdown 스캔 위험 패턴 차단 — md-lint 게이트 + 안전 표기 (2026-06-02)

- **결정**: `tasks/`·`docs/`·`.claude/skills/` markdown 의 위험 arbitrary class 패턴(닫힌 `[...]` 안 와일드카드·중괄호)을 `scripts/check-tailwind-md.mjs` 로 검출하고 CI(`pnpm lint:md`)에서 차단한다.
  패턴 자체를 안전 표기(placeholder)로 쓰는 것을 작성 규율로 삼는다.
- **맥락**: Tailwind v4 자동 content 탐지가 `tasks/`·`docs/`·`.claude/skills/` 의 `.md` 까지 스캔했다.
  arbitrary value 안에 와일드카드·중괄호가 든 표기가 invalid CSS 로 파싱돼 dev 서버가 통째로 500 을 반환했다(2026-06-02 직접 발생 — 함정 코드 CODE-3).
- **`@source not` 미채택 이유 (2026-06 실측)**: `globals.css` 에 `@source not "../../tasks/**"` 를 넣어도 Turbopack(Next 16 dev)에서 markdown 스캔이 계속됐다.
  원천 차단이 안 되므로 1차 방어로 부적합 → `globals.css` 에 넣지 않는다.
  유일하게 확실한 해결은 위험 패턴을 안전 표기로 바꾸는 것이며, lint 게이트가 이를 기계로 강제한다.
- **`next build` 부적합 이유**: production build 는 invalid CSS 를 경고로 넘기고 통과(`Compiled successfully`)한다.
  dev 에서만 500 이 발생하므로 CI 에 `next build` 를 추가해도 이 버그를 잡지 못한다.
- **대안 기각**:
  - `@source not` 1차 방어: Turbopack 미작동(위 실측)으로 무효.
  - `next build` CI 게이트: 위 이유로 부적합.
- **모노레포 이관 뒤 (2026-09-29 실측)**: Tailwind 스캔 기준 디렉터리는 `frontend/` 다. `frontend/docs/` 의 `.md` 는 스캔되고 루트 `tasks/` 의 `.md` 는 스캔되지 않는다.
  그래서 검사 대상은 `frontend/` 아래 `docs/`, `.claude/skills/` 다. 루트 `tasks/` 계획서는 이 위험 밖에 있다.
- **적용 범위**: `scripts/check-tailwind-md.mjs`, `package.json`, `.github/workflows/frontend-ci.yml`.
  함정 코드: `common-pitfalls.md` CODE-3(`auto-gate: md-lint`).


