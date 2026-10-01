# ADR-F27: Radix `DropdownMenuItem` 안에서 form submit 금지 — `onSelect` 직접 호출 (2026-06-02)

- **결정**: `DropdownMenuItem` 안에 Server Action 을 붙일 때는 `<form action={...}>` 대신, `onSelect` 에서 `event.preventDefault()` 로 자동 닫힘을 막고 Server Action 을 직접 호출한다.
- **맥락**: 로그아웃 버튼이 `DropdownMenuItem asChild` 안에 `<form action={signOutAction}>` + submit 버튼을 두는 구조였다.
  클릭하면 `DropdownMenuItem` 의 `onSelect` 가 메뉴를 닫으며 Portal 을 unmount 한다.
  그 과정에서 form 이 DOM 에서 제거되어 native submit 이 발생하기 전에 유실됐다.
  로그인 시점과 무관하게 로그아웃이 항상 동작하지 않았다.
- **대안 기각**:
  - form 을 `DropdownMenu` 바깥으로 분리: 메뉴 항목 레이아웃을 깨고, 메뉴 닫힘 타이밍과 submit 순서를 다시 맞춰야 해 복잡도만 늘어난다.
  - `onSelect` 유지 + setTimeout 으로 submit 지연: 타이밍 의존이라 취약하다.
- **적용 범위**: `src/components/layout/Header.tsx`. 향후 메뉴 항목에서 Server Action 호출 시 동일 패턴 적용.

---


