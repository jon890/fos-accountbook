/**
 * 공통 Action 타입 정의
 */

export interface ActionResult {
  success: boolean;
  message?: string;
}

export interface CheckUserFamilyResult {
  hasFamily: boolean;
  familyId?: string;
}
