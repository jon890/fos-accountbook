# ADR-B22: 코드 규칙은 도구 설정이 갖고 기존 위반은 기준 파일에 얼린다 (2026-10-01)

- **status**: `accepted`
- **결정**: 백엔드 코드 규칙을 문장이 아니라 도구 설정으로 둔다.
  포맷은 Spotless 와 google-java-format, 구조 규칙은 ArchUnit, 코드 모양 규칙은 Checkstyle 이 검사한다. 도구 버전은 정확한 값으로 고정한다.
  ArchUnit 의 지금 있는 위반은 `FreezingArchRule` 의 기준 파일에 얼려 새 위반만 실패시킨다. 기준은 허용 목록이 아니라 줄여 갈 목록이다.
  포맷은 저장소 전체를 한 번 포맷하고 그 커밋을 `.git-blame-ignore-revs` 에 넣는다. 이후 `spotlessCheck` 가 모든 파일을 검사한다.
  진입점은 `./gradlew qualityCheck` 하나이고 CI 가 이것을 돌린다.
- **맥락**: 층 방향, Controller 의 Repository 직접 사용 금지, `shared` 의 도메인 의존 금지, `@Transactional` 위치, `@Data` 금지 같은 규칙이 `backend/CLAUDE.md` 에 문장으로만 있었다.
  2026-10-01 점검에서 `shared` 가 `family` 에 의존하는 곳, 문서와 반대로 적힌 층 방향, 같은 클래스 안의 `@Transactional` 호출 때문에 반복 지출 알림이 만들어지지 않던 결함이 나왔다. 여러 에이전트가 나란히 코드를 쓰면서 포맷도 파일마다 달랐다.
  같은 사용자의 fos-assistant 가 이 방식을 먼저 적용했다(그 저장소 ADR-042).
- **대안 기각**:
  - palantir-java-format(fos-assistant 와 같은 도구): 4칸 들여쓰기라 지금 코드와 Checkstyle(google_checks) 의 2칸 기준과 다르다. 전체를 4칸으로 바꾸면 diff 가 더 커진다.
  - 바뀐 파일만 포맷(`ratchetFrom`): fos-assistant 는 진행 중인 브랜치가 많아 골랐다. 이 저장소는 백엔드 브랜치가 거의 없어 한 번에 포맷하는 비용이 작고, 포맷이 다른 파일이 오래 섞이지 않는다.
  - 기존 위반을 모두 고친 뒤 규칙을 켜기: 그동안 새 위반이 계속 들어온다.
- **결과**:
  - 얻는 것: 경계를 넘는 새 의존과 규칙 위반이 리뷰 전에 실패한다. 에이전트가 쓴 코드도 같은 모양이 된다. 규칙마다 이름이 있어 지침이 그 이름을 가리킨다.
  - 감당할 것: 위반을 고치면 기준 파일도 함께 줄인다. 기준을 줄일 때만 `-Parchunit.freeze.store.default.allowStoreUpdate=true`를 붙여 `archTest`를 실행한다. 새 위반을 이 옵션으로 기준 파일에 넣어서는 안 된다. 최초 기준 생성과 전체 기준 재생성은 수동 예외로 두며, 구체적인 Gradle 속성 조합은 `backend/CLAUDE.md`의 코드 스타일 규칙 표를 따른다. 같은 클래스 안의 `@Transactional` 호출은 도구로 잡지 못해 리뷰에서 본다. 포맷 커밋 뒤 `git blame` 은 `--ignore-revs-file` 을 써야 원래 작성자를 보여 준다.
- **적용 범위**: `backend/` 의 Java 소스와 테스트, `.github/workflows/backend-ci.yml`.
