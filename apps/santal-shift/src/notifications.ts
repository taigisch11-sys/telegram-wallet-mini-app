export type AssistantNotificationSource = {
  status: string;
  todayDate: string;
  tomorrowDate: string;
  nextShiftId?: string;
  nextAssignmentId?: string;
  headline: string;
  body: string;
  primaryAction?: string;
};

export type NotificationRecord = {
  key: string;
  adminId: string;
  telegramUserId: string;
  type: "no_shifts" | "tomorrow_shift";
  assignmentId: string;
  shiftId: string;
  message: string;
  status: "planned" | "sent" | "failed" | "skipped";
  sentAt: string;
};

export function buildDailyNotification(
  adminId: string,
  telegramUserId: string,
  assistant: AssistantNotificationSource
): NotificationRecord | null {
  if (assistant.status === "no_shifts") {
    return {
      key: `no_shifts:${assistant.todayDate}:${adminId}`,
      adminId,
      telegramUserId,
      type: "no_shifts",
      assignmentId: "",
      shiftId: "",
      message: `${assistant.headline}\n\n${assistant.body}`,
      status: "planned",
      sentAt: ""
    };
  }

  if (assistant.status === "tomorrow_shift") {
    const assignmentKey = assistant.nextAssignmentId || assistant.nextShiftId || "unknown";
    return {
      key: `tomorrow_shift:${assistant.tomorrowDate}:${adminId}:${assignmentKey}`,
      adminId,
      telegramUserId,
      type: "tomorrow_shift",
      assignmentId: assistant.nextAssignmentId ?? "",
      shiftId: assistant.nextShiftId ?? "",
      message: `${assistant.headline}\n\n${assistant.body}`,
      status: "planned",
      sentAt: ""
    };
  }

  return null;
}
