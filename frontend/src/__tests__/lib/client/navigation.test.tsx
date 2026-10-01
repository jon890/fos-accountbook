import { NavigationProgressBar } from "@/components/layout/NavigationProgressBar";
import {
  NavigationProgressProvider,
  useAppRouter,
} from "@/lib/client/navigation";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { Suspense, useState } from "react";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
const mockBack = jest.fn();
const mockPrefetch = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
    back: mockBack,
    prefetch: mockPrefetch,
  }),
}));

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  resolved: boolean;
}

function createDeferred(): Deferred {
  let resolvePromise!: () => void;
  const promise = new Promise<void>((next) => {
    resolvePromise = next;
  });

  const deferred: Deferred = {
    promise,
    resolve: () => {
      deferred.resolved = true;
      resolvePromise();
    },
    resolved: false,
  };

  return deferred;
}

function NavigationButton({ href, onError }: { href: string; onError?: () => void }) {
  const router = useAppRouter();

  return (
    <button
      type="button"
      onClick={() => {
        try {
          router.push(href);
        } catch {
          onError?.();
        }
      }}
    >
      {href}
    </button>
  );
}

function DeferredRoute({ pending, deferred }: { pending: boolean; deferred: Deferred }) {
  if (pending && !deferred.resolved) {
    throw deferred.promise;
  }

  return null;
}

function NavigationHarness({
  firstDeferred,
  secondDeferred,
}: {
  firstDeferred: Deferred;
  secondDeferred?: Deferred;
}) {
  const [firstPending, setFirstPending] = useState(false);
  const [secondPending, setSecondPending] = useState(false);

  mockPush.mockImplementation((href: string) => {
    if (href === "/first") {
      setFirstPending(true);
    }

    if (href === "/second") {
      setSecondPending(true);
    }
  });

  return (
    <NavigationProgressProvider>
      <NavigationButton href="/first" />
      {secondDeferred && <NavigationButton href="/second" />}
      <NavigationProgressBar />
      <Suspense fallback={null}>
        <DeferredRoute pending={firstPending} deferred={firstDeferred} />
      </Suspense>
      {secondDeferred && (
        <Suspense fallback={null}>
          <DeferredRoute pending={secondPending} deferred={secondDeferred} />
        </Suspense>
      )}
    </NavigationProgressProvider>
  );
}

describe("useAppRouter와 NavigationProgressBar", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockRefresh.mockReset();
    mockBack.mockReset();
    mockPrefetch.mockReset();
    mockPush.mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("Suspense 전환이 150ms를 넘으면 진행 막대를 보이고 완료하면 숨긴다", async () => {
    const firstDeferred = createDeferred();
    render(<NavigationHarness firstDeferred={firstDeferred} />);

    fireEvent.click(screen.getByRole("button", { name: "/first" }));

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(149);
    });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByRole("progressbar", { name: "화면을 불러오는 중" })).toBeInTheDocument();

    await act(async () => {
      firstDeferred.resolve();
      await firstDeferred.promise;
    });

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("겹친 전환 중 하나가 끝나도 남은 전환의 진행 막대를 유지한다", async () => {
    const firstDeferred = createDeferred();
    const secondDeferred = createDeferred();
    render(
      <NavigationHarness
        firstDeferred={firstDeferred}
        secondDeferred={secondDeferred}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "/first" }));
    fireEvent.click(screen.getByRole("button", { name: "/second" }));

    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    await act(async () => {
      firstDeferred.resolve();
      await firstDeferred.promise;
    });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    await act(async () => {
      secondDeferred.resolve();
      await secondDeferred.promise;
    });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("대기 중인 호출 컴포넌트가 unmount되면 진행 상태를 정리한다", async () => {
    const deferred = createDeferred();

    function UnmountHarness() {
      const [mounted, setMounted] = useState(true);
      const [pending, setPending] = useState(false);
      mockPush.mockImplementation(() => setPending(true));

      return (
        <NavigationProgressProvider>
          <button type="button" onClick={() => setMounted(false)}>
            unmount
          </button>
          {mounted && <NavigationButton href="/first" />}
          <NavigationProgressBar />
          <Suspense fallback={null}>
            <DeferredRoute pending={pending} deferred={deferred} />
          </Suspense>
        </NavigationProgressProvider>
      );
    }

    render(<UnmountHarness />);
    fireEvent.click(screen.getByRole("button", { name: "/first" }));

    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "unmount" }));
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    await act(async () => {
      deferred.resolve();
      await deferred.promise;
    });
  });

  it("즉시 완료와 라우터 예외는 전역 진행 상태를 남기지 않는다", async () => {
    const immediateDeferred = createDeferred();
    render(<NavigationHarness firstDeferred={immediateDeferred} />);

    mockPush.mockImplementation(() => undefined);
    fireEvent.click(screen.getByRole("button", { name: "/first" }));

    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    mockPush.mockImplementation(() => {
      throw new Error("router failed");
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NavigationProgressProvider>
        <NavigationProgressBar />
        {children}
      </NavigationProgressProvider>
    );
    const { result } = renderHook(() => useAppRouter(), { wrapper });

    expect(() => {
      act(() => {
        result.current.push("/failed");
      });
    }).toThrow("router failed");

    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("Provider 없이도 useAppRouter를 호출할 수 있다", () => {
    mockPush.mockImplementation(() => undefined);
    const { result } = renderHook(() => useAppRouter());

    expect(() => {
      act(() => {
        result.current.push("/first");
      });
    }).not.toThrow();
    expect(mockPush).toHaveBeenCalledWith("/first", undefined);
  });
});
