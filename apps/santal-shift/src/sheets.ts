import type { Admin, AppState, Assignment, Branch, Payout, Shift, Story } from "./domain";
import { createDemoState } from "./domain";
import type { WorkerEnv } from "./env";

export type SyncStatus = {
  connected: boolean;
  mode: "google_sheets" | "demo";
  spreadsheetId?: string;
  message: string;
};

type SheetDefinition = {
  name: string;
  headers: string[];
  rows: string[][];
};

const demoState = createDemoState("2026-05-20");

export const SHEET_DEFINITIONS: SheetDefinition[] = [
  {
    name: "Настройки_клиники",
    headers: ["clinic_id", "clinic_name", "timezone", "currency", "support_contact", "booking_mode", "self_cancel_hours", "mini_app_url"],
    rows: [["clinic_santal", "Санталь", "Asia/Novosibirsk", "RUB", "@santal_support", "instant", "12", ""]]
  },
  {
    name: "Филиалы",
    headers: [
      "branch_id",
      "clinic_id",
      "branch_name",
      "address",
      "city",
      "work_start_time",
      "work_end_time",
      "default_admin_quota",
      "manager_name",
      "manager_contact",
      "is_active"
    ],
    rows: demoState.branches.map((branch) => [
      branch.id,
      demoState.settings.clinicId,
      branch.name,
      branch.address,
      branch.city,
      branch.workStartTime,
      branch.workEndTime,
      String(branch.defaultAdminQuota),
      branch.managerName,
      branch.managerContact,
      branch.isActive ? "TRUE" : "FALSE"
    ])
  },
  {
    name: "Администраторы",
    headers: [
      "admin_id",
      "telegram_user_id",
      "telegram_username",
      "full_name",
      "phone",
      "role",
      "branch_ids",
      "can_take_shifts",
      "can_view_payouts",
      "status",
      "reliability_score"
    ],
    rows: demoState.admins.map((admin) => [
      admin.id,
      admin.telegramUserId,
      admin.telegramUsername ?? "",
      admin.fullName,
      "",
      admin.role,
      admin.branchIds.join(","),
      admin.canTakeShifts ? "TRUE" : "FALSE",
      admin.canViewPayouts ? "TRUE" : "FALSE",
      admin.status,
      String(admin.reliabilityScore)
    ])
  },
  {
    name: "Смены",
    headers: [
      "shift_id",
      "branch_id",
      "title",
      "shift_date",
      "start_time",
      "end_time",
      "planned_hours",
      "hourly_rate",
      "holiday_multiplier",
      "bonus_amount",
      "required_count",
      "assigned_count",
      "status",
      "urgent",
      "notes",
      "coordinator",
      "updated_at"
    ],
    rows: demoState.shifts.map((shift) => [
      shift.id,
      shift.branchId,
      shift.title,
      shift.date,
      shift.startTime,
      shift.endTime,
      String(shift.plannedHours),
      String(shift.hourlyRate),
      String(shift.holidayMultiplier),
      String(shift.bonusAmount),
      String(shift.requiredCount),
      String(shift.assignedCount),
      shift.status,
      shift.urgent ? "TRUE" : "FALSE",
      shift.notes,
      shift.coordinator,
      shift.updatedAt
    ])
  },
  {
    name: "Заявки",
    headers: ["request_id", "request_type", "admin_id", "telegram_user_id", "branch_id", "shift_id", "message", "status", "created_at", "updated_at"],
    rows: demoState.assignments.map((assignment) => {
      const admin = demoState.admins.find((item) => item.id === assignment.adminId);
      const shift = demoState.shifts.find((item) => item.id === assignment.shiftId);
      return [
        `request_${assignment.id}`,
        "take_shift",
        assignment.adminId,
        admin?.telegramUserId ?? "",
        shift?.branchId ?? "",
        assignment.shiftId,
        `Заявка на смену ${shift?.date ?? ""} ${shift?.startTime ?? ""}-${shift?.endTime ?? ""}`.trim(),
        assignment.status === "cancelled" ? "cancelled" : "approved",
        assignment.createdAt,
        assignment.updatedAt
      ];
    })
  },
  {
    name: "Назначения",
    headers: [
      "assignment_id",
      "shift_id",
      "admin_id",
      "telegram_user_id",
      "admin_name",
      "status",
      "source",
      "confirmed_at",
      "checkin_at",
      "checkout_at",
      "cancel_reason",
      "created_at",
      "updated_at"
    ],
    rows: demoState.assignments.map((assignment) => {
      const admin = demoState.admins.find((item) => item.id === assignment.adminId);
      return assignmentSheetRow({ assignment, admin, cancelReason: "" });
    })
  },
  {
    name: "Ставки",
    headers: ["rate_id", "rate_name", "branch_id", "role", "rate_type", "base_amount", "holiday_multiplier", "night_multiplier", "valid_from", "valid_to", "is_active"],
    rows: [
      ["rate_admin_base", "Администратор", "", "admin", "hourly", "420", "1.5", "1.2", "2026-01-01", "", "TRUE"],
      ["rate_doctor_assistant_base", "Помощник врача", "", "doctor_assistant", "hourly", "450", "1.5", "1.2", "2026-01-01", "", "TRUE"]
    ]
  },
  {
    name: "Праздники",
    headers: ["holiday_id", "date", "name", "branch_id", "day_type", "pay_multiplier", "is_working_day", "notes"],
    rows: [["holiday_new_year", "2027-01-01", "Новый год", "", "public_holiday", "2", "FALSE", "Повышенная ставка"]]
  },
  {
    name: "Истории_новости",
    headers: ["content_id", "type", "title", "body", "image_url", "button_text", "button_url", "publish_from", "publish_to", "priority", "status"],
    rows: [
      ["story_rules", "story", "Новые правила выхода", "Подтверждайте смену за 24 часа и отмечайтесь на месте.", "", "Понятно", "", "2026-01-01", "2027-01-01", "1", "published"],
      ["story_bonus", "banner", "Бонус за срочную смену", "Срочные смены уже включают бонус в сумму.", "", "Смотреть", "", "2026-01-01", "2027-01-01", "2", "published"]
    ]
  },
  {
    name: "Выплаты",
    headers: ["payout_id", "admin_id", "period_start", "period_end", "gross_amount", "bonus_amount", "penalty_amount", "net_amount", "payment_method", "status", "paid_at"],
    rows: demoState.payouts.map((payout) => [
      payout.id,
      payout.adminId,
      payout.periodStart,
      payout.periodEnd,
      String(payout.grossAmount),
      String(payout.bonusAmount),
      String(payout.penaltyAmount),
      String(payout.netAmount),
      "sbp",
      payout.status,
      ""
    ])
  },
  {
    name: "Начисления",
    headers: [
      "accrual_id",
      "payout_id",
      "assignment_id",
      "shift_id",
      "admin_id",
      "branch_id",
      "shift_date",
      "planned_hours",
      "actual_hours",
      "hourly_rate",
      "holiday_multiplier",
      "bonus_amount",
      "penalty_amount",
      "total_amount",
      "status",
      "comment"
    ],
    rows: demoState.assignments
      .filter((assignment) => assignment.status === "completed")
      .map((assignment) => {
        const shift = demoState.shifts.find((item) => item.id === assignment.shiftId);
        if (!shift) return [];
        const total = Math.round(shift.hourlyRate * shift.plannedHours * shift.holidayMultiplier + shift.bonusAmount);
        return [
          `accrual_${assignment.id}`,
          "",
          assignment.id,
          shift.id,
          assignment.adminId,
          shift.branchId,
          shift.date,
          String(shift.plannedHours),
          String(shift.plannedHours),
          String(shift.hourlyRate),
          String(shift.holidayMultiplier),
          String(shift.bonusAmount),
          "0",
          String(total),
          "approved",
          "Демо-начисление"
        ];
      })
      .filter((row) => row.length > 0)
  },
  {
    name: "Шахматка",
    headers: [
      "date",
      "branch_id",
      "branch_name",
      "shift_id",
      "start_time",
      "end_time",
      "required_admins",
      "assigned_admins",
      "open_slots",
      "assigned_admin_ids",
      "assigned_admin_names",
      "status",
      "risk"
    ],
    rows: demoState.shifts.map((shift) => {
      const branch = demoState.branches.find((item) => item.id === shift.branchId);
      const assignments = demoState.assignments.filter((assignment) => assignment.shiftId === shift.id && assignment.status !== "cancelled");
      const admins = assignments.map((assignment) => demoState.admins.find((admin) => admin.id === assignment.adminId)).filter(Boolean) as Admin[];
      return [
        shift.date,
        shift.branchId,
        branch?.name ?? "",
        shift.id,
        shift.startTime,
        shift.endTime,
        String(shift.requiredCount),
        String(assignments.length),
        String(Math.max(0, shift.requiredCount - assignments.length)),
        admins.map((admin) => admin.id).join(","),
        admins.map((admin) => admin.fullName).join(", "),
        shift.status,
        assignments.length < shift.requiredCount ? "needs_staff" : "ok"
      ];
    })
  },
  {
    name: "Справочники",
    headers: ["roles", "admin_statuses", "shift_statuses", "request_types", "request_statuses", "payout_statuses", "rate_types", "content_statuses"],
    rows: [
      ["admin", "active", "open", "take_shift", "new", "draft", "hourly", "draft"],
      ["doctor_assistant", "paused", "assigned", "cancel_shift", "approved", "approved", "shift_fixed", "published"],
      ["", "blocked", "completed", "payout_question", "rejected", "paid", "daily", "archived"]
    ]
  },
  {
    name: "Аудит_лог",
    headers: ["event_id", "event_at", "actor_type", "actor_id", "action", "entity_type", "entity_id", "payload_json", "source", "status", "error_message"],
    rows: []
  },
  {
    name: "Sync_State",
    headers: ["sync_key", "value", "updated_at", "updated_by"],
    rows: [["schema_version", "1", new Date().toISOString(), "system"]]
  }
];

