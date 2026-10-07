/** @jest-environment node */
import { spawnSync } from "node:child_process";

type LintMessage = { ruleId: string | null; line: number };

test("디자인 lint가 색과 클래스 오류를 잡고 테마와 애니메이션 클래스를 허용한다", () => {
  const input = [
    'export const A = () => <div className="bg-red-500" />;',
    'export const B = () => <div className="animate-in fade-in-0" />;',
    'export const C = () => <div className="font-num" />;',
    'export const D = () => <div className="bg-bg text-fg num" />;',
  ].join("\n");
  const result = spawnSync("pnpm", ["exec", "eslint", "--stdin", "--stdin-filename", "src/components/__design-lint-probe__.tsx", "--format", "json"], { input, encoding: "utf8" });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  const [{ messages }] = JSON.parse(result.stdout) as { messages: LintMessage[] }[];
  const rulesByLine = (line: number) => messages
    .filter((message) => message.line === line && message.ruleId?.startsWith("shadcn/"))
    .map((message) => message.ruleId);
  expect(rulesByLine(1)).toEqual(["shadcn/no-raw-colors"]);
  expect(rulesByLine(2)).toEqual([]);
  expect(rulesByLine(3)).toEqual(["shadcn/no-unknown-classes"]);
  expect(rulesByLine(4)).toEqual([]);
}, 60_000);
