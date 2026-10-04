import MenuPage from "@/app/(authenticated)/menu/page";
import { getFamiliesAction } from "@/actions/family/get-families-action";
import { auth } from "@/lib/server/auth";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import type { Family } from "@/types/family";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
jest.mock("@/lib/client/navigation", () => ({
  useAppRouter: () => ({ push: mockPush }),
}));
jest.mock("@/lib/server/auth", () => ({ auth: jest.fn() }));
jest.mock("@/actions/family/get-families-action", () => ({ getFamiliesAction: jest.fn() }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("@/components/families/FamilySelectorList", () => ({
  FamilySelectorList: ({
    families,
    selectedFamilyUuid,
    onSelected,
  }: {
    families: Family[];
    selectedFamilyUuid: string;
    onSelected: () => void;
  }) => (
    <div>
      <span>선택:{selectedFamilyUuid}</span>
      {families.map((family) => (
        <button key={family.uuid} onClick={onSelected}>
          {family.name} 선택
        </button>
      ))}
    </div>
  ),
}));
jest.mock("@/components/families/InviteFamilyDialog", () => ({
  InviteFamilyDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="가족 초대" /> : null,
}));

const family: Family = {
  uuid: "family-1",
  name: "우리 가족",
  monthlyBudget: 0,
  createdAt: "",
  updatedAt: "",
  memberCount: 1,
  expenseCount: 0,
  categoryCount: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  (auth as jest.Mock).mockResolvedValue({
    user: { name: "홍길동", profile: { defaultFamilyUuid: family.uuid } },
  });
  jest.mocked(getFamiliesAction).mockResolvedValue({ success: true, data: [family] });
});

it("가족과 사용자 이름 및 여섯 주요 화면 링크를 표시한다", async () => {
  render(await MenuPage());
  expect(screen.getByText("우리 가족")).toBeInTheDocument();
  expect(screen.getByText("홍길동님")).toBeInTheDocument();
  const links = [
    ["카테고리", "/categories"],
    ["예산", "/budget"],
    ["고정지출", "/transactions?tab=recurring"],
    ["할부", "/transactions?tab=installments"],
    ["알림", "/notifications"],
    ["설정", "/settings"],
  ];

  for (const [name, href] of links) {
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
  }
  expect(screen.queryByRole("link", { name: "가족 설정" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "가족 전환" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "구성원 초대" })).toBeInTheDocument();
});

it("가족 전환 Sheet에 목록과 선택 가족을 전달하고 선택 후 닫는다", async () => {
  render(await MenuPage());
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "가족 전환" }));
  expect(await screen.findByRole("dialog")).toHaveTextContent("선택:family-1");
  await user.click(screen.getByRole("button", { name: "우리 가족 선택" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("구성원 초대를 누르면 기존 초대 다이얼로그를 연다", async () => {
  render(await MenuPage());
  await userEvent.setup().click(screen.getByRole("button", { name: "구성원 초대" }));
  expect(screen.getByRole("dialog", { name: "가족 초대" })).toBeInTheDocument();
});

it.each(["C004", "C001", "F003"] as const)("서버 일반 오류 %s는 오류 화면으로 전달한다", async (code) => {
  jest.mocked(getFamiliesAction).mockResolvedValue({ success: false, error: { code, message: "조회 실패" } });
  await expect(MenuPage()).rejects.toThrow("조회 실패");
  expect(redirect).not.toHaveBeenCalled();
});

it.each(["A001", "A002"] as const)("서버 인증 오류 %s는 로그인으로 보낸다", async (code) => {
  jest.mocked(getFamiliesAction).mockResolvedValue({ success: false, error: { code, message: "세션 만료" } });
  await expect(MenuPage()).rejects.toThrow("redirect:/auth/signin?error=auth");
});

it.each(["C004", "C001", "F003"] as const)("가족 Sheet 조회의 일반 오류 %s는 토스트로 알린다", async (code) => {
  render(await MenuPage());
  jest.mocked(getFamiliesAction).mockResolvedValue({ success: false, error: { code, message: "조회 실패" } });
  await userEvent.setup().click(screen.getByRole("button", { name: "가족 전환" }));
  expect(toast.error).toHaveBeenCalledWith("조회 실패");
  expect(mockPush).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it.each(["A001", "A002"] as const)("가족 Sheet 조회의 인증 오류 %s는 로그인으로 보낸다", async (code) => {
  render(await MenuPage());
  jest.mocked(getFamiliesAction).mockResolvedValue({ success: false, error: { code, message: "세션 만료" } });
  await userEvent.setup().click(screen.getByRole("button", { name: "가족 전환" }));
  expect(mockPush).toHaveBeenCalledWith(`/auth/signin?error=auth&message=${encodeURIComponent("세션 만료")}`);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("가족 목록 호출 예외를 알리고 다시 시도할 수 있다", async () => {
  render(await MenuPage());
  jest.mocked(getFamiliesAction).mockRejectedValueOnce(new Error("연결 끊김"));
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "가족 전환" }));
  expect(toast.error).toHaveBeenCalledWith("가족 목록을 불러오지 못했습니다.");
  await user.click(screen.getByRole("button", { name: "가족 전환" }));
  expect(await screen.findByRole("dialog")).toBeInTheDocument();
});

it("빈 가족 목록에서 선택 화면으로 이동한다", async () => {
  jest.mocked(getFamiliesAction).mockResolvedValue({ success: true, data: [] });
  await expect(MenuPage()).rejects.toThrow("redirect:/families/select");
});

it("세션이 없으면 로그인으로 이동한다", async () => {
  (auth as jest.Mock).mockResolvedValue(null);
  await expect(MenuPage()).rejects.toThrow("redirect:/auth/signin");
});

it("선택 가족이 없으면 생성 화면으로 이동한다", async () => {
  (auth as jest.Mock).mockResolvedValue({ user: { name: "홍길동" } });
  await expect(MenuPage()).rejects.toThrow("redirect:/families/create");
});
