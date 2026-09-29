# 저장소 전체 ADR

프론트엔드와 백엔드에 함께 걸친 결정을 둔다.
프론트엔드 결정은 `frontend/docs/adr.md` 의 `ADR-F`, 백엔드 결정은 `backend/docs/adr.md` 의 `ADR-B` 가 소유한다.

## ADR Index

- [ADR-M01](#adr-m01) — 프론트엔드와 백엔드를 한 저장소로 합친다

---

<a id="adr-m01"></a>

## ADR-M01: 프론트엔드와 백엔드를 한 저장소로 합친다 (2026-09-29)

- **status**: `accepted`
- **결정**: `jon890/fos-accountbook-frontend` 를 `fos-accountbook` 으로 이름을 바꿔 남기고, 그 아래 `frontend/` 와 `backend/` 를 둔다.
    - 백엔드 이력은 `git filter-repo --to-subdirectory-filter backend` 로 옮겨 merge commit 으로 합친다.
    - `jon890/fos-accountbook-backend` 는 아카이브만 하고 지우지 않는다.
- **맥락**: 두 저장소는 하네스와 CI 를 한 벌씩 따로 가졌다.
    - 2026-07 ~ 09 의 사람 PR 16건 중 12건이 같은 하네스와 CI 변경을 두 저장소에 한 번씩 낸 6쌍이었다.
    - API 를 함께 바꾼 3건은 두 PR 로 나뉘어, 한 번은 머지가 약 69시간 벌어졌다.
    - 가계부 기능 개발을 다시 시작하고, fos-assistant 가 가계부 API 를 부를 예정이라 API 변경이 늘어난다.
- **대안 기각**:
    - 두 저장소 유지와 공용 재사용 워크플로: 리뷰 워크플로 중복만 줄고 오버레이와 하네스 중복 4쌍은 남는다.
    - fos-assistant 모노레포 안으로 합침: 배포와 장애 범위, 릴리스 주기가 묶이고, 가계부가 에이전트 없이 도는 것을 보장하기 어렵다.
    - `git subtree` 로 이력 합침: 병합 이전 커밋이 루트 경로에 남아 `git log -- backend/<파일>` 이 병합 커밋에서 끊긴다.
- **결과**:
    - 얻는 것: 하네스와 CI 변경이 PR 하나로 끝난다. API 를 바꾸는 프론트와 백엔드 변경을 한 PR 에서 검토한다.
    - 감당할 것: 워크플로마다 경로 필터를 유지해야 한다. 백엔드 커밋 SHA 가 바뀌어 옛 백엔드 PR 의 커밋 링크는 아카이브한 저장소에서만 열린다.
- **적용 범위**:

  | 대상 | 결정 |
  | --- | --- |
  | 문서 | 저장소 전체 결정은 루트 `docs/adr.md` 의 `ADR-M`. 제품 문서는 `frontend/docs/`, `backend/docs/` |
  | 하네스 | 공통 규칙은 루트 `CLAUDE.md` 와 `.claude/`. 하위 프로젝트 규칙과 오버레이는 `frontend/`, `backend/` 아래 |
  | 스킬 | 둘이 함께 쓰는 스킬은 루트 `.claude/skills/`, 한쪽 전용 스킬은 그 하위 프로젝트의 `.claude/skills/` |
  | plan 번호 | 접두사마다 001 부터 센다. 저장소 전체 `mono-`, 프론트 `fe-`, 백엔드 `be-` |
  | CI | `frontend-ci` 는 `frontend/**`, `backend-ci` 는 `backend/**` 가 바뀔 때만 돈다. 루트 문서와 하네스만 바뀐 PR 에서는 둘 다 돌지 않는다 |
  | 이미지 | `frontend-image`, `backend-image` 워크플로가 기존 이름 `ghcr.io/jon890/fos-accountbook-frontend`, `ghcr.io/jon890/fos-accountbook-backend` 로 push 한다. 홈 서버 compose 는 바꾸지 않는다 |
  | 운영 배포 | 홈 서버의 GHCR 이미지만 운영이다. Vercel 은 Git 연결을 끊는다 |
  | 코드 리뷰 | 리뷰 워크플로는 하나다. 바뀐 경로로 프론트와 백엔드 점검 목록을 고르고, 둘 다 바뀐 PR 은 두 목록을 합친 리뷰 하나를 받는다. 정책은 [ADR-F11](../frontend/docs/adr.md#adr-f11) 이 소유한다 |
  | 협의 | 저장소 사이 GitHub Issue 협의 규칙과 API 계약 통합 스킬은 지운다. API 변경은 PR 하나에서 검토한다 |
