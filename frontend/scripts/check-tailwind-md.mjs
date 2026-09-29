#!/usr/bin/env node
/**
 * check-tailwind-md.mjs — 보조 위생 lint (ADR-F28)
 *
 * Tailwind v4 content scanner 가 markdown 안의 arbitrary value 패턴을
 * invalid CSS 로 해석해 dev 서버 500 을 유발하는 함정(CODE-3)을 사전 차단.
 *
 * 1차 방어: globals.css @source not (Tailwind 네이티브 스캔 제외)
 * 보조 방어: 이 스크립트가 CI 에서 위험 패턴을 검출하고 exit 1 로 차단.
 *
 * 검출 대상: tasks/**\/\*.md · docs/**\/\*.md · .claude\/skills\/**\/\*.md
 * 검출 패턴: Tailwind utility prefix + '[' 닫힌 arbitrary value 안에 와일드카드(별표) 또는 중괄호 포함
 *
 * 주의: 검출 정규식은 문자 클래스 조립으로 구성 — 스크립트 자신이 검출 대상 패턴을 포함하지 않도록.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// 위험 문자를 charCode 로 조립 — 스크립트 소스에 패턴 리터럴이 남지 않게
const WILDCARD = String.fromCharCode(42);   // * (별표)
const OPEN_BRACE = String.fromCharCode(123); // { (여는 중괄호)
const CLOSE_BRACE = String.fromCharCode(125); // } (닫는 중괄호)

// 정규식: \b\w+-\[[^\]]*[*{][^\]]*\]  (utility prefix + arbitrary value 안에 위험 문자)
const dangerCharClass = '[' + WILDCARD + OPEN_BRACE + CLOSE_BRACE + ']';
const pattern = new RegExp(
  '\\b\\w+' + '-\\[' + '[^\\]]*' + dangerCharClass + '[^\\]]*' + '\\]',
  'g'
);

/** 디렉터리를 재귀 탐색하며 .md 파일 경로를 yield */
function* walkMd(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // 디렉터리가 없으면 스킵
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full); // 깨진 심볼릭 링크 등은 스킵 (false-fail 방지)
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      yield* walkMd(full);
    } else if (extname(entry) === '.md') {
      yield full;
    }
  }
}

const SCAN_DIRS = ['tasks', 'docs', '.claude/skills'];
let findings = 0;

for (const dir of SCAN_DIRS) {
  for (const file of walkMd(dir)) {
    let content;
    try {
      content = readFileSync(file, 'utf8'); // 읽기 권한 없는 파일은 스킵 (false-fail 방지)
    } catch {
      continue;
    }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const matches = lines[i].match(pattern);
      if (matches) {
        console.error(`${file}:${i + 1}: 위험 패턴 검출 — ${matches.join(', ')}`);
        findings++;
      }
    }
  }
}

if (findings > 0) {
  console.error(`\n총 ${findings}건의 위험 패턴이 발견됐습니다. 커밋 전 수정이 필요합니다.`);
  process.exit(1);
}

console.log('check-tailwind-md: OK — 위험 패턴 없음');
