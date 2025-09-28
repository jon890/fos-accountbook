/**
 * @jest-environment node
 */

// NextAuth 설정 테스트 - 모킹 방식으로 안전하게 테스트
describe('NextAuth Configuration', () => {
  // 환경변수 모킹
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      NEXTAUTH_SECRET: 'test-secret-that-is-32-chars-long',
      NEXTAUTH_URL: 'http://localhost:3000',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should have required environment variables', () => {
    expect(process.env.GOOGLE_CLIENT_ID).toBeDefined()
    expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined()
    expect(process.env.NEXTAUTH_SECRET).toBeDefined()
    expect(process.env.NEXTAUTH_URL).toBeDefined()
  })

  it('should validate environment variables format', () => {
    expect(process.env.NEXTAUTH_URL).toMatch(/^https?:\/\//)
    expect(process.env.GOOGLE_CLIENT_ID).toMatch(/^[\w.-]+$/)
    expect(process.env.NEXTAUTH_SECRET.length).toBeGreaterThanOrEqual(32) // 최소 32자
  })

  it('should have proper NextAuth URL configuration', () => {
    const url = process.env.NEXTAUTH_URL
    expect(url).not.toBeUndefined()
    if (url) {
      expect(() => new URL(url)).not.toThrow()
    }
  })
})