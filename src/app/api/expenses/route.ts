import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth-utils'
import { 
  successResponse, 
  handleValidationError,
  paginatedResponse
} from '@/lib/api-responses'
import { 
  handlePrismaError
} from '@/lib/database-utils'
import {
  parsePaginationParams,
  parseDateParams 
} from '@/lib/request-utils'
import { prisma } from '@/lib/prisma'

// 지출 생성 스키마
const createExpenseSchema = z.object({
  amount: z.number().positive('금액은 0보다 커야 합니다'),
  description: z.string().optional(),
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  date: z.string().optional()
})

// 지출 조회
export const GET = withAuth(async (user, request: NextRequest) => {
  try {

    const { page, limit } = parsePaginationParams(request)
    const { startDate, endDate } = parseDateParams(request)
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    // 사용자가 속한 가족 찾기
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        user_id: user.id,
        deleted_at: null
      },
      select: { family_uuid: true }
    })

    if (!familyMember) {
      return handlePrismaError({ code: 'P2025' })
    }

    // 필터 조건 구성
    const where: Record<string, unknown> = {
      family_uuid: familyMember.family_uuid,
      deleted_at: null
    }

    if (categoryId) {
      where.category_uuid = categoryId
    }

    if (startDate || endDate) {
      const dateCondition: Record<string, Date> = {}
      if (startDate) dateCondition.gte = new Date(startDate)
      if (endDate) dateCondition.lte = new Date(endDate)
      where.date = dateCondition
    }

    // 지출 조회
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.expense.count({ where })
    ])

    // 직렬화된 응답 반환
    return paginatedResponse(expenses, { page, limit, total })
  } catch (error: unknown) {
    return handlePrismaError(error)
  }
})

// 지출 생성
export const POST = withAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json()
    const { amount, description, categoryId, date } = createExpenseSchema.parse(body)

    // 사용자가 속한 가족 찾기
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        user_id: user.id,
        deleted_at: null
      },
      select: { family_uuid: true }
    })

    if (!familyMember) {
      return handlePrismaError({ code: 'P2025' })
    }

    // 카테고리 확인
    const category = await prisma.category.findFirst({
      where: {
        uuid: categoryId,
        family_uuid: familyMember.family_uuid,
        deleted_at: null
      }
    })

    if (!category) {
      return handlePrismaError({ code: 'P2025' })
    }

    // 지출 생성
    const expense = await prisma.expense.create({
      data: {
        amount: amount,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        family_uuid: familyMember.family_uuid,
        category_uuid: categoryId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      }
    })

    return successResponse(expense, 201)
  } catch (error: unknown) {
    const validationError = handleValidationError(error)
    if (validationError) return validationError

    return handlePrismaError(error)
  }
})
