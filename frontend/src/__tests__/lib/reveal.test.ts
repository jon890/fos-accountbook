import { revealAndFocus } from "@/lib/client/reveal";

describe("날짜 목록 제목 드러내기", () => {
  let heading: HTMLHeadingElement;
  const scrollIntoView = jest.fn();
  const matchMedia = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    heading = document.createElement("h2");
    heading.tabIndex = -1;
    heading.style.scrollMarginTop = "72px";
    heading.style.scrollMarginBottom = "112px";
    heading.scrollIntoView = scrollIntoView;
    document.body.appendChild(heading);
    jest.spyOn(heading, "focus");
    jest.spyOn(heading, "getBoundingClientRect").mockReturnValue({ top: 900, bottom: 920 } as DOMRect);
    jest.replaceProperty(window, "innerHeight", 800);
    Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: matchMedia });
    matchMedia.mockReturnValue({ matches: false });
  });

  afterEach(() => {
    heading.remove();
    jest.restoreAllMocks();
  });

  it("화면 아래에 있는 제목까지 부드럽게 스크롤하고 포커스를 준다", () => {
    revealAndFocus(heading);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "smooth" });
    expect(heading.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(heading);
  });

  it("제목이 다 보이면 스크롤 없이 포커스만 준다", () => {
    jest.mocked(heading.getBoundingClientRect).mockReturnValue({ top: 200, bottom: 220 } as DOMRect);

    revealAndFocus(heading);

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(heading.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it.each([
    { top: 10, bottom: 30 },
    { top: 680, bottom: 700 },
  ])("제목이 헤더나 하단 탭에 가리면 스크롤한다: %o", (rect) => {
    jest.mocked(heading.getBoundingClientRect).mockReturnValue(rect as DOMRect);

    revealAndFocus(heading);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("움직임 줄이기 설정이면 바로 이동한다", () => {
    matchMedia.mockReturnValue({ matches: true });

    revealAndFocus(heading);

    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "auto" });
  });

  it("제목이 없으면 아무것도 하지 않는다", () => {
    revealAndFocus(null);

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(heading.focus).not.toHaveBeenCalled();
    expect(matchMedia).not.toHaveBeenCalled();
  });
});
