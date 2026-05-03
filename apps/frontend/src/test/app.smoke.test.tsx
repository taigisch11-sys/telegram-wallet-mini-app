import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("App", () => {
  it("renders bottom navigation", () => {
    render(<App />);
    expect(screen.getAllByText("Финансы").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Графики").length).toBeGreaterThan(0);
  });

  it("uses a finance toolbar instead of duplicated Telegram chrome", () => {
    render(<App />);

    expect(screen.queryByText("Закрыть")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Выбрать период")).toHaveTextContent("Май 2026");
    expect(screen.getByLabelText("Быстро добавить")).toBeInTheDocument();
  });

  it("connects primary wallet actions to real screens", () => {
    render(<App />);

    fireEvent.click(screen.getAllByText("Сверить")[0]);
    expect(screen.getByText("Сохранить остатки")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Финансы")[0]);
    fireEvent.click(screen.getAllByText("План")[0]);
    expect(screen.getByText("Доходы")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Меню"));
    expect(screen.getByRole("heading", { name: "Меню" })).toBeInTheDocument();
  });

  it("does not render duplicate Telegram chrome inside Telegram WebApp", () => {
    window.Telegram = { WebApp: { initData: "query_id=test", ready: () => {}, expand: () => {}, close: () => {}, MainButton: { hide: () => {} } } };

    render(<App />);

    expect(screen.queryByText("Закрыть")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Меню")).toBeInTheDocument();
  });
});
