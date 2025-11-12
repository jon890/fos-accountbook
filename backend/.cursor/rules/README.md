# Cursor Rules

이 디렉토리는 Cursor AI가 자동으로 참조하는 프로젝트 개발 규칙을 포함합니다.

## 📂 파일 구조

| 파일 | 설명 | 주요 내용 |
|------|------|-----------|
| `config.mdc` | Spring Config 관리 규칙 | ConfigurationProperties, application.yml 관리 |
| `conventions.mdc` | 코딩 컨벤션 | Entity, DTO, Service, Controller 규칙 |
| `testing.mdc` | 테스트 전략 | @SpringBootTest, DatabaseCleanupExtension |
| `database.mdc` | 데이터베이스 규칙 | Flyway 마이그레이션, snake_case 규칙 |

## 🎯 작동 방식

### 자동 적용
- 모든 파일에 `alwaysApply: true` 플래그 설정
- Cursor AI가 대화 시 자동으로 규칙 참조
- 파일 생성, 코드 리뷰, 리팩토링 제안 시 적용

### 키워드 감지
각 파일은 관련 태그를 포함하여 자동 감지:
- `config.mdc`: config, properties, spring, configuration
- `conventions.mdc`: entity, dto, service, controller
- `testing.mdc`: testing, test, junit
- `database.mdc`: database, flyway, migration

### 예시

```
User: "CORS 설정 Properties 클래스 만들어줘"
Cursor: [config.mdc 참조]
        → 불변 객체 패턴
        → application.yml 기반
        → primitive 타입 사용
```

## 📝 규칙 업데이트

새로운 컨벤션이나 규칙이 추가되면:
1. 해당 주제의 `.mdc` 파일 수정
2. 커밋 및 푸시
3. 팀 전체에 자동 적용

## 🔍 주제별 분리 이유

1. **관심사 분리**: 각 파일이 명확한 책임
2. **유지보수성**: 특정 주제만 업데이트 가능
3. **가독성**: 파일이 작아서 읽기 쉬움
4. **확장성**: 새로운 주제 추가 용이

## 💡 추가 가능한 파일

필요시 다음 파일들을 추가할 수 있습니다:
- `architecture.mdc` - 패키지 구조, 계층 설계
- `security.mdc` - JWT, 인증/인가 규칙
- `performance.mdc` - 성능 최적화 규칙
- `logging.mdc` - 로깅 전략

## 📖 참고

- [Cursor Rules 공식 문서](https://docs.cursor.com)
- 프론트엔드 Rules: `/Users/nhn/personal/fos-accountbook/.cursor/rules/`