export async function loadState(env: WorkerEnv): Promise<{ state: AppState; sync: SyncStatus }> {
  if (!hasGoogleCredentials(env)) {
    return {
      state: createDemoState("2026-05-20"),
      sync: {
        connected: false,
        mode: "demo",
        spreadsheetId: env.GOOGLE_SHEET_ID,
        message: "Google Sheets не подключен: нет service account секретов. Используется демо-состояние."
      }
    };
  }

  try {
    const state = await readStateFromSheets(env);
    return {
      state,
      sync: {
        connected: true,
        mode: "google_sheets",
        spreadsheetId: env.GOOGLE_SHEET_ID,
        message: "Google Sheets подключен. Справочники готовы к синхронизации."
      }
    };
  } catch (error) {
    return {
      state: createDemoState("2026-05-20"),
      sync: {
        connected: false,
        mode: "demo",
        spreadsheetId: env.GOOGLE_SHEET_ID,
        message: `Google Sheets временно недоступен: ${error instanceof Error ? error.message : "ошибка"}`
      }
    };
  }
}

export async function setupSpreadsheet(env: WorkerEnv): Promise<{ createdSheets: string[]; updatedSheets: string[] }> {
  requireGoogleCredentials(env);
  const metadata = await sheetsFetch<{ sheets?: Array<{ properties: { title: string } }> }>(env, `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}`);
  const existing = new Set((metadata.sheets ?? []).map((sheet) => sheet.properties.title));
  const missing = SHEET_DEFINITIONS.filter((definition) => !existing.has(definition.name));

  if (missing.length > 0) {
    await sheetsFetch(env, `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: missing.map((definition) => ({
          addSheet: {
            properties: { title: definition.name, gridProperties: { frozenRowCount: 1 } }
          }
        }))
      })
    });
  }

  for (const definition of SHEET_DEFINITIONS) {
    await updateValues(env, `${definition.name}!A1`, [definition.headers]);
    const existingRows = await readValues(env, `${definition.name}!A2:Z`);
    if (existingRows.length === 0 && definition.rows.length > 0) {
      await appendValues(env, `${definition.name}!A:Z`, definition.rows);
    }
  }

  return {
    createdSheets: missing.map((definition) => definition.name),
    updatedSheets: SHEET_DEFINITIONS.map((definition) => definition.name)
  };
}

export async function appendAudit(env: WorkerEnv, row: string[]): Promise<void> {
  if (!hasGoogleCredentials(env)) return;
  await appendValues(env, "Аудит_лог!A:K", [row]);
}

export async function appendAssignment(env: WorkerEnv, input: { assignment: Assignment; admin: Admin; shift: Shift; cancelReason?: string }): Promise<void> {
  if (!hasGoogleCredentials(env)) return;
  await appendValues(env, "Назначения!A:M", [assignmentSheetRow(input)]);
}

function assignmentSheetRow(input: { assignment: Assignment; admin?: Admin; cancelReason?: string }): string[] {
  const status = input.assignment.status;
  return [
    input.assignment.id,
    input.assignment.shiftId,
    input.assignment.adminId,
    input.admin?.telegramUserId ?? "",
    input.admin?.fullName ?? "",
    status,
    input.assignment.source,
    ["confirmed", "checked_in", "completed"].includes(status) ? input.assignment.updatedAt : "",
    ["checked_in", "completed"].includes(status) ? input.assignment.updatedAt : "",
    status === "completed" ? input.assignment.updatedAt : "",
    status === "cancelled" ? input.cancelReason ?? "Отмена через Mini App" : "",
    input.assignment.createdAt,
    input.assignment.updatedAt
  ];
}

export async function appendAccrual(env: WorkerEnv, input: { assignment: Assignment; shift: Shift; status: string; comment?: string }): Promise<void> {
  if (!hasGoogleCredentials(env)) return;
  const total = Math.round(input.shift.hourlyRate * input.shift.plannedHours * input.shift.holidayMultiplier + input.shift.bonusAmount);
  await appendValues(env, "Начисления!A:P", [
    [
      `accrual_${input.assignment.id}`,
      "",
      input.assignment.id,
      input.shift.id,
      input.assignment.adminId,
      input.shift.branchId,
      input.shift.date,
      String(input.shift.plannedHours),
      String(input.shift.plannedHours),
      String(input.shift.hourlyRate),
      String(input.shift.holidayMultiplier),
      String(input.shift.bonusAmount),
      "0",
      String(total),
      input.status,
      input.comment ?? ""
    ]
  ]);
}

async function readStateFromSheets(env: WorkerEnv): Promise<AppState> {
  const [settingsRows, branchRows, adminRows, shiftRows, assignmentRows, storyRows, payoutRows] = await Promise.all([
    readValues(env, "Настройки_клиники!A2:H"),
    readValues(env, "Филиалы!A2:K"),
    readValues(env, "Администраторы!A2:K"),
    readValues(env, "Смены!A2:Q"),
    readValues(env, "Назначения!A2:M"),
    readValues(env, "Истории_новости!A2:K"),
    readValues(env, "Выплаты!A2:K")
  ]);
  const fallback = createDemoState("2026-05-20");
  const settingsRow = settingsRows[0] ?? [];
  const branches: Branch[] = branchRows.filter((row) => row[0]).map((row) => ({
    id: cell(row, 0),
    name: cell(row, 2),
    address: cell(row, 3),
    city: cell(row, 4),
    workStartTime: cell(row, 5, "08:00"),
    workEndTime: cell(row, 6, "21:00"),
    defaultAdminQuota: numberCell(row, 7, 1),
    managerName: cell(row, 8),
    managerContact: cell(row, 9),
    isActive: boolCell(row, 10, true)
  }));
  const admins: Admin[] = adminRows.filter((row) => row[0]).map((row) => ({
    id: cell(row, 0),
    telegramUserId: cell(row, 1),
    telegramUsername: cell(row, 2) || undefined,
    fullName: cell(row, 3, "Администратор"),
    role: normalizeRole(cell(row, 5)),
    branchIds: cell(row, 6).split(",").map((item) => item.trim()).filter(Boolean),
    canTakeShifts: boolCell(row, 7, true),
    canViewPayouts: boolCell(row, 8, true),
    status: normalizeAdminStatus(cell(row, 9)),
    reliabilityScore: numberCell(row, 10, 100)
  }));
  const parsedAssignments: Assignment[] = assignmentRows.filter((row) => row[0]).map((row) => ({
    id: cell(row, 0),
    shiftId: cell(row, 1),
    adminId: cell(row, 2),
    status: normalizeAssignmentStatus(cell(row, 5)),
    source: normalizeAssignmentSource(cell(row, 6)),
    createdAt: cell(row, 11, new Date().toISOString()),
    updatedAt: cell(row, 12, new Date().toISOString())
  }));
  const assignments = dedupeLatestAssignments(parsedAssignments);
  const shifts: Shift[] = shiftRows.filter((row) => row[0]).map((row) => {
    const shiftId = cell(row, 0);
    const activeAssignments = assignments.filter((assignment) => assignment.shiftId === shiftId && assignment.status !== "cancelled");
    const requiredCount = numberCell(row, 10, 1);
    const assignedCount = activeAssignments.length || numberCell(row, 11, 0);
    return {
      id: shiftId,
      branchId: cell(row, 1),
      title: cell(row, 2, "Смена администратора"),
      date: cell(row, 3),
      startTime: cell(row, 4, "09:00"),
      endTime: cell(row, 5, "18:00"),
      plannedHours: numberCell(row, 6, 8),
      hourlyRate: numberCell(row, 7, 0),
      holidayMultiplier: numberCell(row, 8, 1),
      bonusAmount: numberCell(row, 9, 0),
      requiredCount,
      assignedCount,
      status: normalizeShiftStatus(assignedCount >= requiredCount && requiredCount > 0 ? "filled" : cell(row, 12, "open")),
      urgent: boolCell(row, 13, false),
      notes: cell(row, 14),
      coordinator: cell(row, 15),
      updatedAt: cell(row, 16, new Date().toISOString())
    };
  });
  const stories: Story[] = storyRows.filter((row) => row[0]).map((row) => ({
    id: cell(row, 0),
    type: normalizeStoryType(cell(row, 1)),
    title: cell(row, 2),
    body: cell(row, 3),
    status: normalizeStoryStatus(cell(row, 10)),
    priority: numberCell(row, 9, 100)
  }));
  const payouts: Payout[] = payoutRows.filter((row) => row[0]).map((row) => ({
    id: cell(row, 0),
    adminId: cell(row, 1),
    periodStart: cell(row, 2),
    periodEnd: cell(row, 3),
    grossAmount: numberCell(row, 4, 0),
    bonusAmount: numberCell(row, 5, 0),
    penaltyAmount: numberCell(row, 6, 0),
    netAmount: numberCell(row, 7, 0),
    status: normalizePayoutStatus(cell(row, 9))
  }));

  return {
    settings: {
      clinicId: cell(settingsRow, 0, fallback.settings.clinicId),
      clinicName: cell(settingsRow, 1, fallback.settings.clinicName),
      timezone: cell(settingsRow, 2, fallback.settings.timezone),
      currency: "RUB",
      supportContact: cell(settingsRow, 4, fallback.settings.supportContact),
      bookingMode: cell(settingsRow, 5, "instant") === "request" ? "request" : "instant",
      selfCancelHours: numberCell(settingsRow, 6, fallback.settings.selfCancelHours)
    },
    branches: branches.length ? branches : fallback.branches,
    admins: admins.length ? admins : fallback.admins,
    shifts: shifts.length ? shifts : fallback.shifts,
    assignments: assignments.length ? assignments : fallback.assignments,
    stories: stories.length ? stories : fallback.stories,
    payouts,
    audit: []
  };
}

function cell(row: string[], index: number, fallback = ""): string {
  return row[index] === undefined || row[index] === "" ? fallback : String(row[index]);
}

function numberCell(row: string[], index: number, fallback: number): number {
  const parsed = Number(String(row[index] ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolCell(row: string[], index: number, fallback: boolean): boolean {
  const value = String(row[index] ?? "").toLowerCase();
  if (["true", "1", "yes", "да"].includes(value)) return true;
  if (["false", "0", "no", "нет"].includes(value)) return false;
  return fallback;
}

function normalizeRole(value: string): Admin["role"] {
  return ["admin", "doctor_assistant"].includes(value) ? (value as Admin["role"]) : "admin";
}

function normalizeAdminStatus(value: string): Admin["status"] {
  return ["active", "paused", "blocked", "left"].includes(value) ? (value as Admin["status"]) : "active";
}

function normalizeShiftStatus(value: string): Shift["status"] {
  return ["draft", "open", "assigned", "filled", "completed", "cancelled", "paid"].includes(value) ? (value as Shift["status"]) : "open";
}

function normalizeAssignmentStatus(value: string): Assignment["status"] {
  return ["assigned", "confirmed", "checked_in", "completed", "cancelled"].includes(value) ? (value as Assignment["status"]) : "assigned";
}

function normalizeAssignmentSource(value: string): Assignment["source"] {
  return ["mini_app", "google_sheet", "system"].includes(value) ? (value as Assignment["source"]) : "google_sheet";
}

function normalizeStoryType(value: string): Story["type"] {
  return ["story", "news", "banner", "announcement"].includes(value) ? (value as Story["type"]) : "news";
}

function normalizeStoryStatus(value: string): Story["status"] {
  return ["draft", "scheduled", "published", "archived"].includes(value) ? (value as Story["status"]) : "published";
}

function normalizePayoutStatus(value: string): Payout["status"] {
  return ["draft", "approved", "paid", "cancelled"].includes(value) ? (value as Payout["status"]) : "draft";
}

export function dedupeLatestAssignments(assignments: Assignment[]): Assignment[] {
  const latestById = new Map<string, Assignment>();
  for (const assignment of assignments) {
    const existing = latestById.get(assignment.id);
    if (!existing || toTimestamp(assignment.updatedAt) >= toTimestamp(existing.updatedAt)) {
      latestById.set(assignment.id, assignment);
    }
  }
  return [...latestById.values()];
}

function toTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function hasGoogleCredentials(env: WorkerEnv): boolean {
  return Boolean(env.GOOGLE_SHEET_ID && env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY);
}

function requireGoogleCredentials(env: WorkerEnv): void {
  if (!hasGoogleCredentials(env)) {
    throw new Error("Google Sheets credentials are not configured");
  }
}

async function readValues(env: WorkerEnv, range: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(range)}`;
  const response = await sheetsFetch<{ values?: string[][] }>(env, url);
  return response.values ?? [];
}

async function updateValues(env: WorkerEnv, range: string, values: string[][]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  await sheetsFetch(env, url, {
    method: "PUT",
    body: JSON.stringify({ values })
  });
}

async function appendValues(env: WorkerEnv, range: string, values: string[][]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  await sheetsFetch(env, url, {
    method: "POST",
    body: JSON.stringify({ values })
  });
}

async function sheetsFetch<T>(env: WorkerEnv, url: string, init: RequestInit = {}): Promise<T> {
  const token = await getGoogleAccessToken(env);
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
  if (!response.ok) throw new Error(`Sheets API ${response.status}`);
  return (await response.json()) as T;
}

async function getGoogleAccessToken(env: WorkerEnv): Promise<string> {
  requireGoogleCredentials(env);
  const now = Math.floor(Date.now() / 1000);
  const jwt = await signJwt(
    {
      alg: "RS256",
      typ: "JWT"
    },
    {
      iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    },
    env.GOOGLE_PRIVATE_KEY ?? ""
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  if (!response.ok) throw new Error(`Google OAuth ${response.status}`);
  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

async function signJwt(header: Record<string, unknown>, payload: Record<string, unknown>, privateKey: string): Promise<string> {
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey.replace(/\\n/g, "\n")),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(data));
  return `${data}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

function base64UrlEncode(value: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
