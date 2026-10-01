# ADR-F13: OKLCH 색 시스템 채택
- **결정**: 모든 디자인 토큰을 OKLCH 색 공간으로 정의한다 (HSL 채널 패턴 폐기). brand 50~900, semantic(income/expense/warning), neutral 0~950, surface(bg/fg/border 등) 모두 `oklch(L C H)` 평면 값.
- **맥락**: Teal fintech 리디자인(`tokens.js` / `styleguide.css` handoff)에서 brand=Teal h=188(→ 현재 Toss Blue h=257, [ADR-F28](#adr-f28)) + semantic 분리 + dark mode 토큰을 한 번에 정의해야 함. HSL 은 어두운 색 명도가 hue 따라 다르게 인지됨 → 토큰 스케일이 시각적으로 균일하지 않음.
- **대안 기각**:
  - HSL 채널 + shadcn 패턴 유지: 어두운 색에서 명도 들쭉날쭉. brand 50~900 같은 단계 스케일에 부적합.
  - 하이브리드 (shadcn HSL + OKLCH 일부): 동일 토큰을 두 형식으로 관리 → 동기화 사고 위험.
- **트레이드오프**: 실측상 `src/components/ui/` 내 `hsl(var(--))` 패턴 0건 — `:root` 의 토큰 값 OKLCH 교체만으로 자동 호환. 별도 rewrite phase 불필요.
- **예외**: white/black alpha overlay (`rgba(255,255,255,α)`, `rgba(0,0,0,α)`) 는 functional alpha 표현이라 OKLCH 의무화 대상 외. `.glass`, `.gradient-card-overlay`, `.hover-lift` 등 글래스/딤 효과에 한정. brand/semantic 색은 OKLCH 강제.
- **적용 범위**: `src/app/globals.css` + `src/components/ui/*`.

---


