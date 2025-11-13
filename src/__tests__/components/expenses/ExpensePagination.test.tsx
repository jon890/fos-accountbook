/**
 * ExpensePagination 컴포넌트 테스트
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpensePagination } from "@/components/expenses/list/ExpensePagination";
import { useRouter, useSearchParams } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

describe("ExpensePagination", () => {
  const defaultPagination = {
    page: 2,
    limit: 25,
    total: 100,
    totalPages: 4,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as ReturnType<typeof useRouter>);

    // 기본 searchParams 모킹 (빈 쿼리스트링)
    mockUseSearchParams.mockReturnValue({
      toString: () => "",
      get: jest.fn(),
      getAll: jest.fn(),
      has: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
      entries: jest.fn(),
      forEach: jest.fn(),
      sort: jest.fn(),
      size: 0,
    } as unknown as ReturnType<typeof useSearchParams>);
  });

  describe("렌더링", () => {
    it("totalPages가 1 이하이면 렌더링되지 않는다", () => {
      const { container } = render(
        <ExpensePagination
          pagination={{
            ...defaultPagination,
            totalPages: 1,
          }}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("totalPages가 2 이상이면 렌더링된다", () => {
      render(<ExpensePagination pagination={defaultPagination} />);

      expect(screen.getByText("이전")).toBeInTheDocument();
      expect(screen.getByText("다음")).toBeInTheDocument();
      expect(screen.getByText("2 / 4")).toBeInTheDocument();
    });

    it("현재 페이지와 전체 페이지 수가 올바르게 표시된다", () => {
      render(
        <ExpensePagination
          pagination={{
            ...defaultPagination,
            page: 3,
            totalPages: 5,
          }}
        />
      );

      expect(screen.getByText("3 / 5")).toBeInTheDocument();
    });
  });

  describe("버튼 상태", () => {
    it("첫 페이지에서 이전 버튼이 비활성화된다", () => {
      render(
        <ExpensePagination
          pagination={{
            ...defaultPagination,
            page: 1,
          }}
        />
      );

      const prevButton = screen.getByRole("button", { name: "이전" });
      expect(prevButton).toBeDisabled();
    });

    it("마지막 페이지에서 다음 버튼이 비활성화된다", () => {
      render(
        <ExpensePagination
          pagination={{
            ...defaultPagination,
            page: 4,
            totalPages: 4,
          }}
        />
      );

      const nextButton = screen.getByRole("button", { name: "다음" });
      expect(nextButton).toBeDisabled();
    });

    it("중간 페이지에서는 두 버튼 모두 활성화된다", () => {
      render(<ExpensePagination pagination={defaultPagination} />);

      const prevButton = screen.getByRole("button", { name: "이전" });
      const nextButton = screen.getByRole("button", { name: "다음" });

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("페이지네이션 동작", () => {
    it("다음 버튼 클릭 시 다음 페이지로 이동한다", async () => {
      const user = userEvent.setup();
      render(<ExpensePagination pagination={defaultPagination} />);

      const nextButton = screen.getByRole("button", { name: "다음" });
      await user.click(nextButton);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/transactions?page=3&tab=expenses");
    });

    it("이전 버튼 클릭 시 이전 페이지로 이동한다", async () => {
      const user = userEvent.setup();
      render(<ExpensePagination pagination={defaultPagination} />);

      const prevButton = screen.getByRole("button", { name: "이전" });
      await user.click(prevButton);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/transactions?page=1&tab=expenses");
    });

    it("기존 searchParams가 유지되면서 page만 변경된다", async () => {
      const user = userEvent.setup();
      // 기존 쿼리 파라미터가 있는 경우
      mockUseSearchParams.mockReturnValue({
        toString: () => "categoryId=cat-123&startDate=2024-01-01",
        get: jest.fn(),
        getAll: jest.fn(),
        has: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        entries: jest.fn(),
        forEach: jest.fn(),
        sort: jest.fn(),
        size: 0,
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ExpensePagination pagination={defaultPagination} />);

      const nextButton = screen.getByRole("button", { name: "다음" });
      await user.click(nextButton);

      expect(mockPush).toHaveBeenCalledTimes(1);
      // 기존 파라미터가 유지되고 page와 tab이 추가됨
      expect(mockPush).toHaveBeenCalledWith(
        "/transactions?categoryId=cat-123&startDate=2024-01-01&page=3&tab=expenses"
      );
    });

    it("tab 파라미터가 항상 expenses로 설정된다", async () => {
      const user = userEvent.setup();
      // 다른 tab 값이 있는 경우
      mockUseSearchParams.mockReturnValue({
        toString: () => "tab=incomes",
        get: jest.fn(),
        getAll: jest.fn(),
        has: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        entries: jest.fn(),
        forEach: jest.fn(),
        sort: jest.fn(),
        size: 0,
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ExpensePagination pagination={defaultPagination} />);

      const nextButton = screen.getByRole("button", { name: "다음" });
      await user.click(nextButton);

      expect(mockPush).toHaveBeenCalledTimes(1);
      // tab이 expenses로 덮어씌워짐
      expect(mockPush).toHaveBeenCalledWith("/transactions?tab=expenses&page=3");
    });

    it("경로가 /transactions로 설정된다", async () => {
      const user = userEvent.setup();
      render(<ExpensePagination pagination={defaultPagination} />);

      const nextButton = screen.getByRole("button", { name: "다음" });
      await user.click(nextButton);

      expect(mockPush).toHaveBeenCalledTimes(1);
      const calledUrl = mockPush.mock.calls[0][0];
      expect(calledUrl).toMatch(/^\/transactions\?/);
    });
  });

  describe("엣지 케이스", () => {
    it("totalPages가 0이면 렌더링되지 않는다", () => {
      const { container } = render(
        <ExpensePagination
          pagination={{
            ...defaultPagination,
            totalPages: 0,
          }}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("page가 1이고 totalPages가 2일 때 다음 버튼만 활성화된다", () => {
      render(
        <ExpensePagination
          pagination={{
            ...defaultPagination,
            page: 1,
            totalPages: 2,
          }}
        />
      );

      const prevButton = screen.getByRole("button", { name: "이전" });
      const nextButton = screen.getByRole("button", { name: "다음" });

      expect(prevButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it("page가 totalPages와 같을 때 다음 버튼이 비활성화된다", () => {
      render(
        <ExpensePagination
          pagination={{
            ...defaultPagination,
            page: 4,
            totalPages: 4,
          }}
        />
      );

      const nextButton = screen.getByRole("button", { name: "다음" });
      expect(nextButton).toBeDisabled();
    });
  });
});

