# ADR-F18: react-day-picker → @daypicker/react 패키지 이전
- **결정**: `react-day-picker` v9 → v10 메이저 업그레이드 + 패키지명을 공식 권장 신 namespace 인 `@daypicker/react` 로 이전. v10 의 폐기 props/event handler 일괄 교체.
- **맥락**: PR #222 (Dependabot) 가 단순 dep bump 만 제안 — 폐기 API 제거된 v10 에서 코드 마이그레이션 누락 시 빌드/런타임 회귀. 또 v10 공식 권장이 신 namespace `@daypicker/react` 로 이동 (장기 수명 + non-Gregorian calendar 들도 `@daypicker/*` 스코프). frontend 사용처는 단 2 파일 (`src/components/ui/calendar.tsx` shadcn wrapper + `src/components/dashboard/CalendarView.tsx`) 로 작아 한 PR 에 dep+코드 통합 적합.
- **대안 기각**:
  - `react-day-picker` 패키지명 유지: v10 호환 OK 이지만 신 namespace 가 공식 표준. 후속 add-on 패키지 (`@daypicker/persian` 등) 와 일관성.
  - v9 stick: 보안/유지보수 리스크 누적. 메이저 upgrade 가 작아 미루지 않는 게 합리적.
- **트레이드오프**: import 경로 + `style.css` 경로 갱신 필요. `DayPicker` API 자체는 동일 export. peer dep 충돌 점검 필요 (구 이름 의존 다른 dep 가 있으면).
- **폐기 prop 교체 매핑**:
  - `fromMonth/toMonth` → `startMonth/endMonth`
  - `fromDate/toDate` → `hidden={{ before/after }}`
  - `initialFocus` → `autoFocus`
  - `onWeekNumberClick/onDayKey*/onDayPointer*/onDayTouch*` → 커스텀 `WeekNumber`/`DayButton` 컴포넌트
- **적용 범위**: `package.json`, `src/components/ui/calendar.tsx`, `src/components/dashboard/CalendarView.tsx`.

---


