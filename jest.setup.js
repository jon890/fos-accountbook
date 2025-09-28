import '@testing-library/jest-dom'

// Mock NextAuth for UI 컴포넌트 테스트에만 필요
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock next-auth for API route tests (실제 DB 연결 사용하므로 간단하게)
jest.mock('next-auth', () => ({
  default: jest.fn(() => ({
    GET: jest.fn(),
    POST: jest.fn(),
  })),
  getServerSession: jest.fn(),
}))

// 환경변수는 setup/env.js에서 처리
