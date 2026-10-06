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
jest.mock("@/services/category/category-service");
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { createCategoryAction } from "@/actions/category/create-category-action";
import { ActionError } from "@/lib/errors";
import {
  getSelectedFamilyUuid,
  requireAuth,
} from "@/lib/server/auth/auth-helpers";
import { createCategory } from "@/services/category/category-service";
import type { Session } from "next-auth";

const session: Session = {
  user: { userUuid: "user-1" },
  expires: "2026-10-02T00:00:00.000Z",
};

const category = {
  uuid: "category-1",
  familyUuid: "family-1",
  type: "INCOME" as const,
  name: "급여",
  icon: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};

describe("createCategoryAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireAuth).mockResolvedValue(session);
    jest.mocked(getSelectedFamilyUuid).mockResolvedValue("family-1");
  });

  it("카테고리 종류를 백엔드 요청에 전달한다", async () => {
    jest.mocked(createCategory).mockResolvedValue(category);

    const result = await createCategoryAction("family-1", {
      type: "INCOME",
      name: "급여",
    });

    expect(result).toEqual({ success: true, data: category });
    expect(createCategory).toHaveBeenCalledWith("family-1", {
      type: "INCOME",
      name: "급여",
    });
  });

  it("인증 실패를 반환하고 서비스를 호출하지 않는다", async () => {
    jest.mocked(requireAuth).mockRejectedValue(ActionError.unauthorized());

    const result = await createCategoryAction("family-1", {
      type: "EXPENSE",
      name: "식비",
    });

    expect(result).toMatchObject({ success: false, error: { code: "A001" } });
    expect(createCategory).not.toHaveBeenCalled();
  });

  it("가족을 선택하지 않으면 F002를 반환하고 서비스를 호출하지 않는다", async () => {
    jest.mocked(getSelectedFamilyUuid).mockResolvedValue(null);

    const result = await createCategoryAction(null, {
      type: "EXPENSE",
      name: "식비",
    });

    expect(result).toMatchObject({ success: false, error: { code: "F002" } });
    expect(createCategory).not.toHaveBeenCalled();
  });
});
