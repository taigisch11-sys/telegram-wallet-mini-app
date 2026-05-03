import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("Demo and learning modes", () => {
  it("opens the menu with demo, learning, history, and the user checklist", () => {
    render(<App />);

    fireEvent.click(screen.getByLabelText("Открыть меню"));

    expect(screen.getByRole("heading", { name: "Меню" })).toBeInTheDocument();
    expect(screen.getByText("Демо-режим")).toBeInTheDocument();
    expect(screen.getByText("Режим обучения")).toBeInTheDocument();
    expect(screen.getByText("Чек-лист функций")).toBeInTheDocument();
    expect(screen.getByText("Чек-лист показателей")).toBeInTheDocument();
    expect(screen.getByText("Сверка остатков по счетам и долгам")).toBeInTheDocument();
    expect(screen.getByText("Покрытие ближайших обязательств")).toBeInTheDocument();
  });

  it("starts a visual demo with realistic sample finance data", () => {
    render(<App />);

    fireEvent.click(screen.getByLabelText("Открыть меню"));
    fireEvent.click(screen.getByText("Включить демо"));

    expect(screen.getByText("Демо-режим")).toBeInTheDocument();
    expect(screen.getByText("Основная карта")).toBeInTheDocument();
    expect(screen.getByText("Аренда")).toBeInTheDocument();
  });

  it("starts learning mode and guides the user to the next task", () => {
    render(<App />);

    fireEvent.click(screen.getByLabelText("Открыть меню"));
    fireEvent.click(screen.getByText("Включить обучение"));

    expect(screen.getByText("Обучение включено")).toBeInTheDocument();
    expect(screen.getByText("Шаг 1 из 5")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Перейти к счетам"));
    expect(screen.getByText("Сохранить остатки")).toBeInTheDocument();
  });
});
