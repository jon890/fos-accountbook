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
jest.mock("@/services/installment/installment-service");
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { createInstallmentAction } from "@/actions/installment/create-installment-action";
import { deleteInstallmentAction } from "@/actions/installment/delete-installment-action";
import { updateInstallmentAction } from "@/actions/installment/update-installment-action";
import { ServerApiError } from "@/lib/server/api/types";
import {
  getSelectedFamilyUuid,
  requireAuth,
} from "@/lib/server/auth/auth-helpers";
import {
  createInstallment,
  deleteInstallment,
  updateInstallment,
} from "@/services/installment/installment-service";
import type { Installment } from "@/types/installment";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";

const session: Session = {
  user: { userUuid: "user-1" },
  expires: "2026-10-02T00:00:00.000Z",
};

const installmentUuid = "22222222-2222-4222-8222-222222222222";
const input = {
  name: "냉장고",
  totalAmount: 1200000,
  installmentMonths: 12,
  startMonth: "2026-10",
};
const installment: Installment = {
  uuid: installmentUuid,
  userUuid: "user-1",
  ...input,
  endMonth: "2027-09",
  memo: null,
  monthlyAmount: 100000,
  firstMonthAmount: 100000,
  currentRound: 1,
  thisMonthAmount: 100000,
  remainingAmount: 1100000,
  progress: "IN_PROGRESS",
  createdAt: "2026-10-02T00:00:00",
  updatedAt: "2026-10-02T00:00:00",
};

describe("할부 액션", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireAuth).mockResolvedValue(session);
    jest.mocked(getSelectedFamilyUuid).mockResolvedValue("family-1");
  });

  it("생성은 세션 가족으로 서비스를 부르고 /transactions 만 revalidate 한다", async () => {
    jest.mocked(createInstallment).mockResolvedValue(installment);

    const result = await createInstallmentAction(input);

    expect(result).toEqual({ success: true, data: installment });
    expect(createInstallment).toHaveBeenCalledWith("family-1", input);
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith("/transactions");
  });

  it("수정과 삭제도 성공하면 /transactions 를 revalidate 한다", async () => {
    jest.mocked(updateInstallment).mockResolvedValue(installment);

    await updateInstallmentAction(installmentUuid, input);
    await deleteInstallmentAction(installmentUuid);

    expect(updateInstallment).toHaveBeenCalledWith(
      "family-1",
      installmentUuid,
      input,
    );
    expect(deleteInstallment).toHaveBeenCalledWith("family-1", installmentUuid);
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith("/transactions");
  });

  it("가족을 고르지 않았으면 F002 를 반환하고 서비스를 부르지 않는다", async () => {
    jest.mocked(getSelectedFamilyUuid).mockResolvedValue(null);

    const result = await createInstallmentAction(input);

    expect(result).toMatchObject({ success: false, error: { code: "F002" } });
    expect(createInstallment).not.toHaveBeenCalled();
  });

  it("입력 검증에 실패하면 서비스를 부르지 않고 C001 과 필드 문구를 반환한다", async () => {
    const result = await createInstallmentAction({
      ...input,
      installmentMonths: 1,
    });

    expect(result).toMatchObject({
      success: false,
      error: {
        code: "C001",
        message: expect.stringContaining("할부는 2개월 이상이어야 합니다"),
      },
    });
    expect(createInstallment).not.toHaveBeenCalled();
  });

  it.each([
    ["수정", () => updateInstallmentAction("not-a-uuid", input)],
    ["삭제", () => deleteInstallmentAction("not-a-uuid")],
  ])(
    "UUID 형식이 아닌 할부로 %s 을 부르면 서비스를 부르지 않고 C001 을 반환한다",
    async (_name, call) => {
      const result = await call();

      expect(result).toMatchObject({ success: false, error: { code: "C001" } });
      expect(updateInstallment).not.toHaveBeenCalled();
      expect(deleteInstallment).not.toHaveBeenCalled();
    },
  );

  it("서비스가 400 을 던지면 결과 message 가 백엔드 문구다", async () => {
    jest.mocked(createInstallment).mockRejectedValue(
      new ServerApiError("bad request", 400, {
        errors: [
          {
            field: "totalAmount",
            message: "총 금액은 할부 개월 수 이상이어야 합니다",
          },
        ],
      }),
    );

    const result = await createInstallmentAction(input);

    expect(result).toMatchObject({
      success: false,
      error: {
        code: "C001",
        message: "총 금액은 할부 개월 수 이상이어야 합니다",
      },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
