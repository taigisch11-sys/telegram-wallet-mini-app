export type ShiftStatus = "draft" | "open" | "assigned" | "filled" | "completed" | "cancelled" | "paid";
export type AssignmentStatus = "assigned" | "confirmed" | "checked_in" | "completed" | "cancelled";

export type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
  workStartTime: string;
  workEndTime: string;
  defaultAdminQuota: number;
  managerName: string;
  managerContact: string;
  isActive: boolean;
};

export type Admin = {
  id: string;
  telegramUserId: string;
  telegramUsername?: string;
  fullName: string;
  role: "admin" | "senior_admin" | "manager" | "owner";
  branchIds: string[];
  canTakeShifts: boolean;
  canViewPayouts: boolean;
  status: "active" | "paused" | "blocked" | "left";
  reliabilityScore: number;
};

export type Shift = {
  id: string;
  branchId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  plannedHours: number;
  hourlyRate: number;
  holidayMultiplier: number;
  bonusAmount: number;
  requiredCount: number;
  assignedCount: number;
  status: ShiftStatus;
  urgent: boolean;
  notes: string;
  coordinator: string;
  updatedAt: string;
};

export type Assignment = {
  id: string;
  shiftId: string;
  adminId: string;
  status: AssignmentStatus;
  source: "mini_app" | "google_sheet" | "system";
  createdAt: string;
  updatedAt: string;
};

export type Story = {
  id: string;
  type: "story" | "news" | "banner" | "announcement";
  title: string;
  body: string;
  status: "draft" | "scheduled" | "published" | "archived";
  priority: number;
};

export type Payout = {
  id: string;
  adminId: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  bonusAmount: number;
  penaltyAmount: number;
  netAmount: number;
  status: "draft" | "approved" | "paid" | "cancelled";
};

export type AuditEvent = {
  id: string;
  eventAt: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  status: "success" | "failed";
  payload: Record<string, unknown>;
};

export type AppState = {
  settings: {
    clinicId: string;
    clinicName: string;
    timezone: string;
    currency: "RUB";
    supportContact: string;
    bookingMode: "instant" | "request";
    selfCancelHours: number;
  };
  branches: Branch[];
  admins: Admin[];
  shifts: Shift[];
  assignments: Assignment[];
  stories: Story[];
  payouts: Payout[];
  audit: AuditEvent[];
};

export type TakeShiftResult =
  | { ok: true; state: AppState; assignment: Assignment }
  | { ok: false; state: AppState; reason: "not_found" | "inactive_admin" | "duplicate" | "filled" | "overlap" | "closed" };

export function calculateShiftPay(input: {
  hourlyRate: number;
  plannedHours: number;
  holidayMultiplier?: number;
  bonusAmount?: number;
}): number {
  return Math.round(input.hourlyRate * input.plannedHours * (input.holidayMultiplier ?? 1) + (input.bonusAmount ?? 0));
}

