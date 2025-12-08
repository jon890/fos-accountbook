import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
];

export default eslintConfig;
