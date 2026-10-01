/**
 * @jest-environment node
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const SOURCE_ROOT = join(process.cwd(), "src");
const SOURCE_FILE_PATTERN = /\.(?:ts|tsx)$/;
const PALETTE_CLASS_PATTERN = /(?<![\w-])(?:(?:[\w-]+|\[[^\]]+\]):)*((bg|text|border|from|via|to|ring|fill|stroke|divide|outline|placeholder|shadow|decoration)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-\d+)?(?:\/\d+)?)(?![\w-])/g;

const ALLOWED_PALETTE_CLASSES = new Map<string, ReadonlySet<string>>([
  ["components/auth/SignInForm.tsx", new Set(["text-white"])],
  ["lib/client/utils.ts", new Set(["bg-blue-500", "text-white"])],
]);

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : getSourceFiles(entryPath);
    }

    return entry.isFile() && SOURCE_FILE_PATTERN.test(entry.name)
      ? [entryPath]
      : [];
  });
}

function findRawPaletteClasses(filePath: string): string[] {
  const source = readFileSync(filePath, "utf8");
  const sourcePath = relative(SOURCE_ROOT, filePath);
  const allowedClasses = ALLOWED_PALETTE_CLASSES.get(sourcePath);
  const violations: string[] = [];

  for (const match of source.matchAll(PALETTE_CLASS_PATTERN)) {
    const className = match[1];
    const palette = match[3];
    const hasNumericShade = Boolean(match[4]);

    if (!className || !palette) {
      continue;
    }

    if (palette === "neutral" && hasNumericShade) {
      continue;
    }

    if (allowedClasses?.has(className)) {
      continue;
    }

    const line = source.slice(0, match.index).split("\n").length;
    violations.push(`${sourcePath}:${line} ${className}`);
  }

  return violations;
}

describe("화면 코드 팔레트 토큰 규칙", () => {
  it("허용된 외부 브랜드 색 외에는 Tailwind 기본 팔레트를 쓰지 않는다", () => {
    const violations = getSourceFiles(SOURCE_ROOT).flatMap(findRawPaletteClasses);

    expect(violations).toEqual([]);
  });
});
