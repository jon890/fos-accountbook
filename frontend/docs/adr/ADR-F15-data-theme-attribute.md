# ADR-F15: next-themes attribute='data-theme'
- **결정**: `next-themes` 의 `attribute` 옵션을 기본 `class` 에서 `data-theme` 으로 전환. dark 토큰 적용 셀렉터는 `[data-theme="dark"]`.
- **맥락**: Handoff 토큰 컨벤션이 `[data-theme="dark"]` 로 정의됨. 또한 기존 `.dark` 셀렉터는 유틸리티 클래스 (`dark:bg-...`) 와 grep 시 동시에 잡혀 토큰-only 변경 추적이 어려움.
- **대안 기각**:
  - `attribute='class'` 유지: handoff 토큰을 그대로 import 하려면 셀렉터를 `.dark` 로 일괄 치환해야 하고, Tailwind v4 의 `dark:` 변형이 `.dark` 클래스 의존이라 둘 사이의 동작 차이를 매번 확인해야 함.
  - 두 셀렉터 병행 (`.dark, [data-theme="dark"]`): 토큰 정의 중복.
- **트레이드오프**: Tailwind v4 의 `dark:` 변형이 기본으로 `.dark` 클래스를 본다 — `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` 커스텀 정의 필요. plan001 phase 1 에서 globals.css 에 추가.
- **적용 범위**: `src/app/providers.tsx` (or wherever `ThemeProvider` is) + `src/app/globals.css`.

---


