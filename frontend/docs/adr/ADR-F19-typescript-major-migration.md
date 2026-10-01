# ADR-F19: TypeScript 5.9 → 6.0 메이저 이전 + breaking 대응 패턴
- **결정**: TypeScript 컴파일러를 `^5` 에서 `^6` 메이저로 이전. release note 의 stricter inference / lib.d.ts 변경 / decorator 표준 채택 등으로 발생하는 type 에러를 plan008 의 각 phase 에서 카테고리별 패턴 적용으로 일괄 수정.
- **맥락**: PR #179 (Dependabot) 가 단순 dep bump 만 제안 — typescript 메이저는 전체 `.ts/.tsx` 컴파일에 영향이라 tsc 실측 후 에러 카테고리 식별 필수. ky/react-day-picker (단일 파일) 대비 영향 면적 큼. 미루면 보안/성능 개선 누적 손실 + msw·jest·eslint-config-next 등 peer dep 가 ts6 로 먼저 옮겨가면 빌드 분리 위험.
- **대안 기각**:
  - ts5 stick: 보안/유지보수 + 신 inference 혜택 미수용. peer dep 호환 점진 분리 위험.
  - Dependabot PR #179 그대로 머지: tsc 에러 무대응으로 빌드 회귀.
- **트레이드오프**: 메이저 dep bump 의 첫 번째 적용. 발견 에러를 단순 fix 로 처리 못 하는 케이스 (예: inference 변경으로 라이브러리 측 타입 깨짐) 는 별도 plan 으로 분리.
- **breaking 대응 패턴 (plan008 실측)**:
  - lib.d.ts 변경: 0건 — `target: ES2017` + `skipLibCheck: true` 조합으로 신규 Temporal/ES2025 type 노출 없음.
  - inference 변경: 0건 — contextual typing 변화로 인한 에러 미발생.
  - 신 기본값 (`noUncheckedSideEffectImports: true`): 1건 — `src/app/layout.tsx` 의 `import './globals.css'` TS2882. `src/types/css.d.ts` 에 `declare module '*.css'` 선언으로 fix.
  - peer dep 충돌: `@typescript-eslint/*` 8.48.1 (`typescript <6.0.0` 제약) → 8.59.2 (`<6.1.0`) 직접 devDep 추가로 fix.
  - tsconfig.json 변경: 없음 — 기존 `strict: true` / `moduleResolution: bundler` / `module: esnext` 가 ts6 기본값과 일치.
  - 신 옵션 (`verbatimModuleSyntax` / `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes`): 변경 폭 큼 → plan009 후속 검토로 분리.
  - 향후 ts7+ 이전 시 본 ADR 참조점.
- **적용 범위**: `package.json`, `tsconfig.json`, src/ 전체 (해당 파일만 fix).


