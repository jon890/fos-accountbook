/** @jest-environment node */

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: { BACKEND_API_URL: "http://localhost:8080" },
}));
jest.mock("@/lib/server/auth/auth-helpers");
jest.mock("@/lib/server/auth/auth", () => ({
  handlers: {},
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("@/services/budget-item/budget-item-service");
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { createBudgetItemAction } from "@/actions/budget-item/create-budget-item-action";
import { deleteBudgetItemAction } from "@/actions/budget-item/delete-budget-item-action";
import { updateBudgetItemAction } from "@/actions/budget-item/update-budget-item-action";
import { ServerApiError } from "@/lib/server/api/types";
import {
  getSelectedFamilyUuid,
  requireAuth,
} from "@/lib/server/auth/auth-helpers";
import {
  createBudgetItem,
  deleteBudgetItem,
  updateBudgetItem,
} from "@/services/budget-item/budget-item-service";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";

const session: Session = {
  user: { userUuid: "user-1" },
  expires: "2026-10-02T00:00:00.000Z",
};

const itemUuid = "22222222-2222-4222-8222-222222222222";
const input = {
  name: "남편 용돈",
  monthlyLimit: 400000,
  categoryUuids: ["11111111-1111-4111-8111-111111111111"],
};
const item = {
  uuid: itemUuid,
  ...input,
  createdAt: "2026-10-02T00:00:00",
  updatedAt: "2026-10-02T00:00:00",
};

describe("예산 항목 액션", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireAuth).mockResolvedValue(session);
    jest.mocked(getSelectedFamilyUuid).mockResolvedValue("family-1");
  });

  it("생성은 세션 가족으로 서비스를 부르고 세 경로를 revalidate 한다", async () => {
    jest.mocked(createBudgetItem).mockResolvedValue(item);

    const result = await createBudgetItemAction(input);

    expect(result).toEqual({ success: true, data: item });
    expect(createBudgetItem).toHaveBeenCalledWith("family-1", input);
    expect(revalidatePath).toHaveBeenCalledWith("/budget");
    expect(revalidatePath).toHaveBeenCalledWith("/calendar");
    expect(revalidatePath).toHaveBeenCalledWith("/analytics");
  });

  it("수정과 삭제도 성공하면 세 경로를 revalidate 한다", async () => {
    jest.mocked(updateBudgetItem).mockResolvedValue(item);

    await updateBudgetItemAction(itemUuid, input);
    await deleteBudgetItemAction(itemUuid);

    expect(updateBudgetItem).toHaveBeenCalledWith("family-1", itemUuid, input);
    expect(deleteBudgetItem).toHaveBeenCalledWith("family-1", itemUuid);
    expect(revalidatePath).toHaveBeenCalledTimes(6);
  });

  it("가족을 고르지 않았으면 F002 를 반환하고 서비스를 부르지 않는다", async () => {
    jest.mocked(getSelectedFamilyUuid).mockResolvedValue(null);

    const result = await createBudgetItemAction(input);

    expect(result).toMatchObject({ success: false, error: { code: "F002" } });
    expect(createBudgetItem).not.toHaveBeenCalled();
  });

  it("카테고리가 비면 서비스를 부르지 않고 C001 과 안내 문구를 반환한다", async () => {
    const result = await createBudgetItemAction({
      ...input,
      categoryUuids: [],
    });

    expect(result).toMatchObject({
      success: false,
      error: {
        code: "C001",
        message: expect.stringContaining("카테고리를 하나 이상 골라 주세요"),
      },
    });
    expect(createBudgetItem).not.toHaveBeenCalled();
  });

  it.each([
    ["소수 한도", 1000.5, "한도는 정수여야 합니다"],
    ["상한 초과 한도", 10_000_000_000_000, "한도가 너무 큽니다"],
  ])("%s 는 서비스를 부르지 않고 C001 과 안내 문구를 반환한다", async (_name, monthlyLimit, message) => {
    const result = await createBudgetItemAction({ ...input, monthlyLimit });

    expect(result).toMatchObject({
      success: false,
      error: { code: "C001", message: expect.stringContaining(message) },
    });
    expect(createBudgetItem).not.toHaveBeenCalled();
  });

  it.each([
    ["수정", () => updateBudgetItemAction("not-a-uuid", input)],
    ["삭제", () => deleteBudgetItemAction("not-a-uuid")],
  ])(
    "UUID 형식이 아닌 항목으로 %s 을 부르면 서비스를 부르지 않고 C001 을 반환한다",
    async (_name, call) => {
      const result = await call();

      expect(result).toMatchObject({ success: false, error: { code: "C001" } });
      expect(updateBudgetItem).not.toHaveBeenCalled();
      expect(deleteBudgetItem).not.toHaveBeenCalled();
    },
  );

  it("서비스가 409 를 던지면 결과 message 가 백엔드 문구다", async () => {
    jest.mocked(createBudgetItem).mockRejectedValue(
      new ServerApiError("conflict", 409, {
        code: "BI004",
        message: "이미 존재하는 예산 항목입니다",
      }),
    );

    const result = await createBudgetItemAction(input);

    expect(result).toMatchObject({
      success: false,
      error: { code: "C001", message: "이미 존재하는 예산 항목입니다" },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