export function createDemoState(today = isoDate(new Date())): AppState {
  const tomorrow = addDays(today, 1);
  const nextDay = addDays(today, 2);

  return {
    settings: {
      clinicId: "clinic_santal",
      clinicName: "Санталь",
      timezone: "Asia/Novosibirsk",
      currency: "RUB",
      supportContact: "@santal_support",
      bookingMode: "instant",
      selfCancelHours: 12
    },
    branches: [
      {
        id: "branch_central",
        name: "Центральная клиника",
        address: "ул. Ленина, 42",
        city: "Новосибирск",
        workStartTime: "08:00",
        workEndTime: "21:00",
        defaultAdminQuota: 3,
        managerName: "Марина Куратор",
        managerContact: "+7 913 000-11-22",
        isActive: true
      },
      {
        id: "branch_children",
        name: "Детское отделение",
        address: "ул. Фрунзе, 9",
        city: "Новосибирск",
        workStartTime: "09:00",
        workEndTime: "20:00",
        defaultAdminQuota: 1,
        managerName: "Ольга Старшая",
        managerContact: "+7 913 000-22-33",
        isActive: true
      },
      {
        id: "branch_diagnostics",
        name: "Диагностика",
        address: "Красный проспект, 18",
        city: "Новосибирск",
        workStartTime: "07:30",
        workEndTime: "18:30",
        defaultAdminQuota: 2,
        managerName: "Антон Координатор",
        managerContact: "+7 913 000-33-44",
        isActive: true
      }
    ],
    admins: [
      {
        id: "admin_olga",
        telegramUserId: "demo_olga",
        telegramUsername: "olga_demo",
        fullName: "Ольга Иванова",
        role: "admin",
        branchIds: ["branch_central", "branch_children", "branch_diagnostics"],
        canTakeShifts: true,
        canViewPayouts: true,
        status: "active",
        reliabilityScore: 98
      },
      {
        id: "admin_nikita",
        telegramUserId: "demo_nikita",
        telegramUsername: "nikita_demo",
        fullName: "Никита Соколов",
        role: "admin",
        branchIds: ["branch_central", "branch_diagnostics"],
        canTakeShifts: true,
        canViewPayouts: true,
        status: "active",
        reliabilityScore: 100
      },
      {
        id: "admin_alina",
        telegramUserId: "demo_alina",
        telegramUsername: "alina_demo",
        fullName: "Алина Морозова",
        role: "senior_admin",
        branchIds: ["branch_central"],
        canTakeShifts: true,
        canViewPayouts: true,
        status: "active",
        reliabilityScore: 95
      },
      {
        id: "admin_sergey",
        telegramUserId: "demo_sergey",
        telegramUsername: "sergey_demo",
        fullName: "Сергей Петров",
        role: "admin",
        branchIds: ["branch_central"],
        canTakeShifts: true,
        canViewPayouts: true,
        status: "active",
        reliabilityScore: 97
      }
    ],
    shifts: [
      {
        id: "shift_20260520_central_morning",
        branchId: "branch_central",
        title: "Администратор ресепшен",
        date: today,
        startTime: "08:00",
        endTime: "14:00",
        plannedHours: 6,
        hourlyRate: 420,
        holidayMultiplier: 1,
        bonusAmount: 0,
        requiredCount: 2,
        assignedCount: 1,
        status: "open",
        urgent: true,
        notes: "Поток первичных пациентов, нужна уверенная работа с кассой.",
        coordinator: "Марина Куратор",
        updatedAt: `${today}T01:00:00.000Z`
      },
      {
        id: "shift_20260520_children_day",
        branchId: "branch_children",
        title: "Администратор детского отделения",
        date: today,
        startTime: "09:00",
        endTime: "20:00",
        plannedHours: 11,
        hourlyRate: 600,
        holidayMultiplier: 1,
        bonusAmount: 0,
        requiredCount: 1,
        assignedCount: 1,
        status: "assigned",
        urgent: false,
        notes: "Детская регистратура, запись повторных пациентов.",
        coordinator: "Ольга Старшая",
        updatedAt: `${today}T01:10:00.000Z`
      },
      {
        id: "shift_20260521_diagnostics_evening",
        branchId: "branch_diagnostics",
        title: "Вечерняя стойка диагностики",
        date: tomorrow,
        startTime: "14:00",
        endTime: "20:00",
        plannedHours: 6,
        hourlyRate: 520,
        holidayMultiplier: 1,
        bonusAmount: 500,
        requiredCount: 2,
        assignedCount: 0,
        status: "open",
        urgent: false,
        notes: "Выдача результатов, обзвон пациентов перед МРТ.",
        coordinator: "Антон Координатор",
        updatedAt: `${today}T01:20:00.000Z`
      },
      {
        id: "shift_20260522_central_full",
        branchId: "branch_central",
        title: "Полная смена ресепшен",
        date: nextDay,
        startTime: "09:00",
        endTime: "21:00",
        plannedHours: 12,
        hourlyRate: 480,
        holidayMultiplier: 1,
        bonusAmount: 700,
        requiredCount: 2,
        assignedCount: 0,
        status: "open",
        urgent: true,
        notes: "Пиковая загрузка: профосмотры и лаборатория.",
        coordinator: "Марина Куратор",
        updatedAt: `${today}T01:30:00.000Z`
      },
      {
        id: "shift_20260519_central_done",
        branchId: "branch_central",
        title: "Закрытая смена ресепшен",
        date: addDays(today, -1),
        startTime: "08:00",
        endTime: "18:00",
        plannedHours: 10,
        hourlyRate: 456,
        holidayMultiplier: 1,
        bonusAmount: 0,
        requiredCount: 1,
        assignedCount: 1,
        status: "completed",
        urgent: false,
        notes: "Смена завершена без замечаний.",
        coordinator: "Марина Куратор",
        updatedAt: `${today}T00:30:00.000Z`
      }
    ],
    assignments: [
      {
        id: "assign_20260520_central_alina",
        shiftId: "shift_20260520_central_morning",
        adminId: "admin_alina",
        status: "confirmed",
        source: "google_sheet",
        createdAt: `${today}T01:00:00.000Z`,
        updatedAt: `${today}T01:00:00.000Z`
      },
      {
        id: "assign_20260520_children_olga",
        shiftId: "shift_20260520_children_day",
        adminId: "admin_olga",
        status: "confirmed",
        source: "google_sheet",
        createdAt: `${today}T01:05:00.000Z`,
        updatedAt: `${today}T01:05:00.000Z`
      },
      {
        id: "assign_20260519_central_olga",
        shiftId: "shift_20260519_central_done",
        adminId: "admin_olga",
        status: "completed",
        source: "google_sheet",
        createdAt: `${today}T00:00:00.000Z`,
        updatedAt: `${today}T00:00:00.000Z`
      }
    ],
    stories: [
      {
        id: "story_rules",
        type: "story",
        title: "Новые правила выхода",
        body: "Подтверждайте смену за 24 часа и отмечайтесь на месте в приложении.",
        status: "published",
        priority: 1
      },
      {
        id: "story_bonus",
        type: "banner",
        title: "Бонус за срочную смену",
        body: "Срочные смены подсвечены коралловым и уже включают бонус в сумму.",
        status: "published",
        priority: 2
      },
      {
        id: "story_payout",
        type: "news",
        title: "Выплаты по пятницам",
        body: "Начисления за завершенные смены попадают в раздел «Деньги».",
        status: "published",
        priority: 3
      }
    ],
    payouts: [
      {
        id: "payout_olga_week",
        adminId: "admin_olga",
        periodStart: addDays(today, -7),
        periodEnd: today,
        grossAmount: 4560,
        bonusAmount: 0,
        penaltyAmount: 0,
        netAmount: 4560,
        status: "approved"
      }
    ],
    audit: []
  };
}

