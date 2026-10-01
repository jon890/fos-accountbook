jest.mock("@/lib/server/api/client", () => ({
  serverApiDelete: jest.fn(),
  serverApiGet: jest.fn(),
  serverApiPost: jest.fn(),
  serverApiPut: jest.fn(),
}));

import { createExpense, updateExpense } from "@/services/expense/expense-service";
import { serverApiPost, serverApiPut } from "@/lib/server/api/client";

const mockServerApiPost = serverApiPost as jest.MockedFunction<typeof serverApiPost>;
const mockServerApiPut = serverApiPut as jest.MockedFunction<typeof serverApiPut>;

describe("expense-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServerApiPost.mockResolvedValue(undefined);
    mockServerApiPut.mockResolvedValue(undefined);
  });

  it.each([true, false])("생성 요청에 excludeFromBudget=%s를 유지한다", async (excludeFromBudget) => {
    await createExpense("family-1", {
      amount: 1000,
      categoryId: "category-1",
      date: "2026-10-01",
      excludeFromBudget,
    });

    expect(mockServerApiPost).toHaveBeenCalledWith(
      "/families/family-1/expenses",
      expect.objectContaining({ excludeFromBudget }),
    );
  });

  it("누락한 생성 플래그는 요청 객체에 넣지 않는다", async () => {
    await createExpense("family-1", { amount: 1000, categoryId: "category-1", date: "2026-10-01" });
    expect(mockServerApiPost.mock.calls[0][1]).not.toHaveProperty("excludeFromBudget");
  });

  it.each([true, false])("수정 요청에 excludeFromBudget=%s를 유지한다", async (excludeFromBudget) => {
    await updateExpense("family-1", "expense-1", { excludeFromBudget });
    expect(mockServerApiPut).toHaveBeenCalledWith(
      "/families/family-1/expenses/expense-1",
      { excludeFromBudget },
    );
  });

  it("누락한 수정 플래그는 요청 객체에 넣지 않는다", async () => {
    await updateExpense("family-1", "expense-1", {});
    expect(mockServerApiPut).toHaveBeenCalledWith("/families/family-1/expenses/expense-1", {});
  });
});
