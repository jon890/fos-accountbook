# Phase 01: CSV 생성 서비스 + 다운로드 endpoint + 테스트

## 목표

`GET /families/{familyUuid}/expenses/export?year=2026&month=5` endpoint를 추가한다.
해당 월의 지출내역을 CSV 파일로 다운로드한다.

## 배경

- 사용자가 데이터를 추출하여 LLM 분석 또는 스프레드시트에서 활용
- `ExpenseRepository.findByFamilyUuidAndDateBetween()` 이미 존재
- 카테고리 이름은 Category 조회로 해결
- 외부 CSV 라이브러리 불필요 — StringBuilder로 충분한 규모

## 작업 항목

1. **ExpenseService에 CSV 생성 메서드 추가**
   - 파일: `src/main/java/com/bifos/accountbook/expense/application/service/ExpenseService.java`
   - `byte[] exportMonthlyExpenseCsv(CustomUuid userUuid, CustomUuid familyUuid, int year, int month)`
   - `findByFamilyUuidAndDateBetween()`으로 해당 월 지출 조회
   - 카테고리 UUID → 이름 매핑 (CategoryRepository 또는 캐시 활용)
   - CSV 컬럼: `날짜,카테고리,금액,설명`
   - BOM (`﻿`) 포함 (Excel 한글 깨짐 방지)
   - description에 콤마/줄바꿈이 있으면 큰따옴표로 감싸기 (CSV 표준)
   - `@ValidateFamilyAccess` 적용
   - 날짜 내림차순 정렬

2. **ExpenseController에 다운로드 endpoint 추가**
   - 파일: `src/main/java/com/bifos/accountbook/expense/presentation/controller/ExpenseController.java`
   - `@GetMapping("/export")`
   - `@RequestParam Integer year, @RequestParam Integer month`
   - 응답: `ResponseEntity<byte[]>`
     - `Content-Type: text/csv; charset=UTF-8`
     - `Content-Disposition: attachment; filename="expenses_2026-05.csv"`

3. **Controller 통합 테스트 추가**
   - AbstractControllerTest 상속
   - fixtures로 해당 월 지출 데이터 2~3건 생성
   - CSV 응답 검증: Content-Type, BOM 존재, 컬럼 헤더, 데이터 행 수
   - 빈 데이터: 헤더만 있는 CSV 반환

4. **전체 테스트 실행**
   - `./gradlew test --no-daemon --console=plain`

## 검증 기준

- CSV 파일에 BOM + 헤더 + 데이터 행 포함
- Content-Type이 text/csv
- description에 콤마가 있어도 파싱 깨지지 않음
- 권한 없는 사용자 접근 시 403
- 전체 테스트 통과
