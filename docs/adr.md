# 저장소 전체 ADR

프론트엔드와 백엔드에 함께 걸친 결정을 둔다.
프론트엔드 결정은 `frontend/docs/adr.md` 의 `ADR-F`, 백엔드 결정은 `backend/docs/adr.md` 의 `ADR-B` 가 소유한다.

## ADR Index

- [ADR-M01](#adr-m01) — 프론트엔드와 백엔드를 한 저장소로 합친다
- [ADR-M02](#adr-m02) — ADR 은 결정 하나당 파일 하나로 두고 INDEX 로 찾는다

---

<a id="adr-m01"></a>

## ADR-M01: 프론트엔드와 백엔드를 한 저장소로 합친다 (2026-09-29)

- **status**: `accepted`
- **결정**: `jon890/fos-accountbook-frontend` 를 `fos-accountbook` 으로 이름을 바꿔 남기고, 그 아래 `frontend/` 와 `backend/` 를 둔다.
    - 백엔드 이력은 `git filter-repo --to-subdirectory-filter backend` 로 옮겨 merge commit 으로 합친다.
    - 이 이관 PR 은 merge commit 으로만 머지한다. squash 나 rebase 로 머지하면 합친 백엔드 이력이 사라지거나 평탄해진다.
    - `jon890/fos-accountbook-backend` 는 이관을 확인한 뒤 지웠다(2026-09-30). 처음에는 아카이브만 하기로 했으나 저장소 하나만 관리하려고 바꿨다.
        - 지우기 전에 열린 이슈 4건을 이 저장소로 옮겼고, 머지하지 않은 CSV 내보내기 브랜치를 `feat/be-expense-csv-export` 로 옮겼다.
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
    - 감당할 것: 워크플로마다 경로 필터를 유지해야 한다. 옛 백엔드 PR 과 그 리뷰 기록은 저장소와 함께 사라졌다. 백엔드 커밋은 SHA 가 바뀐 채 이 저장소의 이력으로만 남는다.
- **적용 범위**:

  | 대상 | 결정 |
  | --- | --- |
  | 문서 | 저장소 전체 결정은 루트 `docs/adr.md` 의 `ADR-M`. 제품 문서는 `frontend/docs/`, `backend/docs/` |
  | 하네스 | 공통 규칙은 루트 `CLAUDE.md` 와 `.claude/`. 하위 프로젝트 규칙과 오버레이는 `frontend/`, `backend/` 아래 |
  | 스킬 | 둘이 함께 쓰는 스킬은 루트 `.claude/skills/`, 한쪽 전용 스킬은 그 하위 프로젝트의 `.claude/skills/` |
  | plan 번호 | 접두사마다 001 부터 센다. 저장소 전체 `mono-`, 프론트 `fe-`, 백엔드 `be-` |
  | CI | `frontend-ci` 는 `frontend/**`, `backend-ci` 는 백엔드 소스와 빌드 설정(`backend/src/**`, Gradle 파일, `backend/config/**`)이 바뀔 때만 돈다. 백엔드 CI 는 이관 전 경로 필터에 `backend/` 만 붙여 옮겼다. 루트 문서와 하네스만 바뀐 PR 에서는 둘 다 돌지 않는다 |
  | 이미지 | `frontend-image`, `backend-image` 워크플로가 기존 이름 `ghcr.io/jon890/fos-accountbook-frontend`, `ghcr.io/jon890/fos-accountbook-backend` 로 push 한다. 홈 서버 compose 는 바꾸지 않는다 |
  | 운영 배포 | 홈 서버의 GHCR 이미지만 운영이다. Vercel 은 Git 연결을 끊는다 |
  | 코드 리뷰 | 리뷰 워크플로는 하나다. 바뀐 경로로 프론트와 백엔드 점검 목록을 고르고, 둘 다 바뀐 PR 은 두 목록을 합친 리뷰 하나를 받는다. 정책은 [ADR-F11](../frontend/docs/adr.md#adr-f11) 이 소유한다 |
  | 협의 | 저장소 사이 GitHub Issue 협의 규칙과 API 계약 통합 스킬은 지운다. API 변경은 PR 하나에서 검토한다 |

<a id="adr-m02"></a>

## ADR-M02: ADR 은 결정 하나당 파일 하나로 두고 INDEX 로 찾는다 (2026-09-30)

- **status**: `accepted`
- **결정**: `frontend/docs/adr/`, `backend/docs/adr/`, `docs/adr/` 에 결정 하나당 파일 하나(`ADR-F16-<영문-슬러그>.md`)를 두고, 각 디렉터리의 `INDEX.md` 가 번호, 제목, 상태를 한 줄씩 나열한다.
  기존 번호(`ADR-F`, `ADR-B`, `ADR-M`)와 본문은 그대로 옮긴다. 단일 파일 `adr.md` 는 없앤다.
- **맥락**: 2026-09-30 기준 `frontend/docs/adr.md` 가 575줄(ADR 31건), `backend/docs/adr.md` 가 414줄(18건)이다.
  에이전트가 ADR 하나를 확인하려면 파일 전체를 읽어야 해 컨텍스트를 낭비한다. 같은 날 계획 세 개가 모두 같은 파일 끝과 목차에 ADR 을 더해 머지 충돌이 났다.
  개인 저장소 fos-home-infra, fos-agents 는 이미 INDEX 와 개별 파일 구성을 쓴다. 공용 planning 스킬의 기본 배치도 개별 파일이다.
- **대안 기각**:
  - 단일 파일 유지와 목차 정비: 읽는 양과 머지 충돌이 그대로다.
  - 번호를 새로 매기기(`001-…`): 코드 주석, 커밋, PR 본문이 `ADR-F16` 같은 번호로 가리키고 있어 기존 참조가 모두 깨진다.
- **결과**:
  - 얻는 것: `ls docs/adr/ADR-F16*` 이나 INDEX 한 줄로 필요한 결정만 연다. 새 결정은 새 파일이라 계획끼리 충돌하지 않는다(INDEX 한 줄만 겹친다).
  - 감당할 것: 새 ADR 을 만들면 INDEX 에도 한 줄을 더해야 한다. 파일 이름의 번호는 `ADR-{접두어}{두 자리}` 형식을 지킨다.
- **적용 범위**: 세 ADR 디렉터리와 그 파일을 가리키는 문서, 하네스(`CLAUDE.md`, `.claude/*-overlay.md`, `.github/claude-review-prompt-*.txt`).

