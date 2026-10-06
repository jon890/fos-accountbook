/** @jest-environment node */

import { execFileSync } from "node:child_process";

interface LintResult {
  name: string;
  filePath: string;
  ruleIds: Array<string | null>;
}

const lintCases = [
  {
    name: "component-use-router",
    filePath: "src/components/Example.tsx",
    code: 'import { useRouter } from "next/navigation";',
  },
  {
    name: "navigation-hook-use-router",
    filePath: "src/lib/client/navigation.tsx",
    code: 'import { useRouter } from "next/navigation";',
  },
  {
    name: "test-use-router",
    filePath: "src/__tests__/components/Example.test.tsx",
    code: 'import { useRouter } from "next/navigation";',
  },
  {
    name: "component-use-pathname",
    filePath: "src/components/Example.tsx",
    code: 'import { usePathname } from "next/navigation";',
  },
];

const lintScript = `
import { ESLint } from "eslint";

const lintCases = JSON.parse(process.argv[1]);
const eslint = new ESLint({ cwd: process.cwd() });
const results = await Promise.all(
  lintCases.map(async ({ code, filePath, name }) => {
    const [result] = await eslint.lintText(code, { filePath });
    return {
      name,
      filePath,
      ruleIds: result.messages.map((message) => message.ruleId),
    };
  }),
);

console.log(JSON.stringify(results));
`;

describe("no direct useRouter import", () => {
  const lintResults = JSON.parse(
    execFileSync(
      process.execPath,
      ["--input-type=module", "--eval", lintScript, JSON.stringify(lintCases)],
      { cwd: process.cwd(), encoding: "utf8" },
    ),
  ) as LintResult[];

  const getRuleIds = (name: string) =>
    lintResults.find((result) => result.name === name)?.ruleIds ?? [];

  it("일반 컴포넌트에서 next/navigation의 useRouter import를 막는다", () => {
    expect(getRuleIds("component-use-router")).toContain(
      "no-restricted-imports",
    );
  });

  it("공용 라우터 훅 구현과 테스트에서는 next/navigation의 useRouter import를 허용한다", () => {
    expect(getRuleIds("navigation-hook-use-router")).not.toContain(
      "no-restricted-imports",
    );
    expect(
      getRuleIds("test-use-router"),
    ).not.toContain("no-restricted-imports");
  });

  it("next/navigation의 usePathname import는 허용한다", () => {
    expect(getRuleIds("component-use-pathname")).not.toContain(
      "no-restricted-imports",
    );
  });
});
