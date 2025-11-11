/**
 * 에러 코드 정의
 * Server Actions에서 발생하는 에러를 표준화
 */

export const ErrorCode = {
  // ============================================
  // Common Errors (C001~C099)
  // ============================================
  INVALID_INPUT: "C001",
  ENTITY_NOT_FOUND: "C002",
  INTERNAL_ERROR: "C003",

  // ============================================
  // Authentication Errors (A001~A099)
  // ============================================
  UNAUTHORIZED: "A001",
  SESSION_EXPIRED: "A002",

  // ============================================
  // Family Errors (F001~F099)
  // ============================================
  FAMILY_NOT_FOUND: "F001",
  FAMILY_NOT_SELECTED: "F002",
  NOT_FAMILY_MEMBER: "F003",

  // ============================================
  // Category Errors (CT001~CT099)
  // ============================================
  CATEGORY_NOT_FOUND: "CT001",
  CATEGORY_ALREADY_EXISTS: "CT002",
  CANNOT_DELETE_CATEGORY_IN_USE: "CT003",

  // ============================================
  // Expense Errors (E001~E099)
  // ============================================
  EXPENSE_NOT_FOUND: "E001",
  INVALID_EXPENSE_AMOUNT: "E002",
  INVALID_EXPENSE_DATE: "E003",

  // ============================================
  // Income Errors (IC001~IC099)
  // ============================================
  INCOME_NOT_FOUND: "IC001",
  INVALID_INCOME_AMOUNT: "IC002",
  INVALID_INCOME_DATE: "IC003",

  // ============================================
  // Invitation Errors (I001~I099)
  // ============================================
  INVITATION_NOT_FOUND: "I001",
  INVITATION_EXPIRED: "I002",
  INVITATION_ALREADY_USED: "I003",

  // ============================================
  // Notification Errors (N001~N099)
  // ============================================
  NOTIFICATION_FETCH_FAILED: "N001",
  NOTIFICATION_READ_FAILED: "N002",
  NOTIFICATION_MARK_ALL_READ_FAILED: "N003",
  UNREAD_COUNT_FETCH_FAILED: "N004",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * 에러 코드별 기본 메시지
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Common
  C001: "입력값이 올바르지 않습니다",
  C002: "요청한 데이터를 찾을 수 없습니다",
  C003: "서버 내부 오류가 발생했습니다",

  // Authentication
  A001: "로그인이 필요합니다",
  A002: "세션이 만료되었습니다",

  // Family
  F001: "가족을 찾을 수 없습니다",
  F002: "가족이 선택되지 않았습니다. 먼저 가족을 선택해주세요.",
  F003: "해당 가족의 구성원이 아닙니다",

  // Category
  CT001: "카테고리를 찾을 수 없습니다",
  CT002: "이미 존재하는 카테고리입니다",
  CT003: "사용 중인 카테고리는 삭제할 수 없습니다",

  // Expense
  E001: "지출 내역을 찾을 수 없습니다",
  E002: "지출 금액이 올바르지 않습니다",
  E003: "지출 날짜가 올바르지 않습니다",

  // Income
  IC001: "수입 내역을 찾을 수 없습니다",
  IC002: "수입 금액이 올바르지 않습니다",
  IC003: "수입 날짜가 올바르지 않습니다",

  // Invitation
  I001: "초대장을 찾을 수 없습니다",
  I002: "만료된 초대장입니다",
  I003: "이미 사용된 초대장입니다",

  // Notification
  N001: "알림 목록을 가져오는데 실패했습니다",
  N002: "알림 읽음 처리에 실패했습니다",
  N003: "모든 알림 읽음 처리에 실패했습니다",
  N004: "읽지 않은 알림 수를 가져오는데 실패했습니다",
};
