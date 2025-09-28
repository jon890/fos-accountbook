import { withAuth } from '@/lib/auth-utils'
import { successResponse, errorResponse } from '@/lib/api-responses'
import { handlePrismaError } from '@/lib/database-utils'
import { familyService } from '@/container'

// 사용자의 가족 조회 (생성하지 않음)
export const GET = withAuth(async (user) => {
  try {
    // 기존 가족만 조회하고 생성하지 않음
    const family = await familyService.getFamilyByUserId(user.id)
    
    if (!family) {
      return errorResponse('가족이 없습니다. 새로운 가족을 만들어주세요.', 404)
    }
    
    return successResponse(family)
  } catch (error: unknown) {
    return handlePrismaError(error)
  }
})
