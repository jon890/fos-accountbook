# ADR-F14: Pretendard Variable 폰트 도입
- **결정**: 메인 sans 폰트를 Geist 에서 **Pretendard Variable** 로 교체. 수치 폰트는 **Inter** 도입 (tabular-nums + `.num` 유틸리티). next/font `localFont` 자체 호스팅 (woff2).
- **맥락**: 가족 단위 가계부 UI 는 한글 비중 100%. Geist 는 라틴 우선 — 한글은 system fallback 으로 떨어져 한 화면에 두 폰트가 섞임. Pretendard 는 한국 fintech 표준에 가까운 한글 가독성.
- **대안 기각**:
  - Geist 유지: 한글 fallback 으로 일관성 결여.
  - Apple SD Gothic Neo (system): 윈도우/안드로이드에서 다른 폰트로 렌더 → cross-platform 비일관.
  - CDN @import: 도메인 의존 + FOUT 위험. self-host woff2 + next/font 가 CLS 방지 + 결정적 빌드.
- **적용 범위**: `src/app/layout.tsx` + `src/app/globals.css` (`--font-sans`, `--font-num`).

---


