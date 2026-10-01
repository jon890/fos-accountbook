# ADR-F39: 화면 전환 대기 표시는 공용 라우터 훅과 상단 진행 막대가 맡는다 (2026-10-01)

- **status**: `accepted`
- **결정**: 클라이언트 코드는 `next/navigation` 의 `useRouter` 를 직접 쓰지 않고 공용 훅 `useAppRouter` 를 쓴다.
  이 훅은 `push`, `replace`, `refresh` 를 React transition 으로 감싸고, 전환이 끝날 때까지 전역 대기 상태를 켠다.
  전역 대기 상태가 150ms 넘게 켜져 있으면 화면 맨 위에 진행 막대를 띄운다.
  같은 화면에서 주소 값만 바꾸는 전환(내역 탭, 필터, 쪽 넘김, 달력 월 이동)은 바뀔 영역에 `aria-busy` 와 흐림을 함께 준다.
  서버 액션 뒤에 이동하는 버튼은 액션부터 이동이 끝날 때까지 비활성과 진행 표시를 유지한다.
  `useRouter` 직접 사용은 ESLint `no-restricted-imports` 로 막고, 훅을 정의한 파일만 허용한다.
- **맥락**: 버튼을 누르고 몇 초 뒤에 화면이 바뀌는데 그동안 아무 표시가 없다는 사용자 지적이 있었다(2026-10-01).
  운영에서 측정하니 다른 화면으로 가는 링크는 0.03~0.06초 만에 `loading.tsx` 스켈레톤이 떴다.
  같은 화면에서 주소 값만 바꾸는 전환은 약 0.35초 동안 이전 화면에 멈춰 있었다. App Router 는 이 전환을 transition 으로 처리해 `loading.tsx` 를 다시 보이지 않는다.
  서버 액션 뒤 `router.push`, `router.refresh` 하는 가족 선택, 가족 전환, 가족 만들기, 초대 수락은 액션, 세션 갱신, 화면 렌더가 이어지는 동안 표시가 없었다.
- **대안 기각**:
  - 서드파티 진행 막대(nprogress 계열): 링크 클릭과 history 를 가로채는 방식이라 `router.push` 의 transition 종료 시점을 알지 못한다.
  - 화면마다 `useTransition` 을 따로 쓰기: 20개 파일이 각자 대기 상태를 만들고, 새 화면에서 빠뜨려도 막을 수 없다.
  - Suspense 경계에 주소 값을 key 로 주기: 매번 스켈레톤으로 바뀌어 탭을 누를 때마다 화면이 깜빡이고, 이전 내용을 보며 기다릴 수 없다.
- **결과**:
  - 얻는 것: 주소를 바꾸는 모든 클라이언트 전환에 같은 표시가 붙는다. 새 코드가 `useRouter` 를 쓰면 lint 가 실패한다.
  - 감당할 것: `Link` 이동은 이 훅을 거치지 않는다. 링크는 `loading.tsx` 가 바로 뜨므로 따로 표시하지 않는다.
- **적용 범위**: `src/lib/client/navigation.tsx`, `src/components/layout/NavigationProgressBar.tsx`, `src/app/providers.tsx`, `eslint.config.mjs`, `useRouter` 를 쓰던 클라이언트 컴포넌트.
