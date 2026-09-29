/**
 * Task Index Schema — run-phases.py가 실행하는 task의 index.json 타입 정의
 *
 * AI 에이전트가 task를 생성할 때 이 타입을 반드시 참조해야 한다.
 * 모든 필드가 필수이며, 누락 시 run-phases.py가 실행 전에 에러를 발생시킨다.
 *
 * @example
 * ```json
 * {
 *   "name": "v2-recurring-tests",
 *   "description": "v2 반복 지출 테스트 보강",
 *   "created_at": "2026-04-04T00:00:00Z",
 *   "updated_at": "2026-04-04T00:00:00Z",
 *   "status": "pending",
 *   "current_phase": 0,
 *   "total_phases": 3,
 *   "error_message": null,
 *   "blocked_reason": null,
 *   "phases": [
 *     {
 *       "number": 1,
 *       "title": "Phase 제목",
 *       "file": "phase-01.md",
 *       "status": "pending",
 *       "allowedTools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
 *     }
 *   ]
 * }
 * ```
 */

// ── Status ──────────────────────────────────────────────────────────────────

type TaskStatus = "pending" | "running" | "completed" | "failed" | "blocked";

type PhaseStatus = "pending" | "running" | "completed" | "failed" | "blocked";

// ── Phase ───────────────────────────────────────────────────────────────────

type AllowedTool = "Read" | "Write" | "Edit" | "Bash" | "Glob" | "Grep";

interface TaskPhase {
  /** 1부터 순차 증가. phases 배열 순서와 일치해야 한다. */
  number: number;

  /** 간결한 phase 제목 (한글 OK). 하네스 로그에 표시된다. */
  title: string;

  /** 동일 디렉터리 내 phase 프롬프트 파일명. 예: "phase-01.md" */
  file: string;

  /** phase 실행 상태. 최초 생성 시 반드시 "pending". */
  status: PhaseStatus;

  /** Claude CLI에 전달할 도구 목록. 생략 시 기본값 적용. */
  allowedTools: AllowedTool[];
}

// ── Task Index ──────────────────────────────────────────────────────────────

interface TaskIndex {
  /** kebab-case. 디렉터리명과 일치해야 한다. 예: "v2-recurring-tests" */
  name: string;

  /** 무엇을 구현/검증하는 task인지 한 줄 설명. */
  description: string;

  /** ISO 8601 형식. 최초 생성 시각. 예: "2026-04-04T00:00:00Z" */
  created_at: string;

  /** ISO 8601 형식. run-phases.py가 자동 갱신한다. 최초에는 created_at과 동일. */
  updated_at: string;

  /** task 전체 상태. 최초 생성 시 반드시 "pending". */
  status: TaskStatus;

  /** 현재 실행 중인 phase 번호. 0 = 미시작. */
  current_phase: number;

  /** phases 배열 길이와 반드시 일치해야 한다. */
  total_phases: number;

  /** failed 시 오류 메시지. 최초에는 null. */
  error_message: string | null;

  /** blocked 시 사유. 최초에는 null. */
  blocked_reason: string | null;

  /** 1개 이상의 phase. number가 1부터 순차 증가해야 한다. */
  phases: TaskPhase[];
}

export type { TaskIndex, TaskPhase, TaskStatus, PhaseStatus, AllowedTool };
