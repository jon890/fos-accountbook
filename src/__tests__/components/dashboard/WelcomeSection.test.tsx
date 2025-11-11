/**
 * WelcomeSection 컴포넌트 테스트
 *
 * 테스트 범위:
 * - 기본 렌더링
 * - 사용자 이름 표시
 * - 가족 이름 표시/숨김
 * - 모바일 최적화 (텍스트 크기)
 */

import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { render, screen } from "@testing-library/react";

describe("WelcomeSection", () => {
  it("사용자 이름을 표시한다", () => {
    // Given & When
    render(<WelcomeSection userName="홍길동" />);

    // Then
    expect(screen.getByText(/안녕하세요, 홍길동님!/)).toBeInTheDocument();
  });

  it("이름에서 첫 번째 단어만 사용한다", () => {
    // Given & When
    render(<WelcomeSection userName="홍길동 님" />);

    // Then
    expect(screen.getByText(/안녕하세요, 홍길동님!/)).toBeInTheDocument();
  });

  it("사용자 이름이 없으면 '사용자'를 표시한다", () => {
    // Given & When
    render(<WelcomeSection />);

    // Then
    expect(screen.getByText(/안녕하세요, 사용자님!/)).toBeInTheDocument();
  });

  it("가족 이름이 있을 때 가족 정보를 표시한다", () => {
    // Given & When
    render(<WelcomeSection userName="홍길동" familyName="홍길동" />);

    // Then
    expect(
      screen.getByText(/홍길동님 가족이 함께 관리해요/)
    ).toBeInTheDocument();
  });

  it("가족 이름이 없을 때 가족 정보를 표시하지 않는다", () => {
    // Given & When
    render(<WelcomeSection userName="홍길동" />);

    // Then
    expect(screen.queryByText(/가족이 함께 관리해요/)).not.toBeInTheDocument();
  });

  it("가족 이름이 빈 문자열일 때 가족 정보를 표시하지 않는다", () => {
    // Given & When
    render(<WelcomeSection userName="홍길동" familyName="" />);

    // Then
    expect(screen.queryByText(/가족이 함께 관리해요/)).not.toBeInTheDocument();
  });

  it("가족 이름이 null일 때 가족 정보를 표시하지 않는다", () => {
    // Given & When
    render(<WelcomeSection userName="홍길동" familyName={null} />);

    // Then
    expect(screen.queryByText(/가족이 함께 관리해요/)).not.toBeInTheDocument();
  });

  it("메인 메시지를 표시한다", () => {
    // Given & When
    render(<WelcomeSection userName="홍길동" />);

    // Then
    expect(
      screen.getByText("오늘도 알뜰한 가계 관리를 시작해보세요.")
    ).toBeInTheDocument();
  });

  it("가족 이름에 모바일 최적화 클래스가 적용되어 있다", () => {
    // Given & When
    render(<WelcomeSection userName="홍길동" familyName="홍길동" />);

    // Then
    const familyText = screen.getByText(/홍길동님 가족이 함께 관리해요/);
    expect(familyText).toHaveClass("text-xs");
    expect(familyText).toHaveClass("md:text-sm");
  });
});
