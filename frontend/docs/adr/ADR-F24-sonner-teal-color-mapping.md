# ADR-F24: sonner richColors OFF + Teal 토큰 직접 매핑 (2026-05-19)

- **결정**: `Toaster` 의 `richColors` 옵션을 끄고, toast 타입별 색을 OKLCH 토큰으로 직접 매핑한다. success=`--color-brand-500` (Teal h=188), error=`--color-expense`, warning=`--color-warning`, info=`--color-brand-400`. 컨테이너 톤은 `bg-bg-elev` / `border-border` / `text-fg`. `AlertDialog` 도 동일 원칙으로 overlay=`bg-fg/60`, content=`bg-bg-elev`, description=`text-fg-muted` 로 통일.
- **맥락**: sonner `richColors=true` 의 자동 success(green h≈140)/error(red)/warning(amber)/info(blue) 가 plan001 Teal 시스템 (brand h=188) 과 충돌. 특히 success green 이 income (h=152) 과도 가까워 시맨틱 혼동 가능. AlertDialog 의 `bg-white` / `bg-black/80` / `text-muted-foreground` 잔재는 shadcn v3 legacy 로 dark mode 미지원.
- **대안 기각**:
  - `richColors` 유지 + 컨테이너만 토큰화: success green 이 brand Teal 과 충돌 + income 시맨틱 혼동 잔존. 가장 적은 변경이지만 핵심 문제 미해결.
  - richColors OFF + 단색 (popover-only): success/error 시각 강도 차이 사라져 critical 액션 ↔ confirmation 구분 약화. 토스트 본연의 즉시 인지 가치 손실.
- **트레이드오프**: 토큰 직접 매핑은 sonner 업데이트 시 className target (`[data-sonner-toast][data-type=...]`) 시그니처 변경 영향 받음 — 단 sonner 가 안정적 API 이고 toast 사용처가 20+ 곳이라 일관성 이득이 큼.
- **적용 범위**: `src/components/ui/sonner.tsx` + `src/app/providers.tsx` + `src/components/ui/alert-dialog.tsx`. AlertDialog 파괴적 Action (Delete*Dialog 4 호출처) 은 호출처에서 `variant="destructive"` 명시 (`buttonVariants({ variant: "destructive" })` 가 이미 expense 토큰으로 매핑됨).

