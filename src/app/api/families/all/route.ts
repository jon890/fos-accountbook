import { withAuth } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-responses'
import { handlePrismaError } from '@/lib/database-utils'
import { familyService } from '@/container'

// 사용자가 속한 모든 가족 조회
export const GET = withAuth(async (user) => {
  try {
    const families = await familyService.getAllFamiliesByUserId(user.id)
    return successResponse(families)
  } catch (error: unknown) {
    return handlePrismaError(error)
  }
})
