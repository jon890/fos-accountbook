/**
 * @jest-environment node
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const SOURCE_ROOT = join(process.cwd(), "src");
const SOURCE_FILE_PATTERN = /\.(?:ts|tsx)$/;
const PALETTE_CLASS_PATTERN = /(?<![\w-])(?:(?:[\w-]+|\[[^\]]+\]):)*((bg|text|border|from|via|to|ring|fill|stroke|divide|outline|placeholder|shadow|decoration|caret|accent)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-\d+)?(?:\/\d+)?)(?![\w-])/g;

const HEX_CLASS_PATTERN = /(?<![\w-])(?:(?:[\w-]+|\[[^\]]+\]):)*([\w-]+-\[#[0-9a-fA-F]{3,8}\])/g;

// neutral 단계는 다크에서 다시 정의하지 않는다. 테마와 무관해야 하는 자리만 허용한다.
// neutral-0: 브랜드 그라디언트 위 흰 버튼, neutral-950: 오버레이, neutral-500: 구성원 기본 점 색.
const ALLOWED_NEUTRAL_SHADES = new Set(["0", "500", "950"]);

const ALLOWED_PALETTE_CLASSES = new Map<string, ReadonlySet<string>>([
  ["components/auth/SignInForm.tsx", new Set(["text-white", "bg-[#03C75A]"])],
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

    if (palette === "neutral" && hasNumericShade && ALLOWED_NEUTRAL_SHADES.has(match[4].slice(1))) {
      continue;
    }

    if (allowedClasses?.has(className)) {
      continue;
    }

    const line = source.slice(0, match.index).split("\n").length;
    violations.push(`${sourcePath}:${line} ${className}`);
  }

  for (const match of source.matchAll(HEX_CLASS_PATTERN)) {
    const className = match[1];
    if (!className || allowedClasses?.has(className)) {
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
