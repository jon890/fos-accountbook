import {
  serverApiDelete,
  serverApiGet,
  serverApiPost,
  serverApiPut,
} from "@/lib/server/api/client";
import {
  getRecurringExpensesResponseSchema,
  recurringExpenseResponseSchema,
  recurringExpensesMonthlyTotalSchema,
} from "@/lib/schemas/responses/recurring-expense";
import type {
  CreateRecurringExpenseRequest,
  GetRecurringExpensesResponse,
  RecurringExpense,
  UpdateRecurringExpenseRequest,
} from "@/types/recurring-expense";

export async function getRecurringExpenses(
  familyUuid: string,
  month?: string
): Promise<GetRecurringExpensesResponse> {
  const query = month ? `?month=${month}` : "";
  return serverApiGet<GetRecurringExpensesResponse>(
    `/families/${familyUuid}/recurring-expenses${query}`,
    { schema: getRecurringExpensesResponseSchema }
  );
}

export async function getRecurringExpensesMonthlyTotal(
  familyUuid: string
): Promise<number> {
  return serverApiGet<number>(
    `/families/${familyUuid}/recurring-expenses/monthly-total`,
    { schema: recurringExpensesMonthlyTotalSchema }
  );
}

export async function createRecurringExpense(
  familyUuid: string,
  data: CreateRecurringExpenseRequest
): Promise<RecurringExpense> {
  return serverApiPost<RecurringExpense>(
    `/families/${familyUuid}/recurring-expenses`,
    data,
    { schema: recurringExpenseResponseSchema }
  );
}

export async function updateRecurringExpense(
  familyUuid: string,
  uuid: string,
  data: UpdateRecurringExpenseRequest
): Promise<RecurringExpense> {
  return serverApiPut<RecurringExpense>(
    `/families/${familyUuid}/recurring-expenses/${uuid}`,
    data,
    { schema: recurringExpenseResponseSchema }
  );
}

export async function deleteRecurringExpense(
  familyUuid: string,
  uuid: string
): Promise<void> {
  await serverApiDelete<void>(
    `/families/${familyUuid}/recurring-expenses/${uuid}`
  );
}
