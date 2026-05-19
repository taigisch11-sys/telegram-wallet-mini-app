import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  it("lets coach add a student from the main screen", async () => {
    mockFetch();
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Тренер" }));
    fireEvent.change(screen.getByLabelText("Имя ученика"), { target: { value: "Денис" } });
    fireEvent.change(screen.getByLabelText("Цель ученика"), { target: { value: "Сила" } });
    fireEvent.click(screen.getByRole("button", { name: /Добавить/i }));

    expect(await screen.findByText("Денис")).toBeInTheDocument();
  });

  it("has demo toggle, training guide and a back button in education", async () => {
    mockFetch();
    render(<App />);

    fireEvent.click(await screen.findByLabelText("Открыть меню"));
    expect(screen.getByText("Демо-режим")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Открыть обучение"));
    expect(screen.getByText(/шаг 1/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Назад" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Далее" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Назад" })).not.toBeDisabled());
  });

  it("supports chat and balance top up flows", async () => {
    mockFetch();
    render(<App />);

    fireEvent.click(await screen.findByText("Чат"));
    fireEvent.change(screen.getByLabelText("Сообщение"), { target: { value: "Нужна замена" } });
    fireEvent.click(screen.getByLabelText("Отправить сообщение"));
    expect(await screen.findByText("Нужна замена")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Баланс"));
    fireEvent.click(screen.getByText("8 занятий"));
    expect(screen.getByText(/Создать заявку на пополнение.*16/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить" }));
    expect(await screen.findByText("Баланс пополнен в демо-режиме")).toBeInTheDocument();
  });
});
