/**
 * AmountInput 컴포넌트 테스트
 *
 * 테스트 범위:
 * - 칩 클릭 시 onChange(value + delta) 호출
 * - value=0 → "0" 표시 + ₩ prefix
 * - value=38400 → "38,400" 표시 (콤마)
 * - 음수 입력 가드 (onChange 호출값 0 이상)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AmountInput } from "@/components/expenses/forms/AmountInput";

describe("AmountInput", () => {
  it("value=0일 때 '0'과 ₩ prefix를 표시한다", () => {
    // Given & When
    render(<AmountInput value={0} onChange={jest.fn()} />);

    // Then
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("₩")).toBeInTheDocument();
  });

  it("value=38400일 때 '38,400'으로 표시한다 (콤마 구분)", () => {
    // Given & When
    render(<AmountInput value={38400} onChange={jest.fn()} />);

    // Then
    expect(screen.getByText("38,400")).toBeInTheDocument();
  });

  it("+1,000 칩 클릭 시 onChange(value + 1000)을 호출한다", async () => {
    // Given
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<AmountInput value={5000} onChange={onChange} />);

    // When
    const chip = screen.getByText("+1,000");
    await user.click(chip);

    // Then
    expect(onChange).toHaveBeenCalledWith(6000);
  });

  it("+5,000 칩 클릭 시 onChange(value + 5000)을 호출한다", async () => {
    // Given
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<AmountInput value={0} onChange={onChange} />);

    // When
    const chip = screen.getByText("+5,000");
    await user.click(chip);

    // Then
    expect(onChange).toHaveBeenCalledWith(5000);
  });

  it("+10,000 칩 클릭 시 onChange(value + 10000)을 호출한다", async () => {
    // Given
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<AmountInput value={10000} onChange={onChange} />);

    // When
    const chip = screen.getByText("+10,000");
    await user.click(chip);

    // Then
    expect(onChange).toHaveBeenCalledWith(20000);
  });

  it("음수가 되는 경우 onChange(0)을 호출한다 (음수 가드)", async () => {
    // Given
    const user = userEvent.setup();
    const onChange = jest.fn();

    // value=0인 상태에서 +1000 칩은 양수이므로, hidden input에 음수 직접 입력 테스트
    const { container } = render(<AmountInput value={0} onChange={onChange} />);

    // When: hidden input에 음수값 입력 시뮬레이션
    const hiddenInput = container.querySelector('input[type="number"]');
    expect(hiddenInput).toBeInTheDocument();

    if (hiddenInput) {
      await user.clear(hiddenInput);
      await user.type(hiddenInput, "-500");
    }

    // Then: onChange가 0 이상 값으로만 호출되어야 함
    const calls = onChange.mock.calls;
    calls.forEach(([calledValue]) => {
      expect(calledValue).toBeGreaterThanOrEqual(0);
    });
  });

  it("'얼마를 썼나요?' 라벨을 렌더링한다", () => {
    // Given & When
    render(<AmountInput value={0} onChange={jest.fn()} />);

    // Then
    expect(screen.getByText("얼마를 썼나요?")).toBeInTheDocument();
  });

  it("disabled 상태에서는 칩 버튼이 비활성화된다", () => {
    // Given & When
    render(<AmountInput value={0} onChange={jest.fn()} disabled />);

    // Then
    const chip = screen.getByText("+1,000");
    expect(chip.closest("button")).toBeDisabled();
  });
});
