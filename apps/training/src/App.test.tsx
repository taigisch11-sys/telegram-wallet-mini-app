import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";

function mockFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: { message: "offline" } })
    }))
  );
}

describe("training mini app", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens in demo mode and shows the student next action", async () => {
    mockFetch();
    render(<App />);

    expect(await screen.findByText("Что делаем сегодня?")).toBeInTheDocument();
    expect(screen.getByText("Силовая B")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Начать/i })).toBeInTheDocument();
  });

  it("marks workout sets without editing the numeric value manually", async () => {
    mockFetch();
    render(<App />);

    const markButton = await screen.findByRole("button", { name: /Отметить подход Фронтальный присед/i });
    fireEvent.click(markButton);

    expect(screen.getByText("1/4")).toBeInTheDocument();
  });

  it("lets the student enter actual working weight from the workout card", async () => {
    mockFetch();
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /Изменить вес Фронтальный присед/i }));
    fireEvent.change(screen.getByLabelText("Рабочий вес"), { target: { value: "62,5" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить вес" }));

    expect(await screen.findByText("62.5 кг")).toBeInTheDocument();
  });

  it("saves body weight and wellbeing check-in", async () => {
    mockFetch();
    render(<App />);

    fireEvent.change(await screen.findByLabelText("Вес тела"), { target: { value: "81,9" } });
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.change(screen.getByLabelText("Боль или забитость"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Комментарий к самочувствию"), { target: { value: "Сон хороший" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить чек-ин" }));

    expect(await screen.findByText("81.9 кг")).toBeInTheDocument();
    expect(screen.getByText(/энергия 5\/5 · забитость 3\/10/i)).toBeInTheDocument();
  });

  it("lets coach add a student from the main screen", async () => {
    mockFetch();
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Тренер" }));
    fireEvent.change(screen.getByLabelText("Имя ученика"), { target: { value: "Денис" } });
    fireEvent.change(screen.getByLabelText("Цель ученика"), { target: { value: "Сила" } });
    fireEvent.click(screen.getByRole("button", { name: /Добавить/i }));

    expect(await screen.findByText("Денис")).toBeInTheDocument();
  });

  it("shows the trainer admin headquarters only for coach mode", async () => {
    mockFetch();
    render(<App />);

    expect(screen.queryByRole("button", { name: /Штаб/i })).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "Тренер" }));
    fireEvent.click(await screen.findByRole("button", { name: /Штаб/i }));

    expect(await screen.findByText("Пульт тренера")).toBeInTheDocument();
    expect(screen.getByText("Очередь внимания")).toBeInTheDocument();
    expect(screen.getByText("Кому нужен тренер")).toBeInTheDocument();
    expect(screen.getByText("Карточка 360")).toBeInTheDocument();
  });

  it("uses admin quick actions for selected student workflows", async () => {
    mockFetch();
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Тренер" }));
    fireEvent.click(await screen.findByRole("button", { name: /Штаб/i }));

    fireEvent.click(await screen.findByRole("button", { name: "Запросить чек-ин выбранного ученика" }));
    expect(await screen.findByText("Диалог с учеником")).toBeInTheDocument();
    expect(await screen.findByText("Заполни, пожалуйста, чек-ин перед следующей тренировкой.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Штаб/i }));
    fireEvent.click(screen.getByRole("button", { name: "Создать неделю выбранному ученику" }));
    expect(await screen.findByText("Шаблоны и назначения")).toBeInTheDocument();
  });

  it("has demo toggle, training guide and a back button in education", async () => {
    mockFetch();
    render(<App />);

    fireEvent.click(await screen.findByLabelText("Открыть меню"));
    expect(screen.getByText("Демо-режим")).toBeInTheDocument();
    expect(screen.getByText("Бета-статус")).toBeInTheDocument();
    expect(screen.getByText("Что уже работает")).toBeInTheDocument();
    expect(screen.getByText(/В MVP: приглашения учеников/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Создать локальные рабочие данные|Перейти к реальным данным/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Открыть обучение"));
    expect(screen.getByText(/шаг 1/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Назад" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Далее" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Назад" })).not.toBeDisabled());
  });

  it("shows clear empty states for local coach beta setup", async () => {
    localStorage.setItem("training_demo", "false");
    localStorage.setItem("training_role", "coach");
    mockFetch();
    render(<App />);

    expect(await screen.findByText("Пока нет учеников")).toBeInTheDocument();
    expect(screen.getByText(/Добавьте первого ученика ниже/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Пока нет учеников/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Штаб/i }));
    expect(await screen.findByText("Админка ждёт учеников")).toBeInTheDocument();

    const balanceButtons = screen.getAllByRole("button", { name: /Баланс/i });
    fireEvent.click(balanceButtons[balanceButtons.length - 1]);
    expect(await screen.findByText(/Сначала выберите ученика/i)).toBeInTheDocument();
    expect(screen.getByText(/пополнение создаёт заявку/i)).toBeInTheDocument();
  });

  it("supports chat and balance top up flows", async () => {
    mockFetch();
    render(<App />);

    fireEvent.click(await screen.findByText("Чат"));
    fireEvent.change(screen.getByLabelText("Сообщение"), { target: { value: "Нужна замена" } });
    fireEvent.click(screen.getByLabelText("Отправить сообщение"));
    expect(await screen.findByText("Нужна замена")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Баланс"));
    expect(screen.getByText(/пополнение создаёт заявку/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("8 занятий"));
    expect(screen.getByText(/Создать заявку на пополнение.*16/)).toBeInTheDocument();
    expect(screen.getByText(/не реальное списание денег/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить" }));
    expect(await screen.findByText("Заявка на пополнение создана в демо-режиме")).toBeInTheDocument();
  });
});
