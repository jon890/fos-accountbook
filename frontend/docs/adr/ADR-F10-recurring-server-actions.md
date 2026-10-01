# ADR-F10: 반복 지출 상태 관리 — Server Action 방식 유지

**결정**: 폴링·WebSocket 도입 없이 기존 Server Action + revalidatePath 방식 유지

**이유**:

- 스케줄러 실행이 새벽 1시 → 사용자가 앱 사용 중 실시간 업데이트 필요 없음
- 페이지 재방문 시 Server Component가 최신 데이터를 fetch → 충분한 일관성
- 폴링 추가 시 복잡도 증가 대비 사용자 경험 개선 미미

**결과**: 자동 생성된 지출은 다음 날 대시보드 방문 시 반영됨. 실시간 알림은 기존 NotificationBell로 대체

---


