# Phase 04. 설정 화면의 테마 선택

**Execution profile**: standard
**Domain**: app-router

## 목표

설정 화면에서 시스템, 라이트, 다크 중 하나를 고르면 바로 적용되고, 새로고침해도 그 기기에서 유지된다.

**범위 외**: 계정에 테마를 저장하지 않는다(ADR-F38). 메뉴 화면이나 헤더에 빠른 전환 버튼을 두지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F38-dark-mode-tokens-and-theme-choice.md`, `frontend/docs/adr/ADR-F15-data-theme-attribute.md`, `frontend/docs/flow.md` 의 「15. /settings 페이지 구조」.

코드에서 확인한 사실:

- `frontend/src/app/providers.tsx` 가 `next-themes` 의 `ThemeProvider` 를 `attribute="data-theme" defaultTheme="system" enableSystem` 으로 둔다. `next-themes` 는 고른 값을 `localStorage` 의 `theme` 키에 저장한다.
- `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` 는 `SettingsCard` 들을 `grid gap-4 md:grid-cols-2` 에 놓는다. 순서는 기본 가족 설정(`md:col-span-2`), 가족별 예산, 내 가족 목록, 외부 연동(`md:col-span-2`)이다.
- `frontend/src/components/layout/SettingsCard.tsx` 가 아이콘, 제목, 부제, 본문을 받는다.
- 라디오는 `frontend/src/components/ui/radio-group.tsx` 의 `RadioGroup`, `RadioGroupItem` 이고, 기본 가족 카드가 같은 패턴(행 전체 `Label`, 선택 행 `bg-brand-50`)을 쓴다.
- 설정 화면 단위 테스트는 `frontend/src/__tests__/components/settings/SettingsPageClient.test.tsx` 다.

## 의도 메모

- 카드 이름은 「화면 테마」, 부제는 「이 기기에서만 적용돼요」, 아이콘은 lucide `SunMoon` 이다. 위치는 내 가족 목록 다음, 외부 연동 앞이다.
- 선택지 라벨은 「시스템 설정 따르기」, 「라이트」, 「다크」 다. 값은 `next-themes` 의 `system`, `light`, `dark` 를 그대로 쓴다.
- `useTheme()` 의 `theme` 은 서버 렌더에서 `undefined` 다. 마운트 전에는 선택 없이 그려 hydration 경고를 내지 않는다.

## 작업 항목

### 1. `frontend/src/components/settings/ThemeSettingsCard.tsx`(신규)

`useTheme()` 의 `theme`, `setTheme` 으로 세 선택지를 그린다.

### 2. `SettingsPageClient.tsx` 에 카드 배치

### 3. 단위 테스트 `frontend/src/__tests__/components/settings/ThemeSettingsCard.test.tsx`(신규)

`next-themes` 를 모킹해 현재 값이 선택돼 보이는지, 「다크」 를 누르면 `setTheme("dark")` 가 불리는지 확인한다. `SettingsPageClient.test.tsx` 가 `useTheme` 없이 깨지면 같은 모킹을 더한다.

### 4. 브라우저 테스트 `frontend/browser/theme-setting.spec.ts`(신규)

- `colorScheme: "light"` 에서 `/settings` 의 「다크」 를 고르면 `html` 의 `data-theme` 이 `dark` 가 되고, 새로고침 뒤에도 `dark` 다.
- 「시스템 설정 따르기」 로 되돌리면 `light` 가 된다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/components/settings/ThemeSettingsCard.test.tsx src/__tests__/components/settings/SettingsPageClient.test.tsx
pnpm test:browser
pnpm test:browser browser/theme-setting.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/settings/ThemeSettingsCard.tsx` | 신규 |
| `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | 수정 |
| `frontend/src/__tests__/components/settings/ThemeSettingsCard.test.tsx` | 신규 |
| `frontend/src/__tests__/components/settings/SettingsPageClient.test.tsx` | 수정 |
| `frontend/browser/theme-setting.spec.ts` | 신규 |
