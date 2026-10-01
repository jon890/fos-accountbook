# ADR-F07: Shadcn + Tailwind CSS v4

**결정**: UI 컴포넌트는 Shadcn 패턴, 스타일링은 Tailwind CSS v4

**이유**:

- Shadcn: 소유권이 있는 UI (복사 방식) → 커스터마이징 자유도 높음
- Tailwind v4: `tailwind.config.js` 불필요, `@theme` 블록으로 CSS 변수 관리
- Radix UI 기반 → 접근성(ARIA) 자동 처리

**색상 규칙**: 시맨틱 클래스(`gradient-expense`, `gradient-income` 등) 사용, 하드코딩 금지

---


