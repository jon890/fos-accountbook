# ADR-F23: semantic foreground 토큰 (`--color-{semantic}-fg`) 으로 강조 배경 위 텍스트 색 명시
- **결정**: `bg-expense` / `bg-income` / `bg-warning` 같은 채도 높은 시맨틱 배경 위에 텍스트를 얹을 때는 `text-white` / `text-black` 하드코딩 대신 **시맨틱 foreground 토큰** (`--color-expense-fg` 등) 을 사용한다. light/dark 양쪽에서 동일하게 강조 배경과 대비되는 near-white 값 `oklch(0.985 0.003 <배경 hue>)` 으로 정의 — surface `--color-fg` (light=어두움, dark=밝음) 와 분리. **hue 통일 원칙**: foreground 토큰의 hue 는 항상 대응 배경 토큰과 일치 (시맨틱 일관성). plan017 의 임시 `expense-fg hue=230` 은 plan022 에서 hue=25 로 통일.
- **맥락**: plan017 NotificationBell 의 `bg-expense text-white` Badge 가 ADR-F13 (OKLCH 토큰 강제, hex/rgb/hsl/named color 금지) 의 정신과 충돌. 단순 교체로 `text-bg` 같은 surface foreground 를 쓰면 dark mode 에서 `--color-bg` 가 어두운 색이 되어 빨간 expense 배경 위에서 가독성이 더 나빠짐. 강조 배경은 light/dark 무관하게 채도 유지가 의도이므로 foreground 도 모드 독립적 near-white 가 자연스럽다.
- **대안 기각**:
  - `text-white` 유지: ADR-F13 의 "globals.css `@theme` 외부에서 hex/rgb/hsl/named 색 금지" 원칙 위반. 디자인 토큰 단일 소스 깨짐.
  - `text-bg` (surface foreground): light/dark 가 반전되는 토큰이라 강조 배경 위 가독성 일관성 깨짐 (dark mode 에서 어두운 색 → expense 빨강 위 contrast 약화).
  - 인라인 `style={{ color: "white" }}`: ADR-F13 위반 + CLAUDE.md "인라인 style 최소화" 위반.
- **트레이드오프**: 토큰 수 증가 (brand-fg / expense-fg / income-fg / warning-fg 4 종). 단 ADR-F13 의 정합성 + dark mode 가독성 일관성 이득이 큼.
- **적용 범위 (plan022 완전 정착)**: `src/app/globals.css` 4 토큰 정의 + 51 호출처 일괄 마이그레이션. **매핑 룰**:
  - `gradient-budget` / `gradient-family` / `gradient-primary` / `gradient-category` / `bg-brand-*` 위 → `text-brand-fg`
  - `gradient-expense` / `bg-expense` / `bg-destructive` 위 → `text-expense-fg`
  - `gradient-income` / `bg-income` 위 → `text-income-fg`
  - `bg-warning` 위 → `text-warning-fg`
  - gradient/배경이 surface (bg-bg-elev 등) 인 경우는 본 ADR 비대상 — 일반 `text-fg` 사용

---

