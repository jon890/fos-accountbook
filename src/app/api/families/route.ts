import { withAuth } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-responses'
import { handlePrismaError } from '@/lib/database-utils'
import { familyService } from '@/container'

// 사용자의 가족 조회 또는 생성
export const GET = withAuth(async (user) => {
  try {
    const family = await familyService.getOrCreateDefaultFamily(user.id, user.name)
    return successResponse(family)
  } catch (error: unknown) {
    return handlePrismaError(error)
  }
})
