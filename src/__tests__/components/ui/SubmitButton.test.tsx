/**
 * SubmitButton 컴포넌트 테스트
 *
 * 테스트 범위:
 * - 기본 렌더링
 * - 제출 중 상태 (useFormStatus)
 * - disabled 상태
 * - 로딩 텍스트 표시
 */

import { SubmitButton } from "@/components/ui/submit-button";
import { render, screen } from "@testing-library/react";

// useFormStatus를 모킹
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormStatus: jest.fn(),
}));

import { useFormStatus } from "react-dom";
import type { FormStatus } from "react-dom";

const mockedUseFormStatus = useFormStatus as jest.MockedFunction<
  typeof useFormStatus
>;

// Mock FormStatus 데이터
const createMockFormStatus = (
  overrides: Partial<FormStatus> = {}
): FormStatus => ({
  pending: false,
  data: new FormData(),
  method: "POST",
  action: "/test",
  ...overrides,
});

describe("SubmitButton", () => {
  beforeEach(() => {
    // 기본값: pending이 아닌 상태
    mockedUseFormStatus.mockReturnValue(createMockFormStatus());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("기본 버튼을 렌더링한다", () => {
    // Given & When
    render(<SubmitButton>제출하기</SubmitButton>);

    // Then
    const button = screen.getByRole("button", { name: "제출하기" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("pending 상태일 때 버튼이 비활성화된다", () => {
    // Given
    mockedUseFormStatus.mockReturnValue(
      createMockFormStatus({ pending: true })
    );

    // When
    render(<SubmitButton>제출하기</SubmitButton>);

    // Then
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("pending 상태일 때 pendingText를 표시한다", () => {
    // Given
    mockedUseFormStatus.mockReturnValue(
      createMockFormStatus({ pending: true })
    );

    // When
    render(<SubmitButton pendingText="저장 중...">저장하기</SubmitButton>);

    // Then
    expect(screen.getByText("저장 중...")).toBeInTheDocument();
    expect(screen.queryByText("저장하기")).not.toBeInTheDocument();
  });

  it("pending 상태일 때 로딩 아이콘을 표시한다", () => {
    // Given
    mockedUseFormStatus.mockReturnValue(
      createMockFormStatus({ pending: true })
    );

    // When
    const { container } = render(<SubmitButton>제출하기</SubmitButton>);

    // Then
    const loadingIcon = container.querySelector(".animate-spin");
    expect(loadingIcon).toBeInTheDocument();
  });

  it("pendingText가 없으면 기본 텍스트를 표시한다", () => {
    // Given
    mockedUseFormStatus.mockReturnValue(
      createMockFormStatus({ pending: true })
    );

    // When
    render(<SubmitButton>제출하기</SubmitButton>);

    // Then
    expect(screen.getByText("처리 중...")).toBeInTheDocument();
  });

  it("disabled prop이 true면 버튼이 비활성화된다", () => {
    // Given & When
    render(<SubmitButton disabled>제출하기</SubmitButton>);

    // Then
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("pending과 disabled 모두 true면 비활성화된다", () => {
    // Given
    mockedUseFormStatus.mockReturnValue(
      createMockFormStatus({ pending: true })
    );

    // When
    render(<SubmitButton disabled>제출하기</SubmitButton>);

    // Then
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("variant prop을 전달할 수 있다", () => {
    // Given & When
    render(<SubmitButton variant="destructive">삭제하기</SubmitButton>);

    // Then
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("size prop을 전달할 수 있다", () => {
    // Given & When
    render(<SubmitButton size="lg">큰 버튼</SubmitButton>);

    // Then
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