export function takeShift(state: AppState, input: { shiftId: string; adminId: string; nowIso: string }): TakeShiftResult {
  const shift = state.shifts.find((item) => item.id === input.shiftId);
  const admin = state.admins.find((item) => item.id === input.adminId);

  if (!shift) return { ok: false, state, reason: "not_found" };
  if (!admin || admin.status !== "active" || !admin.canTakeShifts) return { ok: false, state, reason: "inactive_admin" };
  if (state.assignments.some((item) => item.shiftId === input.shiftId && item.adminId === input.adminId && item.status !== "cancelled")) {
    return { ok: false, state, reason: "duplicate" };
  }
  if (shift.assignedCount >= shift.requiredCount) return { ok: false, state, reason: "filled" };
  if (!["open", "assigned"].includes(shift.status)) return { ok: false, state, reason: "closed" };
  if (hasOverlap(state, shift, input.adminId)) return { ok: false, state, reason: "overlap" };

  const nextAssignedCount = shift.assignedCount + 1;
  const nextStatus: ShiftStatus = nextAssignedCount >= shift.requiredCount ? "filled" : "assigned";
  const assignment: Assignment = {
    id: `assign_${input.shiftId}_${input.adminId}_${Date.parse(input.nowIso)}`,
    shiftId: input.shiftId,
    adminId: input.adminId,
    status: "assigned",
    source: "mini_app",
    createdAt: input.nowIso,
    updatedAt: input.nowIso
  };

  return {
    ok: true,
    assignment,
    state: {
      ...state,
      shifts: state.shifts.map((item) =>
        item.id === shift.id ? { ...item, assignedCount: nextAssignedCount, status: nextStatus, updatedAt: input.nowIso } : item
      ),
      assignments: [...state.assignments, assignment],
      audit: [
        ...state.audit,
        {
          id: `audit_${Date.parse(input.nowIso)}_${input.shiftId}`,
          eventAt: input.nowIso,
          actorId: input.adminId,
          action: "shift.take",
          entityType: "shift",
          entityId: input.shiftId,
          status: "success",
          payload: { shiftId: input.shiftId, adminId: input.adminId }
        }
      ]
    }
  };
}

