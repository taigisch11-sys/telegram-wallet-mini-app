import { describe, expect, it } from "vitest";
import { buildDailyNotification } from "./notifications";

describe("Telegram daily notification planning", () => {
  it("builds a stable no-shifts key for one admin and day", () => {
    const notification = buildDailyNotification("admin_1", "7001", {
      status: "no_shifts",
      todayDate: "2026-05-20",
      tomorrowDate: "2026-05-21",
      headline: "Вы пока не записаны на смены",
      body: "Сегодня есть 2 открытые смены.",
      primaryAction: "Посмотреть смены"
    });

    expect(notification).toMatchObject({
      key: "no_shifts:2026-05-20:admin_1",
      type: "no_shifts",
      adminId: "admin_1",
      telegramUserId: "7001",
      assignmentId: "",
      shiftId: "",
      status: "planned"
    });
    expect(notification?.message).toContain("Вы пока не записаны");
  });

  it("uses tomorrow assignment id in the reminder key when a shift is already assigned", () => {
    const notification = buildDailyNotification("admin_1", "7001", {
      status: "tomorrow_shift",
      todayDate: "2026-05-20",
      tomorrowDate: "2026-05-21",
      nextAssignmentId: "assign_1",
      nextShiftId: "shift_1",
      headline: "Завтра смена",
      body: "ЦСМ-2, 09:00-15:00.",
      primaryAction: "Открыть смену"
    });

    expect(notification).toMatchObject({
      key: "tomorrow_shift:2026-05-21:admin_1:assign_1",
      type: "tomorrow_shift",
      assignmentId: "assign_1",
      shiftId: "shift_1"
    });
  });

  it("does not schedule a daily chat message for a distant next-shift state", () => {
    const notification = buildDailyNotification("admin_1", "7001", {
      status: "next_shift",
      todayDate: "2026-05-20",
      tomorrowDate: "2026-05-21",
      nextAssignmentId: "assign_9",
      nextShiftId: "shift_9",
      headline: "Ближайшая смена",
      body: "Через несколько дней.",
      primaryAction: "Открыть график"
    });

    expect(notification).toBeNull();
  });
});
