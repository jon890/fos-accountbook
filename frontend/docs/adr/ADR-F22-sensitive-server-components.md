# ADR-F22: 민감 정보를 다루는 컴포넌트는 Server Component 로 유지 + Client 핸들러는 children 슬롯
- **결정**: `error.tsx` / `not-found.tsx` 같은 에러 경계 카드 (`StatusCard`) 는 **Server Component 로 고정**. 클라이언트 핸들러 (`reset()` 등) 가 필요한 영역은 별도 `"use client"` 래퍼 (`ErrorResetButton`) 를 만들어 Server Component 의 `children` 슬롯에 주입. `process.env.NODE_ENV` 분기를 포함한 dev-only 메시지 (`error.message`, stack trace, digest 등) 도 Server Component 본문에서 평가하여 production 트리에서 dev JSX 자체가 제외되도록 한다.
- **맥락**: Next.js App Router 에서 `error.tsx` 는 `"use client"` 필수 (Error boundary 규약). 직관적으로는 `error.tsx` 안의 모든 컴포넌트가 Client 가 되지만, Server Component 를 `children` 으로 받으면 그 본체는 서버에서 렌더된다. 이를 활용하면 (a) `error.message` 같은 민감 정보의 `process.env.NODE_ENV` 분기를 서버측에서 평가해 production 클라이언트 번들에 dev 텍스트 누출 차단, (b) `onClick` 같은 직렬화 불가 prop 을 Server Component 인터페이스에서 제거. PR #248 코드 리뷰에서 두 사고 가능성이 동시 지적됨.
- **대안 기각**:
  - 전체 `"use client"` (StatusCard 도 Client): `process.env.NODE_ENV` 가 클라이언트에서 평가되어도 Next.js 번들러가 dead code elimination 으로 dev 분기를 제거하지만, `error.message` 문자열 자체가 클로저에 캡처되어 production 번들에 포함될 위험 잔존. devtools 에서 함수 본문 확인 가능. 또한 Server Component 의 정적 렌더 + 데이터 페칭 이점도 포기.
  - `process.env.NODE_ENV` 분기를 `error.tsx` 측에서 수행 + StatusCard 는 단순 receiver: `devMessage` prop 자체를 `undefined` 로 전달해도 dev JSX 가 `error.tsx` 의 client 번들에 남음. 책임 분산이 안 됨.
- **트레이드오프**: Server Component + Client 래퍼 분리는 파일 수 증가 (`ErrorResetButton.tsx` 같은 1-호출 래퍼). 단 보안 + 직렬화 안전성 이득이 크고, 패턴이 일관되면 후속 영역 (예: Sentry wiring) 에서 동일 구조 재사용 가능.
- **적용 범위**: `src/components/error/StatusCard.tsx` (Server) + `src/components/error/ErrorResetButton.tsx` (Client) + `src/app/{,(authenticated)/}error.tsx` + `src/app/global-error.tsx`. 향후 server-side dev 분기를 포함하는 모든 컴포넌트에 동일 원칙 적용 (예: Sentry digest 카드, debug overlay).

---


