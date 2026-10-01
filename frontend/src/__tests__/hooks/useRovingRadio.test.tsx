import { fireEvent, render, screen } from "@testing-library/react";
import { useRovingRadio } from "@/hooks/useRovingRadio";

interface HarnessProps {
  values: string[];
  selectedValue: string | null;
  onChange: (value: string) => void;
  columns: number;
  disabled?: boolean;
}

function RovingRadioHarness(props: HarnessProps) {
  const { getItemProps } = useRovingRadio(props);

  return (
    <div>
      {props.values.map((value) => (
        <button key={value} type="button" {...getItemProps(value)}>
          {value}
        </button>
      ))}
    </div>
  );
}

describe("useRovingRadio", () => {
  it("선택된 항목만 Tab 정지점으로 둔다", () => {
    render(
      <RovingRadioHarness
        values={["one", "two", "three"]}
        selectedValue="two"
        onChange={() => {}}
        columns={2}
      />,
    );

    expect(screen.getByRole("button", { name: "one" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: "two" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: "three" })).toHaveAttribute("tabindex", "-1");
  });

  it("없는 선택값에서는 첫 항목만 Tab 정지점으로 둔다", () => {
    render(
      <RovingRadioHarness
        values={["one", "two"]}
        selectedValue="missing"
        onChange={() => {}}
        columns={2}
      />,
    );

    expect(screen.getByRole("button", { name: "one" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: "two" })).toHaveAttribute("tabindex", "-1");
  });

  it("방향키와 Home, End로 이동한 항목을 선택하고 포커스한다", () => {
    const onChange = jest.fn();
    render(
      <RovingRadioHarness
        values={["one", "two", "three", "four", "five", "six"]}
        selectedValue="one"
        onChange={onChange}
        columns={3}
      />,
    );

    const one = screen.getByRole("button", { name: "one" });
    const two = screen.getByRole("button", { name: "two" });
    const four = screen.getByRole("button", { name: "four" });
    const six = screen.getByRole("button", { name: "six" });

    one.focus();
    fireEvent.keyDown(one, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("two");
    expect(two).toHaveFocus();

    fireEvent.keyDown(two, { key: "ArrowDown" });
    expect(onChange).toHaveBeenLastCalledWith("five");

    fireEvent.keyDown(four, { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith("one");

    fireEvent.keyDown(one, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith("six");
    expect(six).toHaveFocus();

    fireEvent.keyDown(six, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith("one");
    expect(one).toHaveFocus();
  });

  it("빈 목록과 비활성 상태에서는 이동하지 않는다", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <RovingRadioHarness values={[]} selectedValue={null} onChange={onChange} columns={2} />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <RovingRadioHarness
        values={["one", "two"]}
        selectedValue="one"
        onChange={onChange}
        columns={2}
        disabled
      />,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "one" }), { key: "ArrowRight" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("열 수보다 적은 항목에서도 위 방향키로 목록 안의 항목을 선택한다", () => {
    const onChange = jest.fn();
    render(
      <RovingRadioHarness
        values={["one", "two", "three"]}
        selectedValue="one"
        onChange={onChange}
        columns={5}
      />,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "one" }), { key: "ArrowUp" });

    expect(onChange).toHaveBeenCalledWith("two");
    expect(screen.getByRole("button", { name: "two" })).toHaveFocus();
  });
});
