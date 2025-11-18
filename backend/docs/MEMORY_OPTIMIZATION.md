# 메모리 최적화 가이드

이 문서는 백엔드 애플리케이션의 메모리 사용량을 줄이기 위한 최적화 설정을 설명합니다.

## 📊 최적화 항목

### 1. JVM 메모리 설정 (Dockerfile)

**변경 사항:**

- `MaxRAMPercentage`: **75%** 유지 (컨테이너 OOM 방지를 위한 적절한 여유 공간)
- GC 일시정지 시간 목표 설정 (`-XX:MaxGCPauseMillis=200`)
- 문자열 중복 제거 활성화 (`-XX:+UseStringDeduplication`)
- 문자열 중복 제거 통계 출력 (`-XX:+PrintStringDeduplicationStatistics`) - 모니터링용
- 참고:
  - Java 21의 기본 GC는 이미 G1GC이므로 명시적으로 지정 불필요
  - `UseContainerSupport`는 Java 10+부터 기본 활성화되어 명시 불필요 (Java 21에서 제거됨)

**설명:**

- Railway는 **실제 사용한 메모리만 과금**하므로, `MaxRAMPercentage`는 OOM 방지 목적
- 75% 설정으로 컨테이너 메모리(3GB)의 2.25GB 사용 가능, 25% 여유 공간 확보
- 실제 사용량이 적으면 그만큼만 과금되므로 비용 절감 효과
- `PrintStringDeduplicationStatistics`: GC 로그에 문자열 중복 제거 통계 출력하여 효과 모니터링 가능

**예상 효과:**

- OOM 방지를 위한 적절한 메모리 제한
- GC 일시정지 시간 최적화로 응답성 향상
- 문자열 중복 제거로 메모리 절약 (통계로 확인 가능)

### 2. HikariCP 커넥션 풀 최적화

**변경 사항:**

- `maximum-pool-size`: 10 → **5**로 감소
- `minimum-idle`: 2 → **1**로 감소
- `leak-detection-threshold`: 60000ms 추가

**예상 효과:**

- 각 커넥션이 약 1-2MB의 메모리를 사용하므로, 커넥션 수 감소로 메모리 절약
- Virtual Threads를 사용하므로 적은 수의 커넥션으로도 충분한 처리량 확보 가능

### 3. Spring Boot 지연 초기화

**변경 사항:**

- `spring.main.lazy-initialization: true` 활성화

**예상 효과:**

- 애플리케이션 시작 시 모든 빈을 생성하지 않고 필요할 때만 생성
- 시작 시 메모리 사용량 감소
- 첫 요청 응답 시간이 약간 증가할 수 있음 (일반적으로 미미함)

### 4. JPA/Hibernate 최적화

**변경 사항:**

- `hibernate.jdbc.batch_size`: 20
- `hibernate.order_inserts`: true
- `hibernate.order_updates`: true
- `hibernate.jdbc.batch_versioned_data`: true

**예상 효과:**

- 배치 처리로 메모리 효율성 향상
- INSERT/UPDATE 순서 최적화로 성능 향상

### 5. 프로덕션 기능 비활성화

**변경 사항:**

- P6Spy SQL 로깅 비활성화 (`enable-logging: false`)
- ANSI 색상 출력 비활성화 (`ansi.enabled: never`)
- Actuator 메트릭 수집 비활성화 (`prometheus.enabled: false`)

**예상 효과:**

- 불필요한 로깅 및 모니터링 오버헤드 제거
- 메모리 사용량 감소

### 6. 캐시 크기 조정

**변경 사항:**

- Caffeine 캐시 최대 크기: 1000 → **500**으로 감소

**예상 효과:**

- 캐시 메모리 사용량 감소
- 일반적인 사용량에서는 500개로도 충분

## 📈 예상 메모리 절약 효과

| 항목          | 기존   | 최적화 후 | 절약량                        |
| ------------- | ------ | --------- | ----------------------------- |
| JVM 힙 메모리 | 75%    | 75%       | **변경 없음** (OOM 방지 목적) |
| 커넥션 풀     | 10개   | 5개       | **-50%**                      |
| 캐시 크기     | 1000개 | 500개     | **-50%**                      |

**전체 예상 효과:**

- **실제 메모리 사용량 감소**: 커넥션 풀 및 캐시 크기 감소로 런타임 메모리 사용량 약 20-30% 감소
- **비용 절감**: Railway는 실제 사용한 메모리만 과금하므로, 실제 사용량 감소가 직접적인 비용 절감으로 이어짐
- **OOM 방지**: `MaxRAMPercentage=75%`로 컨테이너 메모리 제한 내에서 안정적 운영