export function cancelAssignment(state: AppState, input: { assignmentId: string; adminId: string; nowIso: string; reason?: string }): AppState {
  const assignment = state.assignments.find((item) => item.id === input.assignmentId && item.adminId === input.adminId);
  if (!assignment || assignment.status === "cancelled") return state;
  const shift = state.shifts.find((item) => item.id === assignment.shiftId);

  return {
    ...state,
    assignments: state.assignments.map((item) =>
      item.id === assignment.id ? { ...item, status: "cancelled", updatedAt: input.nowIso } : item
    ),
    shifts: shift
      ? state.shifts.map((item) =>
          item.id === shift.id
            ? {
                ...item,
                assignedCount: Math.max(0, item.assignedCount - 1),
                status: item.status === "completed" ? item.status : "open",
                updatedAt: input.nowIso
              }
            : item
        )
      : state.shifts,
    audit: [
      ...state.audit,
      {
        id: `audit_cancel_${Date.parse(input.nowIso)}_${assignment.id}`,
        eventAt: input.nowIso,
        actorId: input.adminId,
        action: "assignment.cancel",
        entityType: "assignment",
        entityId: assignment.id,
        status: "success",
        payload: { reason: input.reason ?? "Без причины" }
      }
    ]
  };
}

export function confirmAssignment(state: AppState, input: { assignmentId: string; adminId: string; nowIso: string }): AppState {
  return updateAssignmentStatus(state, input.assignmentId, input.adminId, "confirmed", input.nowIso, "assignment.confirm");
}

export function checkInAssignment(state: AppState, input: { assignmentId: string; adminId: string; nowIso: string }): AppState {
  return updateAssignmentStatus(state, input.assignmentId, input.adminId, "checked_in", input.nowIso, "assignment.check_in");
}

export function completeAssignment(state: AppState, input: { assignmentId: string; adminId: string; nowIso: string }): AppState {
  const nextState = updateAssignmentStatus(state, input.assignmentId, input.adminId, "completed", input.nowIso, "assignment.complete");
  const assignment = nextState.assignments.find((item) => item.id === input.assignmentId);
  if (!assignment) return nextState;

  return {
    ...nextState,
    shifts: nextState.shifts.map((shift) =>
      shift.id === assignment.shiftId ? { ...shift, status: "completed", updatedAt: input.nowIso } : shift
    )
  };
}

export function buildScheduleBoard(state: AppState) {
  const days = [...new Set(state.shifts.map((shift) => shift.date))].sort();
  return days.map((date) => ({
    date,
    branches: state.branches
      .filter((branch) => branch.isActive)
      .map((branch) => {
        const branchShifts = state.shifts.filter((shift) => shift.date === date && shift.branchId === branch.id && shift.status !== "cancelled");
        const plannedRequired = branchShifts.reduce((sum, shift) => sum + shift.requiredCount, 0);
        const required = plannedRequired > 0 ? Math.max(plannedRequired, branch.defaultAdminQuota) : 0;
        const assigned = branchShifts.reduce((sum, shift) => sum + shift.assignedCount, 0);
        return { branchId: branch.id, required, assigned, open: Math.max(0, required - assigned) };
      })
      .filter((branch) => branch.required > 0)
  }));
}

export function deriveMoneySummary(state: AppState, adminId: string) {
  const adminAssignments = state.assignments.filter((assignment) => assignment.adminId === adminId && assignment.status !== "cancelled");
  const adminShiftIds = new Set(adminAssignments.map((assignment) => assignment.shiftId));
  const assignedShiftIds = new Set(
    adminAssignments
      .filter((assignment) => ["assigned", "confirmed", "checked_in"].includes(assignment.status))
      .map((assignment) => assignment.shiftId)
  );
  const completedShiftIds = new Set(
    adminAssignments.filter((assignment) => assignment.status === "completed").map((assignment) => assignment.shiftId)
  );

  const expected = state.shifts
    .filter((shift) => adminShiftIds.has(shift.id))
    .reduce((sum, shift) => sum + calculateShiftPay(shift), 0);
  const pending = state.shifts
    .filter((shift) => assignedShiftIds.has(shift.id))
    .reduce((sum, shift) => sum + calculateShiftPay(shift), 0);
  const earned = state.shifts
    .filter((shift) => completedShiftIds.has(shift.id))
    .reduce((sum, shift) => sum + calculateShiftPay(shift), 0);
  const paid = state.payouts
    .filter((payout) => payout.adminId === adminId && payout.status === "paid")
    .reduce((sum, payout) => sum + payout.netAmount, 0);
  const approved = state.payouts
    .filter((payout) => payout.adminId === adminId && payout.status === "approved")
    .reduce((sum, payout) => sum + payout.netAmount, 0);

  return { expected, pending, earned, approved, paid, balance: earned - paid };
}

