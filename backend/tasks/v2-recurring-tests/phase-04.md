# Phase 4: OpenAPI 스냅샷 추출 테스트

## 목적

CI에서 OpenAPI 스냅샷을 자동 추출할 수 있는 테스트를 만든다.
프론트엔드가 이 스냅샷으로 API 계약 drift를 감지한다.

## 작업

### 4.1 스냅샷 추출 테스트 작성

- 파일: `src/test/java/com/bifos/accountbook/contract/OpenApiSnapshotTest.java`
- `@SpringBootTest` + `@AutoConfigureMockMvc`
- `GET /v3/api-docs` → JSON 응답 → `build/openapi-snapshot.json` 파일 저장

```java
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiSnapshotTest {

    @Autowired MockMvc mockMvc;

    @Test
    void extractOpenApiSnapshot() throws Exception {
        String json = mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andReturn().getResponse().getContentAsString();

        Path output = Path.of("build", "openapi-snapshot.json");
        Files.createDirectories(output.getParent());
        Files.writeString(output, json,
            StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
    }
}
```

### 4.2 스냅샷 검증

- 생성된 `build/openapi-snapshot.json`에 `/api/v1/families/{familyUuid}/recurring-expenses` 관련 경로가 포함되어 있는지 확인
- JSON 파싱 가능한지 (유효한 OpenAPI 3.0 형식인지) 간단히 검증

### 4.3 .gitignore 확인

- `build/openapi-snapshot.json`이 git에 커밋되지 않도록 `.gitignore` 확인
- 이 파일은 CI artifact로만 공유

## 완료 조건

- [ ] `OpenApiSnapshotTest` 통과
- [ ] `build/openapi-snapshot.json` 파일 생성 확인
- [ ] JSON에 recurring-expenses 경로 포함
- [ ] `./gradlew test` 전체 통과
