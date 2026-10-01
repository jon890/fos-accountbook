# ADR-F17: URL searchParams ↔ Client state 동기화는 draft 패턴
- **결정**: URL searchParams 를 입력 폼 (input/select) 의 초기값으로 쓰면서 외부 URL 변경 (브라우저 뒤로/앞으로, 다른 컴포넌트의 router.replace) 에도 추종해야 할 때, **useEffect 안 setState 가 아닌 derived value 패턴** 을 사용한다.

  ```tsx
  // ✅ draft 패턴
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? searchParams.get("q") ?? "";
  // 사용자 입력: setDraft(newValue)
  // URL apply 후: setDraft(null) — URL 단일 소스 복귀
  ```

- **맥락**: React 19 의 `react-hooks/cascading-render` 규칙이 `useEffect` 안 `setState` 직접 호출을 차단. URL 변경을 감지해서 input state 를 다시 set 하는 직관적 코드가 lint 오류 + 잠재적 cascading render 위험. 사용자 입력 (draft) 과 URL (current) 의 두 진실원을 단일 derived value 로 합쳐 effect 제거.

- **대안 기각**:
  - `useEffect(() => setState(currentValue), [currentValue])`: eslint rule 위반 + cascading render 위험.
  - URL 만 진실원 + 모든 입력 즉시 router.replace: 사용자 타이핑마다 navigation 발생 → 성능/UX 저하.
  - `key={searchParams}` 로 force-remount: 컴포넌트 내부 다른 state (Popover open 등) 도 reset 되는 부수효과.

- **적용 범위**: URL searchParams 기반 client 필터 컴포넌트 전반. 첫 적용 사례 — `AmountRangeFilter.tsx` (plan003). props 기반 추종에도 변형 적용 가능 (`AddExpenseDialog.tsx` 의 `activeTypeDraft ?? defaultType`, plan005).

- **예외 — 외부 부수효과 진입 신호 (fetch trigger, subscription 등)**: `useEffect` 안 `setState(true)` 가 명백히 필요한 경우 (예: dialog open 시 fetch 시작 → `setIsLoadingCategories(true)` → fetch 결과로 `false`. derived value 로 대체 불가 — fetch 실패 시 영원히 loading) 는 해당 라인에 `// eslint-disable-next-line react-hooks/set-state-in-effect` + 1줄 사유 주석으로 허용. 신규 코드 작성 시 우선 derived 시도 → 막힐 경우만 적용. 첫 적용 사례 — `AddExpenseDialog.tsx:67` (plan005).

---


