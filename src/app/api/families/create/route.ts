import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createFamilySchema = z.object({
  name: z.string().min(1, '가족 이름을 입력해주세요').max(50, '가족 이름은 50자 이하로 입력해주세요'),
  type: z.enum(['personal', 'family']).optional().default('family')
})

// 새로운 가족 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type } = createFamilySchema.parse(body)

    // 기본 카테고리 데이터
    const defaultCategories = [
      { name: '식비', color: '#ef4444', icon: '🍽️' },
      { name: '교통', color: '#3b82f6', icon: '🚗' },
      { name: '쇼핑', color: '#8b5cf6', icon: '🛍️' },
      { name: '의료', color: '#10b981', icon: '🏥' },
      { name: '문화', color: '#f59e0b', icon: '🎭' },
      { name: '기타', color: '#6b7280', icon: '📝' }
    ]

    // 개인 사용인 경우 카테고리 추가
    if (type === 'personal') {
      defaultCategories.push(
        { name: '용돈', color: '#ec4899', icon: '💰' },
        { name: '저축', color: '#059669', icon: '🏦' }
      )
    }

    const family = await prisma.family.create({
      data: {
        name,
        members: {
          create: {
            user_id: session.user.id,
            role: 'admin'
          }
        },
        categories: {
          createMany: {
            data: defaultCategories
          }
        }
      },
      include: {
        members: {
          where: { deleted_at: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        categories: {
          where: { deleted_at: null },
          orderBy: { name: 'asc' }
        }
      }
    })

    // BigInt를 문자열로 변환
    const serializedFamily = {
      ...family,
      id: family.id.toString(),
      members: family.members.map(member => ({
        ...member,
        id: member.id.toString(),
        familyUuid: member.family_uuid
      })),
      categories: family.categories.map(category => ({
        ...category,
        id: category.id.toString(),
        familyUuid: category.family_uuid
      }))
    }

    return NextResponse.json(serializedFamily, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Create Family API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
