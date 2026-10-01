# ADR-B12: 반복 지출 스케줄러 — Spring @Scheduled

**결정**: Quartz 미사용, Spring `@Scheduled(cron = "0 0 1 * * ?")` 사용

**이유**:

- 단일 서버 환경 → 분산 스케줄링 불필요
- Quartz: 별도 DB 테이블(11개), 복잡한 설정 → 오버엔지니어링
- 실패 허용 정책 (서버 다운 시 해당일 누락 허용, 복구 로직 없음) → 고가용성 보장 불필요
- 멱등성: `(recurring_expense_uuid, year_month)` DB UNIQUE constraint → 재실행 시 중복 생성 방지, `log.warn` 후 skip

**트레이드오프**: 서버 재시작이 1시~처리 완료 사이에 발생하면 해당일 누락. MVP에서 허용.

---

