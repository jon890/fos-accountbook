/**
 * 수입 엔티티 타입
 */
export interface Income {
  uuid: string;
  familyUuid: string;
  categoryUuid: string;
  category: {
    uuid: string;
    name: string;
    color: string;
    icon: string;
  };
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}
