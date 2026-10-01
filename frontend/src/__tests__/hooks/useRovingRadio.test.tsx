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

  it("열 수보다 적은 항목에서는 위는 이전, 아래는 다음 항목으로 옮긴다", () => {
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
    expect(onChange).toHaveBeenLastCalledWith("three");
    expect(screen.getByRole("button", { name: "three" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("button", { name: "one" }), { key: "ArrowDown" });
    expect(onChange).toHaveBeenLastCalledWith("two");
  });

  it("마지막 줄이 덜 찬 격자에서 위아래 이동은 같은 열을 지킨다", () => {
    const onChange = jest.fn();
    const values = Array.from({ length: 12 }, (_, index) => `item-${index}`);
    render(<RovingRadioHarness values={values} selectedValue="item-0" onChange={onChange} columns={5} />);

    const press = (name: string, key: string) =>
      fireEvent.keyDown(screen.getByRole("button", { name }), { key });

    // 0 → 5 → 10 → (끝을 넘으면 첫 줄 같은 열) 0
    press("item-0", "ArrowDown");
    expect(onChange).toHaveBeenLastCalledWith("item-5");
    press("item-5", "ArrowDown");
    expect(onChange).toHaveBeenLastCalledWith("item-10");
    press("item-10", "ArrowDown");
    expect(onChange).toHaveBeenLastCalledWith("item-0");

    // 1 에서 위로 가면 같은 열의 가장 아래 칸 11
    press("item-1", "ArrowUp");
    expect(onChange).toHaveBeenLastCalledWith("item-11");
    // 3 에서 위로 가면 마지막 줄에 그 열이 없으니 한 줄 위 8
    press("item-3", "ArrowUp");
    expect(onChange).toHaveBeenLastCalledWith("item-8");
  });
});
