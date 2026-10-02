/**
 * 서비스 응답 검증 빠뜨림 검사 (ADR-F42)
 *
 * `src/services/**` 에서 값을 돌려받는 `serverApi(Get|Post|Put|Patch)` 호출은 `schema` 를 넘겨야 한다.
 * 제네릭이 `void` 인 쓰기 호출만 검증 없이 허용한다. 제네릭도 schema 도 없는 호출은 위반이다.
 * `serverApiClient` 직접 호출은 아래 예외 목록에 있고 `validateResponse` 를 거치는 파일에서만 허용한다.
 * @jest-environment node
 */

import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

const SERVICES_DIR = join(__dirname, "../../../../services");

/** `serverApiClient` 를 직접 불러도 되는 파일과 그 이유 */
const DIRECT_CLIENT_EXCEPTIONS: Record<string, string> = {
  "invitation/invitation-service.ts":
    "공개 초대 조회는 인증 헤더 없이(skipAuth) 불러야 해서 serverApiClient 를 직접 쓰고 validateResponse 로 검증한다",
};

interface Violation {
  line: number;
  reason: string;
}

/** `source[open]` 의 여는 문자와 짝이 맞는 닫는 문자 위치. 문자열과 주석 안은 건너뛴다. */
function findMatching(source: string, open: number, opener: string, closer: string): number {
  let depth = 0;
  let i = open;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "/" && source[i + 1] === "/") {
      i = source.indexOf("\n", i);
      if (i === -1) return -1;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i = source.indexOf("*/", i) + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      i = skipQuoted(source, i, ch);
      continue;
    }
    if (ch === "`") {
      i = skipTemplate(source, i);
      continue;
    }
    // 제네릭 안의 화살표 `=>` 는 닫는 꺾쇠가 아니다.
    if (ch === opener) depth += 1;
    else if (ch === closer && !(closer === ">" && source[i - 1] === "=")) {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

function skipQuoted(source: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < source.length && source[i] !== quote) {
    i += source[i] === "\\" ? 2 : 1;
  }
  return i + 1;
}

/** 템플릿 리터럴을 건너뛴다. `${ ... }` 안의 중괄호 짝을 맞춘다. */
function skipTemplate(source: string, start: number): number {
  let i = start + 1;
  while (i < source.length && source[i] !== "`") {
    if (source[i] === "\\") {
      i += 2;
      continue;
    }
    if (source[i] === "$" && source[i + 1] === "{") {
      i = findMatching(source, i + 1, "{", "}") + 1;
      continue;
    }
    i += 1;
  }
  return i + 1;
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

/** 소스 한 개에서 schema 없이 값을 돌려받는 호출을 찾는다. */
function findUnvalidatedCalls(source: string): Violation[] {
  const violations: Violation[] = [];
  const callPattern = /\bserverApi(Get|Post|Put|Patch)\b/g;
  let match: RegExpExecArray | null;
  while ((match = callPattern.exec(source)) !== null) {
    let i = match.index + match[0].length;
    while (/\s/.test(source[i])) i += 1;

    let generic: string | null = null;
    if (source[i] === "<") {
      const close = findMatching(source, i, "<", ">");
      generic = source.slice(i + 1, close).trim();
      i = close + 1;
      while (/\s/.test(source[i])) i += 1;
    }
    // import 목록처럼 호출이 아닌 언급은 건너뛴다.
    if (source[i] !== "(") continue;

    const close = findMatching(source, i, "(", ")");
    const args = source.slice(i + 1, close);
    callPattern.lastIndex = close + 1;

    if (generic === "void") continue;
    if (/\bschema\b/.test(args)) continue;

    const line = lineOf(source, match.index);
    violations.push({
      line,
      reason:
        generic === null
          ? `serverApi${match[1]} 호출에 제네릭과 schema 가 모두 없다`
          : `serverApi${match[1]}<${generic}> 호출에 schema 가 없다`,
    });
  }
  return violations;
}

function listServiceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listServiceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

describe("서비스 응답 검증 빠뜨림 검사", () => {
  const files = listServiceFiles(SERVICES_DIR);

  it("검사 대상 서비스 파일을 찾는다", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("값을 돌려받는 serverApi 호출은 모두 schema 를 넘긴다", () => {
    const report = files.flatMap((file) => {
      const name = relative(SERVICES_DIR, file);
      return findUnvalidatedCalls(readFileSync(file, "utf8")).map(
        (v) => `src/services/${name}:${v.line} ${v.reason}`
      );
    });

    expect(report).toEqual([]);
  });

  it("serverApiClient 직접 호출은 예외 목록에 있고 validateResponse 를 거치는 파일에만 있다", () => {
    const report = files.flatMap((file) => {
      const name = relative(SERVICES_DIR, file);
      const source = readFileSync(file, "utf8");
      if (!/\bserverApiClient\s*[<(]/.test(source)) return [];
      if (!(name in DIRECT_CLIENT_EXCEPTIONS)) {
        return [`src/services/${name} serverApiClient 를 직접 부르지만 예외 목록에 없다`];
      }
      if (!/\bvalidateResponse\s*\(/.test(source)) {
        return [`src/services/${name} serverApiClient 응답을 validateResponse 로 검증하지 않는다`];
      }
      return [];
    });

    expect(report).toEqual([]);
  });
});

describe("findUnvalidatedCalls", () => {
  it("여러 줄 호출과 인라인 제네릭에서 schema 가 없는 호출의 줄을 찾는다", () => {
    const source = [
      'import { serverApiGet, serverApiPost } from "@/lib/server/api/client";',
      "async function a() {",
      "  return serverApiGet<{ items: Array<{ id: string }> }>(",
      "    `/x/${id}?q=${encodeURIComponent(q)}`",
      "  );",
      "}",
      "async function b() {",
      '  return serverApiGet<Foo>("/y", { schema: fooSchema });',
      "}",
    ].join("\n");

    expect(findUnvalidatedCalls(source)).toEqual([
      { line: 3, reason: "serverApiGet<{ items: Array<{ id: string }> }> 호출에 schema 가 없다" },
    ]);
  });

  it("void 쓰기 호출은 허용하고, 제네릭도 schema 도 없는 호출은 위반이다", () => {
    const source = [
      'await serverApiPut<void>("/a", { name: "(x)" });',
      'const data = await serverApiPatch("/b", body);',
    ].join("\n");

    expect(findUnvalidatedCalls(source)).toEqual([
      { line: 2, reason: "serverApiPatch 호출에 제네릭과 schema 가 모두 없다" },
    ]);
  });

  it("다음 호출 인자에 있는 schema 를 앞 호출의 것으로 보지 않는다", () => {
    const source = [
      'const a = await serverApiGet<A>("/a");',
      'const b = await serverApiGet<B>("/b", { schema: bSchema });',
    ].join("\n");

    expect(findUnvalidatedCalls(source)).toEqual([
      { line: 1, reason: "serverApiGet<A> 호출에 schema 가 없다" },
    ]);
  });
});
