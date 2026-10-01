import { act, renderHook } from "@testing-library/react";
import { useTransactionSheetViewport } from "@/hooks/useTransactionSheetViewport";

describe("useTransactionSheetViewport", () => {
  const originalViewport = Object.getOwnPropertyDescriptor(window, "visualViewport");

  afterEach(() => {
    if (originalViewport) {
      Object.defineProperty(window, "visualViewport", originalViewport);
    } else {
      Reflect.deleteProperty(window, "visualViewport");
    }
  });

  function mockViewport() {
    const target = new EventTarget();
    const viewport = Object.assign(target, { height: 700, offsetTop: 0 });
    Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
    return viewport;
  }

  it("키보드 resize와 scroll에 맞춰 높이와 위치를 갱신하고 닫을 때 구독을 해제한다", () => {
    const viewport = mockViewport();
    const removeListener = jest.spyOn(viewport, "removeEventListener");
    const { result, rerender } = renderHook(
      ({ open }) => useTransactionSheetViewport(open, false),
      { initialProps: { open: true } },
    );
    expect(result.current).toEqual({ height: 700, top: 0, bottom: "auto" });
    act(() => {
      viewport.height = 380;
      viewport.offsetTop = 24;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toEqual({ height: 380, top: 24, bottom: "auto" });
    act(() => {
      viewport.offsetTop = 40;
      viewport.dispatchEvent(new Event("scroll"));
    });
    expect(result.current?.top).toBe(40);
    rerender({ open: false });
    expect(result.current).toBeUndefined();
    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  it("unmount 시 viewport 이벤트를 해제한다", () => {
    const viewport = mockViewport();
    const removeListener = jest.spyOn(viewport, "removeEventListener");
    const { unmount } = renderHook(() => useTransactionSheetViewport(true, false));
    unmount();
    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  it("API가 없거나 데스크톱이면 기존 CSS 높이를 사용한다", () => {
    Object.defineProperty(window, "visualViewport", { configurable: true, value: undefined });
    const { result, rerender } = renderHook(
      ({ desktop }) => useTransactionSheetViewport(true, desktop),
      { initialProps: { desktop: false } },
    );
    expect(result.current).toBeUndefined();
    mockViewport();
    rerender({ desktop: true });
    expect(result.current).toBeUndefined();
  });
});