export function visibleShiftsForAdmin(state: AppState, adminId: string) {
  const admin = state.admins.find((item) => item.id === adminId);
  if (!admin) return [];

  return state.shifts
    .filter((shift) => admin.branchIds.includes(shift.branchId))
    .filter((shift) => ["open", "assigned", "filled"].includes(shift.status))
    .sort((left, right) => `${left.date}T${left.startTime}`.localeCompare(`${right.date}T${right.startTime}`));
}

export function myAssignments(state: AppState, adminId: string) {
  return state.assignments
    .filter((assignment) => assignment.adminId === adminId && assignment.status !== "cancelled")
    .map((assignment) => ({ assignment, shift: state.shifts.find((shift) => shift.id === assignment.shiftId) }))
    .filter((item): item is { assignment: Assignment; shift: Shift } => Boolean(item.shift))
    .sort((left, right) => `${left.shift.date}T${left.shift.startTime}`.localeCompare(`${right.shift.date}T${right.shift.startTime}`));
}

export function findOrCreateAdminByTelegram(
  state: AppState,
  telegramUser: { id: string; username?: string; firstName?: string; lastName?: string },
  nowIso: string
) {
  const existing = state.admins.find((admin) => admin.telegramUserId === telegramUser.id);
  if (existing) return { state, admin: existing };

  const admin: Admin = {
    id: `admin_tg_${telegramUser.id}`,
    telegramUserId: telegramUser.id,
    telegramUsername: telegramUser.username,
    fullName: [telegramUser.firstName, telegramUser.lastName].filter(Boolean).join(" ") || telegramUser.username || "Новый администратор",
    role: "admin",
    branchIds: state.branches.filter((branch) => branch.isActive).map((branch) => branch.id),
    canTakeShifts: true,
    canViewPayouts: true,
    status: "active",
    reliabilityScore: 100
  };

  return {
    admin,
    state: {
      ...state,
      admins: [...state.admins, admin],
      audit: [
        ...state.audit,
        {
          id: `audit_admin_${Date.parse(nowIso)}_${telegramUser.id}`,
          eventAt: nowIso,
          actorId: admin.id,
          action: "admin.first_login",
          entityType: "admin",
          entityId: admin.id,
          status: "success" as const,
          payload: { telegramUserId: telegramUser.id }
        }
      ]
    }
  };
}

function updateAssignmentStatus(
  state: AppState,
  assignmentId: string,
  adminId: string,
  status: AssignmentStatus,
  nowIso: string,
  action: string
): AppState {
  const assignment = state.assignments.find((item) => item.id === assignmentId && item.adminId === adminId);
  if (!assignment || assignment.status === "cancelled") return state;

  return {
    ...state,
    assignments: state.assignments.map((item) => (item.id === assignmentId ? { ...item, status, updatedAt: nowIso } : item)),
    audit: [
      ...state.audit,
      {
        id: `audit_${action}_${Date.parse(nowIso)}_${assignmentId}`,
        eventAt: nowIso,
        actorId: adminId,
        action,
        entityType: "assignment",
        entityId: assignmentId,
        status: "success",
        payload: { status }
      }
    ]
  };
}

function hasOverlap(state: AppState, shift: Shift, adminId: string): boolean {
  const start = toMinutes(shift.startTime);
  const end = toMinutes(shift.endTime);
  return myAssignments(state, adminId).some(({ shift: existingShift }) => {
    if (existingShift.date !== shift.date) return false;
    if (["cancelled", "completed", "paid"].includes(existingShift.status)) return false;
    const existingStart = toMinutes(existingShift.startTime);
    const existingEnd = toMinutes(existingShift.endTime);
    return start < existingEnd && existingStart < end;
  });
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return isoDate(next);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
