import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { plugin as shadcn } from "@shadcn/lint";

/**
 * Next.js 16 ESLint Configuration
 *
 * - core-web-vitals: 성능 최적화 규칙
 * - typescript: TypeScript 규칙
 */
const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    ignores: ["src/lib/client/navigation.tsx", "src/__tests__/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/navigation",
              importNames: ["useRouter"],
              message: "useAppRouter(@/lib/client/navigation) 를 쓴다 (ADR-F39)",
            },
          ],
        },
      ],
    },
  },
  // 디자인 lint 규칙과 예외 정책은 ADR-F43을 따른다.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/__tests__/**"],
    plugins: { shadcn },
    rules: {
      // 달력 선택자 표시용 이름과 sonner 기본 클래스는 CSS 유틸리티가 아니다.
      "shadcn/no-unknown-classes": ["error", { allow: ["day-range-end", "day-outside", "toaster"] }],
      "shadcn/no-raw-colors": "error",
      "shadcn/require-static-classes": "error",
    },
  },
  {
    // Google 로고는 브랜드 가이드에 따라 원래 색을 사용한다.
    files: ["src/components/auth/GoogleIcon.tsx"],
    rules: { "shadcn/no-raw-colors": "off" },
  },
];

export default eslintConfig;
