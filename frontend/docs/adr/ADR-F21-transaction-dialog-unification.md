# ADR-F21: Add/Edit Transaction 다이얼로그 단일화

**대체된 부분**: 거래 종류 전환 시 날짜를 초기화하던 정책은 [ADR-F32](ADR-F32-calendar-home-monthly-list.md)의 날짜 유지 정책으로 대체한다.
**대체된 부분**: 내역 화면의 추가 진입 정리는 [ADR-F37](ADR-F37-single-transaction-row.md)로 대체한다.
**색상 갱신 (2026-10-01)**: 고정지출의 선택 토글과 저장 버튼은 `gradient-primary text-brand-fg`를 쓴다.
노란 강조 배경과 밝은 글자의 낮은 대비를 해결하고, 지출과 수입의 강조색을 구분한다.
나머지 단일 다이얼로그 결정은 유지한다.

- **결정**: 지출/수입/고정지출 3 도메인의 Add 다이얼로그를 단일 `AddTransactionDialog`와 3 segmented 토글로 통합한다. 지출은 `gradient-expense`, 수입은 `gradient-income`, 고정지출은 `gradient-primary`를 쓴다. Edit 도 동일 패턴 (`EditTransactionDialog`, type 잠금). 위치: `src/components/transactions/dialogs/`.
- **맥락**: 같은 "추가" 진입점이 6 곳 (Dashboard QuickActions / BottomNav FAB / Transactions 의 지출·수입·고정지출 탭 / Settings 고정지출) 인데 호출하는 다이얼로그가 셋 (AddExpenseDialog / AddIncomeDialog / AddRecurringExpenseSheet) 으로 분기. 시각·반응형 (Sheet 방향 right vs bottom)·field 구성·legacy 토큰 (`text-destructive`, `text-gray-500`, `text-muted-foreground`) 모두 불일치해 사용자 인지 부담과 유지보수 비용이 증가했다.
- **대안 기각**:
  - 도메인별 분리를 유지하고 시각·토큰만 통일: 진입점마다 다른 UI 가 그대로 노출. type 전환 (지출→수입) 시 다이얼로그 닫고 다른 진입점 찾아야 함 — 같은 의도 ("거래 추가") 가 분기됨.
  - "Add+ 페이지" 신설 (전용 라우트): 모달 흐름이 자연스러운 작업을 페이지로 격상 → 단순 추가가 무거워짐. recurring 처럼 가끔 쓰는 영역에서 매번 라우팅 비용.
- **트레이드오프**: 단일 컴포넌트가 3 type conditional 필드 분기 — form complexity ↑ but UX 일관성 ↑. type 전환 시 type-specific 필드 (date vs dayOfMonth+name) 가 mount/unmount 되며 입력 잔존 정책은 "이전 type 의 amount/category/description 은 유지, type-specific 필드만 초기화" 로 명시.
- **갱신 (2026-09-30)**: 진입점에 달력의 「이 날짜에 추가」 가 더해지고 대시보드 QuickActions 는 빠졌다. 진입점은 `defaultDate` 도 넘긴다. 수정 다이얼로그에 삭제 버튼을 둔다([ADR-F32](ADR-F32-calendar-home-monthly-list.md)).
- **적용 범위**: `src/components/transactions/dialogs/{Add,Edit}TransactionDialog.tsx`, `src/components/transactions/forms/TransactionFormFields.tsx`, 진입점 갱신, legacy 다이얼로그 6 파일 제거 (Add/EditExpenseDialog, Add/EditIncomeDialog, Add/EditRecurringExpenseSheet).
