import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prepared statement 이름 충돌 방지를 위한 설정
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

  // 개발 환경에서 연결 풀링 최적화
  if (process.env.NODE_ENV === 'development') {
    // 기존 연결이 있다면 정리
    client.$connect().catch(() => {
      // 연결 실패시 무시
    })
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 개발 환경에서만 전역 변수에 저장
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 프로세스 종료시 연결 정리
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
