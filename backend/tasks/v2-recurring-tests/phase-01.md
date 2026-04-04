# Phase 1: Clock 주입 리팩토링

## 목적

`RecurringExpenseScheduler`가 `LocalDate.now()`를 직접 호출하여 테스트에서 날짜 제어가 불가능함.
`Clock` Bean을 주입하여 테스트 가능성과 멱등성 검증을 확보한다.

## 작업

### 1.1 Clock Bean 등록

- `config/` 또는 기존 설정 클래스에 `Clock` Bean 추가
- `Clock.systemDefaultZone()` 반환하는 `@Bean` 하나면 충분

```java
@Bean
public Clock clock() {
    return Clock.systemDefaultZone();
}
```

### 1.2 RecurringExpenseScheduler에 Clock 주입

- 생성자에 `Clock` 파라미터 추가
- `LocalDate.now()` → `LocalDate.now(clock)` 변경
- `generateRecurringExpenses()` 메서드 내 `today` 변수가 clock 기반으로 동작

### 1.3 컴파일 검증

- `./gradlew compileJava compileTestJava` 성공 확인

## 완료 조건

- [ ] `Clock` Bean이 등록됨
- [ ] `RecurringExpenseScheduler`가 `Clock`을 주입받아 사용
- [ ] `LocalDate.now()` 직접 호출이 스케줄러에서 제거됨
- [ ] 컴파일 성공
