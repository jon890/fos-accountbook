/**
 * 의존성 주입 컨테이너
 */

import { FamilyRepositoryImpl } from "@/repositories/implementations/family.repository.impl";
import { ExpenseRepositoryImpl } from "@/repositories/implementations/expense.repository.impl";
import { UserRepositoryImpl } from "@/repositories/implementations/user.repository.impl";
import { FamilyService } from "@/services/family.service";
import { ExpenseService } from "@/services/expense.service";
import { IFamilyRepository } from "@/repositories/interfaces/family.repository";
import { IExpenseRepository } from "@/repositories/interfaces/expense.repository";
import { IUserRepository } from "@/repositories/interfaces/user.repository";

// Repository 인스턴스들
const familyRepository: IFamilyRepository = new FamilyRepositoryImpl();
const expenseRepository: IExpenseRepository = new ExpenseRepositoryImpl();
const userRepository: IUserRepository = new UserRepositoryImpl();

// Service 인스턴스들
export const familyService = new FamilyService(
  familyRepository,
  userRepository
);
export const expenseService = new ExpenseService(expenseRepository);

// 타입 체크용 export
export type { IFamilyRepository, IExpenseRepository, IUserRepository };

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
