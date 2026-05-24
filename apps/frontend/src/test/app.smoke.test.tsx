import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("App", () => {
  it("starts with the new welcome screen", () => {
    render(<App />);

    expect(screen.getByText("PERSONAL FINANCE OS")).toBeInTheDocument();
    expect(screen.getByText("Финансы без перегрузки и суеты.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Начать спокойно" })).toBeInTheDocument();
  });

  it("opens the main cabinet with the new bottom navigation", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Начать спокойно" }));

    expect(screen.getByText("PRIVATE OPERATING MODE")).toBeInTheDocument();
    expect(screen.getByLabelText("Дом")).toBeInTheDocument();
    expect(screen.getByLabelText("Контур")).toBeInTheDocument();
    expect(screen.getByLabelText("Аналитика")).toBeInTheDocument();
    expect(screen.getByLabelText("Режим")).toBeInTheDocument();
  });

  it("switches between editorial screens", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Начать спокойно" }));
    fireEvent.click(screen.getByLabelText("Контур"));
    expect(screen.getByText("Контур активов и обязательств")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Аналитика"));
    expect(screen.getByText("Динамика и опорные величины")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Режим"));
    expect(screen.getByText("Режим и окружение")).toBeInTheDocument();
  });

  it("can launch the demo concept from welcome", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Посмотреть концепт" }));

    expect(screen.getByText("Демо-сценарий")).toBeInTheDocument();
    expect(screen.getByText("Свободный контур на сейчас. Это главная сумма, на которую можно опираться без тревоги.")).toBeInTheDocument();
  });
});
