import {
  serverApiDelete,
  serverApiGet,
  serverApiPost,
  serverApiPut,
} from "@/lib/server/api/client";
import {
  budgetItemListResponseSchema,
  budgetItemResponseSchema,
  budgetSummaryResponseSchema,
} from "@/lib/schemas/responses/budget-item";
import type {
  BudgetItem,
  BudgetItemInput,
  BudgetSummary,
} from "@/types/budget-item";

export async function getBudgetItems(
  familyUuid: string,
): Promise<BudgetItem[]> {
  return serverApiGet(`/families/${familyUuid}/budget-items`, {
    schema: budgetItemListResponseSchema,
  });
}

export async function createBudgetItem(
  familyUuid: string,
  data: BudgetItemInput,
): Promise<BudgetItem> {
  return serverApiPost<BudgetItem>(
    `/families/${familyUuid}/budget-items`,
    data,
    {
      schema: budgetItemResponseSchema,
    },
  );
}

export async function updateBudgetItem(
  familyUuid: string,
  budgetItemUuid: string,
  data: BudgetItemInput,
): Promise<BudgetItem> {
  return serverApiPut<BudgetItem>(
    `/families/${familyUuid}/budget-items/${budgetItemUuid}`,
    data,
    { schema: budgetItemResponseSchema },
  );
}

export async function deleteBudgetItem(
  familyUuid: string,
  budgetItemUuid: string,
): Promise<void> {
  await serverApiDelete(
    `/families/${familyUuid}/budget-items/${budgetItemUuid}`,
  );
}

export async function getBudgetSummary(
  familyUuid: string,
  year: number,
  month: number,
): Promise<BudgetSummary> {
  return serverApiGet(
    `/families/${familyUuid}/dashboard/budget-summary?year=${year}&month=${month}`,
    { schema: budgetSummaryResponseSchema },
  );
}
