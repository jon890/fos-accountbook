/** @jest-environment node */

import { ESLint } from "eslint";

describe("no direct useRouter import", () => {
  const eslint = new ESLint({
    cwd: process.cwd(),
    overrideConfigFile: true,
    overrideConfig: {
      files: ["**/*.{js,jsx,ts,tsx}"],
      ignores: ["src/lib/client/navigation.tsx", "src/__tests__/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                name: "next/navigation",
                importNames: ["useRouter"],
                message:
                  "useAppRouter(@/lib/client/navigation) 를 쓴다 (ADR-F39)",
              },
            ],
          },
        ],
      },
    },
  });

  it("일반 컴포넌트에서 next/navigation의 useRouter import를 막는다", async () => {
    const [result] = await eslint.lintText(
      'import { useRouter } from "next/navigation";',
      { filePath: "src/components/Example.tsx" },
    );

    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "no-restricted-imports" }),
      ]),
    );
  });

  it("공용 라우터 훅 구현에서는 next/navigation의 useRouter import를 허용한다", async () => {
    const [result] = await eslint.lintText(
      'import { useRouter } from "next/navigation";',
      { filePath: "src/lib/client/navigation.tsx" },
    );

    expect(result.messages).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "no-restricted-imports" }),
      ]),
    );
  });
});
