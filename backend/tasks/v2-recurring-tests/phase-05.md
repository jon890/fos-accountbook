# Phase 5: 전체 빌드 검증

## 목적

모든 변경 사항이 기존 테스트와 호환되는지 최종 확인한다.

## 작업

### 5.1 전체 테스트 실행

```bash
./gradlew clean test
```

### 5.2 검증 체크리스트

- [ ] 전체 테스트 통과 (기존 + 신규)
- [ ] RecurringExpenseControllerTest: 기존 6개 + 추가 6개 이상
- [ ] RecurringExpenseSchedulerTest: 5개 시나리오
- [ ] OpenApiSnapshotTest: 스냅샷 추출 성공
- [ ] 컴파일 경고 없음

### 5.3 변경 파일 리뷰

- `RecurringExpenseScheduler.java`: Clock 주입만 변경, 비즈니스 로직 변경 없음
- 신규 Config 클래스: Clock Bean 등록
- 신규 테스트 파일 3개

### 5.4 실패 시

- 특정 테스트만 실패하면 해당 테스트 수정
- 컴파일 에러면 Phase 1 (Clock 주입) 재확인
- 전체 실패면 H2 스키마 호환성 확인 (Flyway V13/V14)

## 완료 조건

- [ ] `./gradlew clean test` 전체 통과
- [ ] 빌드 아티팩트에 `openapi-snapshot.json` 존재
