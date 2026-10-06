import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AmountKeypad } from "@/components/expenses/forms/AmountKeypad";

describe("AmountKeypad", () => {
  it("숫자와 영영 키를 붙여 다음 금액을 전달한다", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const { rerender } = render(<AmountKeypad value={1} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "2" }));
    expect(onChange).toHaveBeenCalledWith(12);

    rerender(<AmountKeypad value={12} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "영영" }));
    expect(onChange).toHaveBeenLastCalledWith(1200);
  });

  it("12자리 금액에는 숫자를 더 붙이지 않는다", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const value = 999_999_999_999;
    render(<AmountKeypad value={value} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "0" }));

    expect(onChange).toHaveBeenCalledWith(value);
  });

  it("0 앞에 0을 누적하지 않고 지우기 뒤에도 0을 유지한다", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const { rerender } = render(<AmountKeypad value={0} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "0" }));
    expect(onChange).toHaveBeenLastCalledWith(0);

    rerender(<AmountKeypad value={0} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "지우기" }));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
});