## ⚠️ 주의사항

### 1. 커넥션 풀 크기

- Virtual Threads를 사용하므로 적은 수의 커넥션으로도 충분한 처리량 확보 가능
- 트래픽이 증가하면 `maximum-pool-size`를 5 → 8 정도로 조정 고려

### 2. 지연 초기화

- 첫 요청 응답 시간이 약간 증가할 수 있음
- 문제가 발생하면 `lazy-initialization: false`로 되돌리기 가능

### 3. 캐시 크기

- 사용자 수가 많아지면 캐시 크기를 500 → 1000으로 다시 증가 고려
- 캐시 히트율을 모니터링하여 적절한 크기 결정

## 🔍 모니터링

### Railway 대시보드에서 확인

1. **메모리 사용량 확인**

   - Railway 대시보드 → 앱 선택 → Metrics 탭
   - 메모리 사용량 추이 확인

2. **로그 확인**
   - Railway 대시보드 → Logs 탭
   - GC 로그 및 메모리 관련 에러 확인

### JVM 메모리 정보 확인

애플리케이션 로그에서 다음 정보 확인:

- 힙 메모리 사용량
- GC 발생 빈도
- OutOfMemoryError 발생 여부
- **문자열 중복 제거 통계** (`PrintStringDeduplicationStatistics` 활성화 시)

**문자열 중복 제거 통계 예시:**

```
[GC concurrent-string-deduplication, 1234.5 ms]
   [Last Exec: 1234.5 ms, Idle: 0.0 ms, Blocked: 0.0 ms]
      [Inspected:          1234567]
         [Skipped:              0(  0.0%)]
         [Hashed:          1234567(100.0%)]
         [Known:                0(  0.0%)]
         [New:             1234567(100.0%)]
      [Deduplicated:        123456( 10.0%)]
         [Young:            12345( 10.0%)]
         [Old:             111111( 90.0%)]
      [GC Workers: 8]
         [Processed:       1234567]
         [Deduplicated:     123456( 10.0%)]
         [Skipped:              0(  0.0%)]
```

**통계 해석:**

- `Inspected`: 중복 제거를 위해 검사한 문자열 수
- `Deduplicated`: 실제로 중복 제거된 문자열 수 (비율이 높을수록 효과적)
- `Young/Old`: Young/Old 세대에서 중복 제거된 문자열 수

## 📝 추가 최적화 옵션

### 추가 JVM 옵션 (필요 시)

```dockerfile
# 메모리 제한 조정 (필요 시)
-XX:MaxRAMPercentage=75.0  # 기본값 (OOM 방지 목적)
# Railway는 실제 사용한 메모리만 과금하므로, 더 낮게 설정해도 비용 절감 효과 없음
# 다만 OOM 방지를 위해 최소 70% 이상 유지 권장

-XX:+UseStringDeduplication  # 이미 적용됨
-XX:+PrintStringDeduplicationStatistics  # 이미 적용됨 (통계 출력)
-XX:+OptimizeStringConcat  # 문자열 연결 최적화

# GC 선택 (참고: Java 21 기본값은 G1GC)
# -XX:+UseG1GC  # 기본값이므로 명시 불필요
# -XX:+UseZGC  # ZGC 사용 (대용량 메모리, 매우 짧은 일시정지, Java 21에서 프로덕션 준비)
# -XX:+UseSerialGC  # Serial GC (메모리 사용량 최소, 일시정지 시간 길어서 프로덕션 부적합)
```

**GC 선택 가이드:**

- **G1GC (기본값)**: 균형잡힌 선택, 일시정지 시간과 메모리 사용량의 균형
- **ZGC**: 대용량 메모리(수 GB 이상)에서 매우 짧은 일시정지 시간 필요 시
- **Serial GC**: 메모리 사용량 최소화 필요하지만 일시정지 시간이 길어도 되는 경우 (프로덕션 부적합)

## 🚀 배포 후 확인

1. **애플리케이션 시작 확인**

   - 로그에서 정상 시작 확인
   - Health check 통과 확인

2. **메모리 사용량 확인**

   - Railway Metrics에서 메모리 사용량 확인
   - 기존 대비 감소 확인

3. **성능 확인**

   - API 응답 시간 확인
   - 에러 발생 여부 확인

4. **문제 발생 시 롤백**
   - 설정을 이전 값으로 되돌리기
   - 또는 Railway에서 이전 배포로 롤백
