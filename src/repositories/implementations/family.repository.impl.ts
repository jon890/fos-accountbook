/**
 * Family Repository 구현
 */

import { prisma } from '@/lib/prisma'
import { 
  IFamilyRepository, 
  FamilyData, 
  FamilyWithDetails, 
  CreateFamilyData, 
  UpdateFamilyData 
} from '../interfaces/family.repository'
import { PaginationResult, PaginationOptions, SortOptions, FilterOptions } from '../interfaces/base.repository'
import { createSoftDeleteCondition, createSoftDeleteData } from '@/lib/database-utils'

export class FamilyRepositoryImpl implements IFamilyRepository {
  
  async findById(id: string): Promise<FamilyData | null> {
    const family = await prisma.family.findFirst({
      where: {
        id: BigInt(id),
        ...createSoftDeleteCondition()
      }
    })
    
    if (!family) return null
    
    return this.mapToFamilyData(family)
  }

  async findWithDetails(id: string): Promise<FamilyWithDetails | null> {
    const family = await prisma.family.findFirst({
      where: {
        id: BigInt(id),
        ...createSoftDeleteCondition()
      },
      include: {
        members: {
          where: createSoftDeleteCondition(),
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
          where: createSoftDeleteCondition(),
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        _count: {
          select: {
            expenses: {
              where: createSoftDeleteCondition()
            }
          }
        }
      }
    })

    if (!family) return null
    
    return this.mapToFamilyWithDetails(family)
  }

  async findByUserId(userId: string): Promise<FamilyWithDetails | null> {
    const family = await prisma.family.findFirst({
      where: {
        members: {
          some: {
            userId,
            ...createSoftDeleteCondition()
          }
        },
        ...createSoftDeleteCondition()
      },
      include: {
        members: {
          where: createSoftDeleteCondition(),
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
          where: createSoftDeleteCondition(),
          orderBy: { name: 'asc' }
        }
      }
    })

    if (!family) return null
    
    return this.mapToFamilyWithDetails(family)
  }

  async findAllByUserId(userId: string): Promise<FamilyWithDetails[]> {
    const families = await prisma.family.findMany({
      where: {
        members: {
          some: {
            userId,
            ...createSoftDeleteCondition()
          }
        },
        ...createSoftDeleteCondition()
      },
      include: {
        members: {
          where: createSoftDeleteCondition(),
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
          where: createSoftDeleteCondition(),
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        _count: {
          select: {
            expenses: {
              where: createSoftDeleteCondition()
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return families.map(family => this.mapToFamilyWithDetails(family))
  }

  async findAll(options?: {
    pagination?: PaginationOptions
    sort?: SortOptions
    filters?: FilterOptions
  }): Promise<PaginationResult<FamilyData>> {
    const { pagination, sort, filters } = options || {}
    
    const where = {
      ...createSoftDeleteCondition(),
      ...filters
    }

    const [families, total] = await Promise.all([
      prisma.family.findMany({
        where,
        ...(pagination && {
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit
        }),
        ...(sort && {
          orderBy: { [sort.field]: sort.order }
        })
      }),
      prisma.family.count({ where })
    ])

    return {
      data: families.map(family => this.mapToFamilyData(family)),
      pagination: {
        page: pagination?.page || 1,
        limit: pagination?.limit || families.length,
        total,
        totalPages: pagination ? Math.ceil(total / pagination.limit) : 1
      }
    }
  }

  async create(data: CreateFamilyData): Promise<FamilyData> {
    const defaultCategories = data.categories || [
      { name: '식비', color: '#ef4444', icon: '🍽️' },
      { name: '교통', color: '#3b82f6', icon: '🚗' },
      { name: '쇼핑', color: '#8b5cf6', icon: '🛍️' },
      { name: '의료', color: '#10b981', icon: '🏥' },
      { name: '문화', color: '#f59e0b', icon: '🎭' },
      { name: '기타', color: '#6b7280', icon: '📝' }
    ]

    const family = await prisma.family.create({
      data: {
        name: data.name,
        members: {
          create: {
            userId: data.userId,
            role: 'admin'
          }
        },
        categories: {
          createMany: {
            data: defaultCategories
          }
        }
      }
    })

    return this.mapToFamilyData(family)
  }

  async update(id: string, data: UpdateFamilyData): Promise<FamilyData | null> {
    try {
      const family = await prisma.family.update({
        where: { id: BigInt(id) },
        data
      })
      
      return this.mapToFamilyData(family)
    } catch {
      return null
    }
  }

  async softDelete(id: string): Promise<boolean> {
    try {
      await prisma.family.update({
        where: { id: BigInt(id) },
        data: createSoftDeleteData()
      })
      return true
    } catch {
      return false
    }
  }

  async restore(id: string): Promise<boolean> {
    try {
      await prisma.family.update({
        where: { id: BigInt(id) },
        data: { deletedAt: null }
      })
      return true
    } catch {
      return false
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.family.count({
      where: {
        id: BigInt(id),
        ...createSoftDeleteCondition()
      }
    })
    return count > 0
  }

  async count(filters?: FilterOptions): Promise<number> {
    return await prisma.family.count({
      where: {
        ...createSoftDeleteCondition(),
        ...filters
      }
    })
  }

  async addMember(familyId: string, userId: string, role: string = 'member'): Promise<boolean> {
    try {
      await prisma.familyMember.create({
        data: {
          familyId: BigInt(familyId),
          userId,
          role
        }
      })
      return true
    } catch {
      return false
    }
  }

  async removeMember(familyId: string, userId: string): Promise<boolean> {
    try {
      await prisma.familyMember.updateMany({
        where: {
          familyId: BigInt(familyId),
          userId,
          ...createSoftDeleteCondition()
        },
        data: createSoftDeleteData()
      })
      return true
    } catch {
      return false
    }
  }

  async updateMemberRole(familyId: string, userId: string, role: string): Promise<boolean> {
    try {
      await prisma.familyMember.updateMany({
        where: {
          familyId: BigInt(familyId),
          userId,
          ...createSoftDeleteCondition()
        },
        data: { role }
      })
      return true
    } catch {
      return false
    }
  }

  async isMember(familyId: string, userId: string): Promise<boolean> {
    const count = await prisma.familyMember.count({
      where: {
        familyId: BigInt(familyId),
        userId,
        ...createSoftDeleteCondition()
      }
    })
    return count > 0
  }

  async isAdmin(familyId: string, userId: string): Promise<boolean> {
    const count = await prisma.familyMember.count({
      where: {
        familyId: BigInt(familyId),
        userId,
        role: 'admin',
        ...createSoftDeleteCondition()
      }
    })
    return count > 0
  }

  // Helper methods
  private mapToFamilyData(family: Record<string, unknown>): FamilyData {
    return {
      id: family.id.toString(),
      uuid: family.uuid,
      name: family.name,
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
      deletedAt: family.deletedAt
    }
  }

  private mapToFamilyWithDetails(family: Record<string, unknown>): FamilyWithDetails {
    return {
      ...this.mapToFamilyData(family),
      members: (family.members as Record<string, unknown>[]).map((member) => ({
        id: member.id.toString(),
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user
      })),
      categories: (family.categories as Record<string, unknown>[]).map((category) => ({
        id: category.id.toString(),
        name: category.name,
        color: category.color,
        icon: category.icon
      })),
      _count: family._count
    }
  }
}
