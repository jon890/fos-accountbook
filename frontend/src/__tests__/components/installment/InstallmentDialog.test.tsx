import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { createInstallmentAction } from "@/actions/installment/create-installment-action";
import { deleteInstallmentAction } from "@/actions/installment/delete-installment-action";
import { updateInstallmentAction } from "@/actions/installment/update-installment-action";
import { InstallmentDialog } from "@/components/installment/InstallmentDialog";
import { ErrorCode } from "@/lib/errors/error-code";
import type { Installment } from "@/types/installment";

const mockRefresh = jest.fn();

jest.mock("@/actions/installment/create-installment-action", () => ({
  createInstallmentAction: jest.fn(),
}));
jest.mock("@/actions/installment/update-installment-action", () => ({
  updateInstallmentAction: jest.fn(),
}));
jest.mock("@/actions/installment/delete-installment-action", () => ({
  deleteInstallmentAction: jest.fn(),
}));
jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: jest.fn().mockReturnValue(true),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/client/navigation", () => ({
  useAppRouter: () => ({ refresh: mockRefresh }),
}));

const existing: Installment = {
  uuid: "00000000-0000-4000-8000-000000000001",
  userUuid: "user-1",
  name: "노트북",
  totalAmount: 1000000,
  installmentMonths: 12,
  startMonth: "2026-09",
  endMonth: "2027-08",
  memo: null,
  monthlyAmount: 83333,
  firstMonthAmount: 83337,
  currentRound: 2,
  thisMonthAmount: 83333,
  remainingAmount: 833330,
  progress: "IN_PROGRESS",
  createdAt: "2026-09-01T00:00:00",
  updatedAt: "2026-09-01T00:00:00",
};

const failure = { success: false as const, error: { code: ErrorCode.INVALID_INPUT, message: "저장할 수 없어요" } };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("InstallmentDialog", () => {
  it("등록: 미리보기를 보이고 입력값으로 등록 액션을 부른다", async () => {
    const onOpenChange = jest.fn();
    jest
      .mocked(createInstallmentAction)
      .mockResolvedValue({ success: true, data: existing });
    const user = userEvent.setup();
    render(
      <InstallmentDialog
        open
        onOpenChange={onOpenChange}
        defaultStartMonth="2026-10"
      />,
    );

    await user.type(screen.getByLabelText("이름"), "노트북");
    await user.type(screen.getByLabelText("총 금액 (원)"), "1000000");
    await user.type(screen.getByLabelText("할부 개월"), "12");

    expect(screen.getByText("월 ₩83,333 · 첫 달 ₩83,337")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(createInstallmentAction).toHaveBeenCalledWith({
        name: "노트북",
        totalAmount: 1000000,
        installmentMonths: 12,
        startMonth: "2026-10",
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("할부를 추가했어요");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("등록 실패: 문구로 토스트와 refresh 를 부르고 창을 연 채로 둔다", async () => {
    const onOpenChange = jest.fn();
    jest.mocked(createInstallmentAction).mockResolvedValue(failure);
    const user = userEvent.setup();
    render(
      <InstallmentDialog
        open
        onOpenChange={onOpenChange}
        defaultStartMonth="2026-10"
      />,
    );

    await user.type(screen.getByLabelText("이름"), "노트북");
    await user.type(screen.getByLabelText("총 금액 (원)"), "1000000");
    await user.type(screen.getByLabelText("할부 개월"), "12");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("저장할 수 없어요"),
    );
    expect(mockRefresh).toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByText("할부 추가", { selector: "h2" })).toBeInTheDocument();
  });

  it("수정 실패도 토스트와 refresh 를 부르고 창을 연 채로 둔다", async () => {
    const onOpenChange = jest.fn();
    jest.mocked(updateInstallmentAction).mockResolvedValue(failure);
    const user = userEvent.setup();
    render(
      <InstallmentDialog
        open
        onOpenChange={onOpenChange}
        installment={existing}
        defaultStartMonth="2026-10"
      />,
    );

    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("저장할 수 없어요"),
    );
    expect(updateInstallmentAction).toHaveBeenCalledWith(existing.uuid, {
      name: "노트북",
      totalAmount: 1000000,
      installmentMonths: 12,
      startMonth: "2026-09",
    });
    expect(mockRefresh).toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("수정: 기존 값이 채워져 있고 삭제를 확인하면 삭제 액션을 부른다", async () => {
    const onOpenChange = jest.fn();
    jest
      .mocked(deleteInstallmentAction)
      .mockResolvedValue({ success: true, data: undefined });
    const user = userEvent.setup();
    render(
      <InstallmentDialog
        open
        onOpenChange={onOpenChange}
        installment={existing}
        defaultStartMonth="2026-10"
      />,
    );

    expect(screen.getByLabelText("이름")).toHaveValue("노트북");
    expect(screen.getByLabelText("총 금액 (원)")).toHaveValue("1000000");
    expect(screen.getByLabelText("할부 개월")).toHaveValue("12");
    expect(screen.getByLabelText("첫 결제 월")).toHaveValue("2026-09");

    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(screen.getByText("할부를 삭제할까요?")).toBeInTheDocument();
    const confirm = screen.getAllByRole("button", { name: "삭제" });
    await user.click(confirm[confirm.length - 1]);

    await waitFor(() =>
      expect(deleteInstallmentAction).toHaveBeenCalledWith(existing.uuid),
    );
    expect(toast.success).toHaveBeenCalledWith("할부를 삭제했어요");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("삭제 실패: 문구로 토스트와 refresh 를 부르고 창을 닫는다", async () => {
    const onOpenChange = jest.fn();
    jest.mocked(deleteInstallmentAction).mockResolvedValue(failure);
    const user = userEvent.setup();
    render(
      <InstallmentDialog
        open
        onOpenChange={onOpenChange}
        installment={existing}
        defaultStartMonth="2026-10"
      />,
    );

    await user.click(screen.getByRole("button", { name: "삭제" }));
    const confirm = screen.getAllByRole("button", { name: "삭제" });
    await user.click(confirm[confirm.length - 1]);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(failure.error.message),
    );
    expect(mockRefresh).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("필수 값이 비면 저장 버튼이 비활성이다", async () => {
    const user = userEvent.setup();
    render(
      <InstallmentDialog
        open
        onOpenChange={jest.fn()}
        defaultStartMonth="2026-10"
      />,
    );

    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();

    await user.type(screen.getByLabelText("이름"), "노트북");
    await user.type(screen.getByLabelText("총 금액 (원)"), "1000000");
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();

    await user.type(screen.getByLabelText("할부 개월"), "12");
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
  });
});
