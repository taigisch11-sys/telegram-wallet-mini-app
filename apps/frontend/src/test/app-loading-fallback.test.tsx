import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyState } from "../mock/state";

const refresh = vi.fn();

describe("App loading fallback", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("offers local mode and demo when the initial load takes too long", async () => {
    vi.useFakeTimers();
    vi.resetModules();
    vi.doMock("../hooks/use-state", () => ({
      useWalletState: () => ({
        data: emptyState,
        loading: true,
        error: null,
        refresh,
        remoteAvailable: false,
        setData: vi.fn()
      })
    }));

    const { App } = await import("../app/App");

    render(<App />);
    expect(screen.getByText("Подключаю ваш финансовый контур.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4200);
    });

    expect(screen.getByRole("button", { name: "Продолжить локально" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Открыть демо" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Продолжить локально" }));
    expect(screen.getByText("PRIVATE OPERATING MODE")).toBeInTheDocument();
  }, 15000);
});
