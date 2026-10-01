# ADR-B06: Caffeine 로컬 캐시

**결정**: Redis 없이 Caffeine 인메모리 캐시

**이유**:

- 단일 서버 환경 → 분산 캐시 불필요
- Category 목록은 가족 단위, 변경 빈도 낮음 → TTL 10분으로 충분
- Redis 운영 비용 없음

**적용 대상**: CategoryService (`familyUuid → List<Category>`)
**캐시 무효화**: 카테고리 생성·수정·삭제 시 evict

---

