import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-utils'
import { successResponse, handleValidationError } from '@/lib/api-responses'
import { handlePrismaError } from '@/lib/database-utils'
import { familyService } from '@/container'
import { z } from 'zod'

const createFamilySchema = z.object({
  name: z.string().min(1, '가족 이름을 입력해주세요').max(50, '가족 이름은 50자 이하로 입력해주세요'),
  type: z.enum(['personal', 'family']).optional().default('family')
})

// 새로운 가족 생성
export const POST = withAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json()
    const { name, type } = createFamilySchema.parse(body)

    // Repository를 통해 가족 생성
    const family = await familyService.createFamily({
      name,
      userId: user.id,
      type
    })

    return successResponse(family, 201)
  } catch (error: unknown) {
    const validationError = handleValidationError(error)
    if (validationError) return validationError

    return handlePrismaError(error)
  }
})
