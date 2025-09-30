/**
 * 의존성 주입 컨테이너
 */

import { FamilyRepositoryImpl } from "@/repositories/implementations/family.repository.impl";
import { ExpenseRepositoryImpl } from "@/repositories/implementations/expense.repository.impl";
import { UserRepositoryImpl } from "@/repositories/implementations/user.repository.impl";
import { InvitationRepositoryImpl } from "@/repositories/implementations/invitation.repository.impl";
import { FamilyService } from "@/services/family.service";
import { ExpenseService } from "@/services/expense.service";
import { InvitationService } from "@/services/invitation.service";
import { IFamilyRepository } from "@/repositories/interfaces/family.repository";
import { IExpenseRepository } from "@/repositories/interfaces/expense.repository";
import { IUserRepository } from "@/repositories/interfaces/user.repository";
import { IInvitationRepository } from "@/repositories/interfaces/invitation.repository";

// Repository 인스턴스들
const familyRepository: IFamilyRepository = new FamilyRepositoryImpl();
const expenseRepository: IExpenseRepository = new ExpenseRepositoryImpl();
const userRepository: IUserRepository = new UserRepositoryImpl();
const invitationRepository: IInvitationRepository = new InvitationRepositoryImpl();

// Service 인스턴스들
const familyServiceInstance = new FamilyService(
  familyRepository,
  userRepository
);
const expenseServiceInstance = new ExpenseService(expenseRepository);
const invitationServiceInstance = new InvitationService(
  invitationRepository,
  familyRepository,
  userRepository
);

// 개별 export (레거시 호환)
export const familyService = familyServiceInstance;
export const expenseService = expenseServiceInstance;
export const invitationService = invitationServiceInstance;

// Container 객체로 export (권장)
export const container = {
  getFamilyService: () => familyServiceInstance,
  getExpenseService: () => expenseServiceInstance,
  getInvitationService: () => invitationServiceInstance,
  getFamilyRepository: () => familyRepository,
  getExpenseRepository: () => expenseRepository,
  getUserRepository: () => userRepository,
  getInvitationRepository: () => invitationRepository,
};

// 타입 체크용 export
export type { 
  IFamilyRepository, 
  IExpenseRepository, 
  IUserRepository,
  IInvitationRepository 
};

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
