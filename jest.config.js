/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom", // 기본값은 jsdom (React 컴포넌트용)
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/helpers/(.*)$": "<rootDir>/src/__tests__/helpers/$1",
    // ESM 모듈을 mock으로 대체 (ky)
    "^ky$": "<rootDir>/src/__mocks__/ky.ts",
  },
  transformIgnorePatterns: ["node_modules/(?!(@auth/core|next-auth)/)"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/layout.tsx",
    "!src/app/globals.css",
    "!src/__tests__/**",
  ],
  // Jest globals 타입 지원
  preset: undefined,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
