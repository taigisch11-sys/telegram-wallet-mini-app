import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("Editorial navigation and settings", () => {
  it("can move from welcome to settings and back", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Начать спокойно" }));
    fireEvent.click(screen.getByLabelText("Режим"));
    expect(screen.getByText("Режим и окружение")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Вернуться к приветствию" }));
    expect(screen.getByText("Финансы без перегрузки и суеты.")).toBeInTheDocument();
  });

  it("toggles demo mode from the settings screen", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Начать спокойно" }));
    fireEvent.click(screen.getByLabelText("Режим"));

    fireEvent.click(screen.getByRole("button", { name: "Включить демо" }));
    expect(screen.getByText("Демо-сценарий")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Режим"));
    fireEvent.click(screen.getByRole("button", { name: "Выключить демо" }));
    expect(screen.getByText(/Локальное зеркало|Синхронизировано/)).toBeInTheDocument();
  });
});
