#!/usr/bin/env python3
"""
Agent harness — Claude Code phase 순차 실행기.

Usage:
  python scripts/run-phases.py <task-dir> [--from-phase N]

  예: python scripts/run-phases.py tasks/v2-recurring-backend
      python scripts/run-phases.py tasks/v2-recurring-backend --from-phase 3

Exit codes:
  0  — 모든 phase 완료
  1  — phase 실행 오류 (index.json의 error_message 참고)
  2  — 사용자 개입 필요 (index.json의 blocked_reason 참고)
"""

import json
import os
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


# ── 웹훅 알림 ──────────────────────────────────────────────────────────────────

def notify(message: str) -> None:
    """DOORAY_WEBHOOK_URL 환경변수가 있을 때만 전송. 없으면 조용히 스킵."""
    webhook_url = os.environ.get("DOORAY_WEBHOOK_URL")
    if not webhook_url:
        return
    payload = json.dumps({"botName": "fos-accountbook-backend", "text": message}).encode()
    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"[warn] 웹훅 알림 실패: {e}", file=sys.stderr)


# ── Task 파일 헬퍼 ────────────────────────────────────────────────────────────

def validate_task(task: dict, task_dir: Path) -> None:
    """index.json 필수 필드 검증. tasks/schema.ts 참고."""
    errors: list[str] = []

    # Task 메타데이터 필수 필드
    required_task_fields = [
        "name", "description", "created_at", "updated_at",
        "status", "current_phase", "total_phases",
        "error_message", "blocked_reason", "phases",
    ]
    for field in required_task_fields:
        if field not in task:
            errors.append(f"task 필수 필드 누락: '{field}'")

    if "phases" in task:
        phases = task["phases"]
        if not isinstance(phases, list) or len(phases) == 0:
            errors.append("phases는 1개 이상의 배열이어야 합니다")
        else:
            # total_phases 일치 확인
            if task.get("total_phases") != len(phases):
                errors.append(
                    f"total_phases({task.get('total_phases')}) != "
                    f"phases 배열 길이({len(phases)})"
                )

            # Phase 필수 필드 검증
            required_phase_fields = [
                "number", "title", "file", "status", "allowedTools",
            ]
            for i, phase in enumerate(phases):
                for field in required_phase_fields:
                    if field not in phase:
                        errors.append(
                            f"phase[{i}] 필수 필드 누락: '{field}'"
                        )

                # number 순차 증가 확인
                expected_num = i + 1
                if phase.get("number") != expected_num:
                    errors.append(
                        f"phase[{i}].number={phase.get('number')}, "
                        f"expected={expected_num}"
                    )

                # phase 파일 존재 확인
                phase_file = task_dir / phase.get("file", "")
                if phase.get("file") and not phase_file.exists():
                    errors.append(f"phase 파일 없음: {phase_file}")

    if errors:
        print("\n❌ index.json 검증 실패:\n", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        print(
            "\n  → tasks/schema.ts 및 prompts/task-create.md 참고\n",
            file=sys.stderr,
        )
        sys.exit(1)


def load_task(task_dir: Path) -> tuple[dict, Path]:
    index_path = task_dir / "index.json"
    if not index_path.exists():
        print(f"[error] index.json not found: {index_path}", file=sys.stderr)
        sys.exit(1)
    with open(index_path, encoding="utf-8") as f:
        task = json.load(f)
    validate_task(task, task_dir)
    return task, index_path


def save_task(task: dict, index_path: Path) -> None:
    task["updated_at"] = datetime.now(timezone.utc).isoformat()
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(task, f, indent=2, ensure_ascii=False)


# ── Phase 실행 ────────────────────────────────────────────────────────────────

DEFAULT_TOOLS = "Read,Write,Edit,Bash,Glob,Grep"
BLOCKED_MARKER = "PHASE_BLOCKED:"
FAILED_MARKER = "PHASE_FAILED:"


def run_phase(phase_file: Path, allowed_tools: list[str]) -> tuple[int, str, str]:
    """
    phase 프롬프트를 Claude에 전달하고 (returncode, stdout, stderr) 반환.
    stdout을 실시간 스트리밍하면서 동시에 캡처한다.
    """
    with open(phase_file, encoding="utf-8") as f:
        prompt = f.read()

    tools = ",".join(allowed_tools) if allowed_tools else DEFAULT_TOOLS

    proc = subprocess.Popen(
        ["claude", "--print", "--allowedTools", tools],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    proc.stdin.write(prompt)
    proc.stdin.close()

    stdout_lines: list[str] = []
    stderr_lines: list[str] = []

    for line in proc.stdout:
        print(line, end="", flush=True)
        stdout_lines.append(line)

    proc.wait()
    stderr_output = proc.stderr.read()
    if stderr_output:
        print(stderr_output, end="", file=sys.stderr)
        stderr_lines.append(stderr_output)

    return proc.returncode, "".join(stdout_lines), "".join(stderr_lines)


def find_marker(text: str, marker: str) -> str | None:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith(marker):
            return stripped[len(marker):].strip()
    return None


def fmt_elapsed(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    return f"{m}m{s:02d}s" if m else f"{s}s"


# ── 메인 ─────────────────────────────────────────────────────────────────────

def main() -> None:
    args = sys.argv[1:]
    if not args:
        print(__doc__, file=sys.stderr)
        sys.exit(1)

    task_dir = Path(args[0]).resolve()
    if not task_dir.is_dir():
        print(f"[error] task 디렉터리 없음: {task_dir}", file=sys.stderr)
        sys.exit(1)

    from_phase = 1
    if "--from-phase" in args:
        idx = args.index("--from-phase")
        try:
            from_phase = int(args[idx + 1])
        except (IndexError, ValueError):
            print("[error] --from-phase 뒤에 정수를 지정하세요", file=sys.stderr)
            sys.exit(1)

    task, index_path = load_task(task_dir)
    task_name = task["name"]
    phases = task["phases"]
    total = len(phases)

    print(f"\n🚀  Task: {task_name}  ({total} phases)\n")

    for phase in phases:
        phase_num = phase["number"]
        phase_title = phase.get("title", f"Phase {phase_num}")

        if phase_num < from_phase:
            print(f"  ⏭  Phase {phase_num}/{total}: {phase_title}  (skipped)")
            continue

        if phase["status"] == "completed":
            print(f"  ✓  Phase {phase_num}/{total}: {phase_title}  (already completed)")
            continue

        phase_file = task_dir / phase["file"]
        if not phase_file.exists():
            msg = f"phase 파일 없음: {phase_file}"
            phase["status"] = "failed"
            task["status"] = "failed"
            task["error_message"] = msg
            save_task(task, index_path)
            notify(f"❌ Task **{task_name}** phase {phase_num} 실패: {msg}")
            print(f"  ✗  {msg}", file=sys.stderr)
            sys.exit(1)

        allowed_tools = phase.get("allowedTools", [])

        print(f"  ▶  Phase {phase_num}/{total}: {phase_title}")
        print(f"  {'─' * 60}")

        phase["status"] = "running"
        task["status"] = "running"
        task["current_phase"] = phase_num
        save_task(task, index_path)

        start_time = time.monotonic()
        returncode, stdout, stderr = run_phase(phase_file, allowed_tools)
        elapsed = time.monotonic() - start_time

        print(f"  {'─' * 60}")

        blocked = find_marker(stdout, BLOCKED_MARKER) or find_marker(stderr, BLOCKED_MARKER)
        if blocked:
            phase["status"] = "blocked"
            task["status"] = "blocked"
            task["blocked_reason"] = blocked
            save_task(task, index_path)
            msg = f"⚠️ Task **{task_name}** phase {phase_num} blocked: {blocked}"
            print(f"\n  ⚠  {msg}", file=sys.stderr)
            notify(msg)
            sys.exit(2)

        if returncode != 0:
            error = (
                find_marker(stdout, FAILED_MARKER)
                or find_marker(stderr, FAILED_MARKER)
                or stderr.strip()
                or f"exit code {returncode}"
            )
            phase["status"] = "failed"
            task["status"] = "failed"
            task["error_message"] = error
            save_task(task, index_path)
            msg = f"❌ Task **{task_name}** phase {phase_num} 실패: {error}"
            print(f"\n  ✗  {msg}", file=sys.stderr)
            notify(msg)
            sys.exit(1)

        phase["status"] = "completed"
        save_task(task, index_path)
        print(f"  ✓  Phase {phase_num}/{total}: {phase_title}  완료  [{fmt_elapsed(elapsed)}]\n")

    task["status"] = "completed"
    save_task(task, index_path)
    msg = f"✅ Task **{task_name}** 완료 ({total} phases)"
    print(f"\n{msg}\n")
    notify(msg)
    sys.exit(0)


if __name__ == "__main__":
    main()
