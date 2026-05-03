import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../app/App";
import { api } from "../lib/api";

describe("Demo and learning modes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the menu with demo, learning, history, and the user checklist", () => {
    render(<App />);

    fireEvent.click(screen.getByLabelText("Меню"));

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

    fireEvent.click(screen.getByLabelText("Меню"));
    fireEvent.click(screen.getByText("Включить демо"));

    expect(screen.getByText("Демо-режим")).toBeInTheDocument();
    expect(screen.getByText("Основная карта")).toBeInTheDocument();
    expect(screen.getByText("Аренда")).toBeInTheDocument();
  });

  it("keeps demo edits inside demo state without calling the real API", async () => {
    const createAccount = vi.spyOn(api, "createAccount").mockResolvedValue({});

    render(<App />);

    fireEvent.click(screen.getByLabelText("Меню"));
    fireEvent.click(screen.getByText("Включить демо"));
    fireEvent.click(screen.getByLabelText("Счета"));
    fireEvent.change(screen.getByLabelText("Название счёта"), { target: { value: "Тестовый демо-счёт" } });
    fireEvent.change(screen.getByLabelText("Остаток"), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить счёт" }));

    expect(await screen.findByText("Тестовый демо-счёт")).toBeInTheDocument();
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("starts learning mode and guides the user to the next task", () => {
    render(<App />);

    fireEvent.click(screen.getByLabelText("Меню"));
    fireEvent.click(screen.getByText("Включить обучение"));

    expect(screen.getByText("Обучение включено")).toBeInTheDocument();
    expect(screen.getByText("Шаг 1 из 5")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Перейти к счетам"));
    expect(screen.getByText("Сохранить остатки")).toBeInTheDocument();
    expect(screen.getByText("Шаг 2 из 5")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Назад"));
    expect(screen.getByText("Шаг 1 из 5")).toBeInTheDocument();
    expect(screen.getByText("Начните со сверки")).toBeInTheDocument();
  });

  it("restarts the learning route from the final step", () => {
    render(<App />);

    fireEvent.click(screen.getByLabelText("Меню"));
    fireEvent.click(screen.getByText("Включить обучение"));
    fireEvent.click(screen.getByText("Перейти к счетам"));
    fireEvent.click(screen.getByText("Открыть план"));
    fireEvent.click(screen.getByText("Проверить план"));
    fireEvent.click(screen.getByText("На главный экран"));
    expect(screen.getByText("Шаг 5 из 5")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Повторить маршрут"));
    expect(screen.getByText("Шаг 1 из 5")).toBeInTheDocument();
    expect(screen.getByText("Начните со сверки")).toBeInTheDocument();
  });
});
