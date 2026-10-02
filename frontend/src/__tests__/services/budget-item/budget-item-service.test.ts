/** @jest-environment node */
jest.mock("@/lib/server/api/client", () => ({
  serverApiGet: jest.fn(),
  serverApiPost: jest.fn(),
  serverApiPut: jest.fn(),
  serverApiDelete: jest.fn(),
}));

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
import {
  createBudgetItem,
  deleteBudgetItem,
  getBudgetItems,
  getBudgetSummary,
  updateBudgetItem,
} from "@/services/budget-item/budget-item-service";

const input = {
  name: "남편 용돈",
  monthlyLimit: 400000,
  categoryUuids: ["11111111-1111-4111-8111-111111111111"],
};

beforeEach(() => jest.clearAllMocks());

describe("예산 항목 서비스", () => {
  it("목록을 목록 스키마로 조회한다", async () => {
    await getBudgetItems("family-1");

    expect(serverApiGet).toHaveBeenCalledWith(
      "/families/family-1/budget-items",
      {
        schema: budgetItemListResponseSchema,
      },
    );
  });

  it("생성은 POST 로 입력을 보내고 항목 스키마로 검증한다", async () => {
    await createBudgetItem("family-1", input);

    expect(serverApiPost).toHaveBeenCalledWith(
      "/families/family-1/budget-items",
      input,
      { schema: budgetItemResponseSchema },
    );
  });

  it("수정은 PUT 으로 항목 경로에 입력을 보낸다", async () => {
    await updateBudgetItem("family-1", "item-1", input);

    expect(serverApiPut).toHaveBeenCalledWith(
      "/families/family-1/budget-items/item-1",
      input,
      { schema: budgetItemResponseSchema },
    );
  });

  it("삭제는 항목 경로로 DELETE 를 보낸다", async () => {
    await deleteBudgetItem("family-1", "item-1");

    expect(serverApiDelete).toHaveBeenCalledWith(
      "/families/family-1/budget-items/item-1",
    );
  });

  it("예산 요약은 year 와 month 를 쿼리에 싣고 요약 스키마로 검증한다", async () => {
    await getBudgetSummary("family-1", 2026, 10);

    expect(serverApiGet).toHaveBeenCalledWith(
      "/families/family-1/dashboard/budget-summary?year=2026&month=10",
      { schema: budgetSummaryResponseSchema },
    );
  });
});
