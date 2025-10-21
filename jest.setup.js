import '@testing-library/jest-dom'

// 테스트 환경 변수 설정
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-at-least-32-characters-long-for-testing'
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
process.env.BACKEND_API_URL = 'http://localhost:8080'
process.env.NODE_ENV = 'test'

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
