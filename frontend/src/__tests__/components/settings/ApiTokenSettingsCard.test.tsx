/**
 * ApiTokenSettingsCard 컴포넌트 테스트
 * @jest-environment jsdom
 */

jest.mock("@/lib/server/auth/config", () => ({
  authConfig: { providers: [], session: { strategy: "jwt" } },
}));
jest.mock("@/lib/server/auth/auth-helpers", () => ({
  requireAuth: jest.fn(),
}));
jest.mock("@/lib/server/api/client", () => ({
  serverApiClient: jest.fn(),
}));
jest.mock("@/actions/user/create-api-token-action", () => ({
  createApiTokenAction: jest.fn(),
}));
jest.mock("@/actions/user/revoke-api-token-action", () => ({
  revokeApiTokenAction: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { createApiTokenAction } from "@/actions/user/create-api-token-action";
import { revokeApiTokenAction } from "@/actions/user/revoke-api-token-action";
import { ApiTokenSettingsCard } from "@/components/settings/ApiTokenSettingsCard";
import type { ApiToken } from "@/types/api-token";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockCreate = createApiTokenAction as jest.MockedFunction<
  typeof createApiTokenAction
>;
const mockRevoke = revokeApiTokenAction as jest.MockedFunction<
  typeof revokeApiTokenAction
>;

const token: ApiToken = {
  uuid: "token-1",
  name: "노트북 에이전트",
  tokenPrefix: "fab_abcd1234",
  lastUsedAt: null,
  createdAt: "2026-09-01T00:00:00Z",
};

describe("ApiTokenSettingsCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("토큰의 이름, 앞부분, 사용 기록 없음이 보인다", () => {
    render(<ApiTokenSettingsCard initialTokens={[token]} />);

    expect(screen.getByText("노트북 에이전트")).toBeInTheDocument();
    expect(screen.getByText("fab_abcd1234…")).toBeInTheDocument();
    expect(screen.getByText(/사용 기록 없음/)).toBeInTheDocument();
  });

  it("목록이 null 이면 불러오지 못했다는 안내가 보인다", () => {
    render(<ApiTokenSettingsCard initialTokens={null} />);

    expect(
      screen.getByText("연동 토큰을 불러오지 못했어요")
    ).toBeInTheDocument();
  });

  it("목록이 비어 있으면 안내가 보인다", () => {
    render(<ApiTokenSettingsCard initialTokens={[]} />);

    expect(screen.getByText("아직 발급한 토큰이 없어요")).toBeInTheDocument();
  });

  it("이름을 입력해 발급하면 원문과 안내가 보인다", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValueOnce({
      success: true,
      data: { ...token, uuid: "token-2", name: "새 토큰", token: "fab_secret-value" },
    });

    render(<ApiTokenSettingsCard initialTokens={[]} />);

    await user.click(screen.getByRole("button", { name: "토큰 발급" }));
    await user.type(screen.getByLabelText("토큰 이름"), "새 토큰");
    await user.click(screen.getByRole("button", { name: "발급" }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith("새 토큰");
    });
    expect(await screen.findByText("fab_secret-value")).toBeInTheDocument();
    expect(
      screen.getByText("이 창을 닫으면 토큰을 다시 볼 수 없어요")
    ).toBeInTheDocument();
  });

  it("폐기를 확인하면 해당 uuid 로 호출하고 행이 사라진다", async () => {
    const user = userEvent.setup();
    mockRevoke.mockResolvedValueOnce({ success: true, data: undefined });

    render(<ApiTokenSettingsCard initialTokens={[token]} />);

    await user.click(screen.getByRole("button", { name: "폐기" }));
    expect(
      screen.getByText("이 토큰을 쓰는 연동이 바로 끊겨요")
    ).toBeInTheDocument();
    const buttons = screen.getAllByRole("button", { name: "폐기" });
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(mockRevoke).toHaveBeenCalledWith("token-1");
    });
    await waitFor(() => {
      expect(screen.queryByText("노트북 에이전트")).not.toBeInTheDocument();
    });
  });
});
