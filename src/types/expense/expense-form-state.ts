/**
 * 지출 생성 폼 상태
 */
export type CreateExpenseFormState = {
  errors?: {
    amount?: string[];
    description?: string[];
    categoryId?: string[];
    date?: string[];
  };
  message?: string;
  success?: boolean;
};

/**
 * 지출 수정 폼 상태
 */
export type UpdateExpenseFormState = {
  errors?: {
    amount?: string[];
    description?: string[];
    categoryId?: string[];
    date?: string[];
  };
  message?: string;
  success?: boolean;
};
