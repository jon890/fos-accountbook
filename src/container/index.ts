/**
 * 의존성 주입 컨테이너
 */

import { FamilyRepositoryImpl } from '@/repositories/implementations/family.repository.impl'
import { FamilyService } from '@/services/family.service'
import { IFamilyRepository } from '@/repositories/interfaces/family.repository'

// Repository 인스턴스들
const familyRepository: IFamilyRepository = new FamilyRepositoryImpl()

// Service 인스턴스들
export const familyService = new FamilyService(familyRepository)

// 타입 체크용 export
export type { IFamilyRepository }

// 추후 다른 Repository들이 추가될 예정
// const expenseRepository: IExpenseRepository = new ExpenseRepositoryImpl()
// export const expenseService = new ExpenseService(expenseRepository)

/**
 * 컨테이너 사용 예시:
 * 
 * // API 핸들러에서
 * import { familyService } from '@/container'
 * 
 * export const GET = withAuth(async (user) => {
 *   const family = await familyService.getFamilyByUserId(user.id)
 *   return successResponse(family)
 * })
 */
