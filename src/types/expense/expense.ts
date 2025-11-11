/**
 * 지출 엔티티 타입
 */
export interface Expense {
  uuid: string;
  familyUuid: string;
  categoryUuid: string;
  category: {
    uuid: string;
    name: string;
    color: string;
    icon: string;
  };
  amount: string; // BigDecimal은 문자열로 전송
  description?: string;
  date: string; // ISO 8601 형식
  createdAt: string;
  updatedAt: string;
}
