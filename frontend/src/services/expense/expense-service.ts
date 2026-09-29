import { serverApiDelete, serverApiGet, serverApiPost, serverApiPut } from "@/lib/server/api/client";
import { ActionError } from "@/lib/errors";
import type {
  CreateExpenseRequest,
  GetExpensesParams,
  GetExpensesResponse,
} from "@/types/expense";

export async function createExpense(
  familyUuid: string,
  data: {
    amount: number;
    description?: string;
    categoryId: string;
    date?: string;
  }
): Promise<void> {
  const requestBody: CreateExpenseRequest = {
    categoryUuid: data.categoryId,
    amount: data.amount,
    description: data.description,
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
  };
  await serverApiPost<void>(`/families/${familyUuid}/expenses`, requestBody);
}

export async function getExpenses(
  familyUuid: string,
  params: Omit<GetExpensesParams, "familyUuid">
): Promise<GetExpensesResponse> {
  const { categoryId, startDate, endDate, page = 1, limit = 25 } = params;

  if (page < 1) {
    throw ActionError.invalidInput("page", page, "1 이상이어야 합니다");
  }
  if (limit < 1 || limit > 1000) {
    throw ActionError.invalidInput(
      "limit",
      limit,
      "1에서 1000 사이여야 합니다"
    );
  }

  let queryParams = `page=${page - 1}&size=${limit}`;
  if (categoryId) queryParams += `&categoryId=${categoryId}`;
  if (startDate) queryParams += `&startDate=${startDate}`;
  if (endDate) queryParams += `&endDate=${endDate}`;

  return serverApiGet<GetExpensesResponse>(
    `/families/${familyUuid}/expenses?${queryParams}`
  );
}

export async function updateExpense(
  familyUuid: string,
  expenseUuid: string,
  data: {
    amount?: number;
    description?: string;
    categoryId?: string;
    date?: string;
  }
): Promise<void> {
  const updateData: {
    categoryUuid?: string;
    amount?: number;
    description?: string;
    date?: string;
  } = {};

  if (data.categoryId) updateData.categoryUuid = data.categoryId;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date) updateData.date = new Date(data.date).toISOString();

  await serverApiPut<void>(`/families/${familyUuid}/expenses/${expenseUuid}`, updateData);
}

export async function deleteExpense(
  familyUuid: string,
  expenseUuid: string
): Promise<void> {
  await serverApiDelete<void>(`/families/${familyUuid}/expenses/${expenseUuid}`);
}
