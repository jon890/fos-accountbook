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
];

export default eslintConfig;
