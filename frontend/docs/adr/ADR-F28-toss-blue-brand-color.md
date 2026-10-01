# ADR-F28: brand 색 Teal(h=188) → Toss Blue(h=257) 변경 (2026-06-02)

- **결정**: brand 토큰 `--color-brand-{50..900}` + tint/fg, 그리고 brand 에서 파생되는 shadow·`--primary`·`--ring`·`gradient-{primary,family,category}` 의 hue 를 188(Teal) 에서 257(Toss Blue) 로 변경한다.
  - semantic(income 152 / expense 25 / warning 78) 과 neutral(230) 은 불변.
  - 카테고리 home 톤(`--color-cat-home`)은 brand 와 독립한 카테고리 팔레트라 188(teal) 유지.
  - dark mode `--primary`/`--ring` 도 257 로 일관 적용.
- **맥락**: Teal 보다 시원하고 선명한 파랑(Toss `#3182F6` ≈ `oklch(0.624 0.196 257)`) 을 brand 로 선호.
  brand 토큰만 바꾸면 헤더·버튼·FAB 는 자동 반영되지만, 예산 카드 gradient 는 바뀌지 않았다.
  gradient 클래스·shadow·`--primary`·`--ring` 이 brand 토큰을 참조하지 않고 hue 를 직접 하드코딩하고 있어, 이들도 257 로 함께 바꿔야 전역 적용이 완성됐다.
- **트레이드오프**: gradient/shadow 가 `var(--color-brand-*)` 를 참조했다면 토큰 한 곳만 바꾸면 됐다.
  hue 하드코딩이라 `globals.css` 전반의 188→257 일괄 치환이 필요했다.
  향후 brand 재변경 비용을 줄이려면 gradient 정의를 brand 토큰 참조로 리팩토링하는 별도 작업이 바람직하다.
- **적용 범위**: `src/app/globals.css`. ADR-F13 의 OKLCH 체계는 불변 — 본 ADR 은 brand hue 값만 갱신.


