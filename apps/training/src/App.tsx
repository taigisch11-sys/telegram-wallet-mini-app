import {
  Activity,
  ArrowLeft,
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Dumbbell,
  Flame,
  HeartPulse,
  MessageCircle,
  Plus,
  Radio,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  WalletCards,
  Zap
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Role = "coach" | "student";
type Tab = "home" | "plan" | "chat" | "balance";
type SessionStatus = "planned" | "in_progress" | "done" | "missed";
type TransactionKind = "topup" | "charge" | "bonus";
type TransactionStatus = "success" | "pending";

type TrainingUser = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  role: Role;
  createdAt: string;
};

type Student = {
  id: string;
  name: string;
  username: string | null;
  goal: string;
  risk: "green" | "yellow" | "red";
  compliance: number;
  balance: number;
};

type Plan = {
  id: string;
  coachId: string;
  studentId: string | null;
  title: string;
  goal: string;
  startDate: string;
  weeks: number;
  status: string;
};

type Session = {
  id: string;
  planId: string | null;
  coachId: string;
  studentId: string | null;
  title: string;
  scheduledDate: string;
  status: SessionStatus;
  focus: string;
  durationMin: number;
  intensity: number;
};

type Exercise = {
  id: string;
  sessionId: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  restSec: number;
  notes: string;
  actualSets: number;
};

type ChatMessage = {
  id: string;
  coachId: string;
  studentId: string;
  senderId: string;
  body: string;
  context: string | null;
  createdAt: string;
};

type BalanceTransaction = {
  id: string;
  userId: string;
  kind: TransactionKind;
  amount: number;
  status: TransactionStatus;
  note: string;
  createdAt: string;
};

type CheckIn = {
  id: string;
  sessionId: string | null;
  studentId: string;
  bodyWeightKg: number | null;
  energy: number;
  soreness: number;
  note: string;
  createdAt: string;
};

type TrainingState = {
  user: TrainingUser;
  coach: Student | null;
  students: Student[];
  plans: Plan[];
  sessions: Session[];
  exercises: Exercise[];
  messages: ChatMessage[];
  transactions: BalanceTransaction[];
  checkins: CheckIn[];
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        version?: string;
        ready?: () => void;
        expand?: () => void;
        HapticFeedback?: {
          impactOccurred?: (style: "light" | "medium" | "heavy") => void;
          notificationOccurred?: (type: "success" | "warning" | "error") => void;
        };
      };
    };
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "training_jwt";
const LOCAL_STATE_KEY = "training_local_state";
const LOCAL_ROLE_KEY = "training_role";
const LOCAL_DEMO_KEY = "training_demo";

function todayIso(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function rub(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value) + " ₽";
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(value));
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function demoState(role: Role): TrainingState {
  const coachId = "demo-coach";
  const studentId = "demo-student";
  const planId = "demo-plan";
  const sessionA = "demo-session-a";
  const sessionB = "demo-session-b";
  const baseUser: TrainingUser = {
    id: role === "coach" ? coachId : studentId,
    telegramId: role === "coach" ? "90001" : "90002",
    username: role === "coach" ? "coach_demo" : "student_demo",
    firstName: role === "coach" ? "Тренер" : "Алексей",
    role,
    createdAt: todayIso(-14)
  };

  return {
    user: baseUser,
    coach:
      role === "student"
        ? { id: coachId, name: "Мария Волкова", username: "coach_maria", goal: "Сила и техника", risk: "green", compliance: 94, balance: 0 }
        : null,
    students:
      role === "coach"
        ? [
            { id: studentId, name: "Алексей Орлов", username: "alexfit", goal: "Набор силы", risk: "green", compliance: 92, balance: 12800 },
            { id: "demo-student-2", name: "Ирина Соколова", username: "irina_run", goal: "Минус 6 кг", risk: "yellow", compliance: 67, balance: 2200 },
            { id: "demo-student-3", name: "Максим Долгов", username: "max_move", goal: "Реабилитация плеча", risk: "red", compliance: 41, balance: -3000 }
          ]
        : [],
    plans: [
      {
        id: planId,
        coachId,
        studentId,
        title: "Силовой блок: неделя 1",
        goal: "Техника базовых движений и контроль нагрузки",
        startDate: todayIso(-1),
        weeks: 4,
        status: "active"
      }
    ],
    sessions: [
      {
        id: sessionA,
        planId,
        coachId,
        studentId,
        title: "Силовая B",
        scheduledDate: todayIso(),
        status: "planned",
        focus: "Ноги + корпус",
        durationMin: 45,
        intensity: 7
      },
      {
        id: sessionB,
        planId,
        coachId,
        studentId,
        title: "Recovery Flow",
        scheduledDate: todayIso(2),
        status: "planned",
        focus: "Мобилити",
        durationMin: 28,
        intensity: 4
      }
    ],
    exercises: [
      {
        id: "ex-1",
        sessionId: sessionA,
        name: "Фронтальный присед",
        sets: 4,
        reps: "6",
        weight: "60 кг",
        restSec: 120,
        notes: "Держать локти высоко, не терять корпус.",
        actualSets: 0
      },
      {
        id: "ex-2",
        sessionId: sessionA,
        name: "Румынская тяга",
        sets: 3,
        reps: "8",
        weight: "70 кг",
        restSec: 90,
        notes: "Темп 3-1-1, спина нейтральная.",
        actualSets: 0
      },
      {
        id: "ex-3",
        sessionId: sessionA,
        name: "Планка с касанием плеч",
        sets: 3,
        reps: "40 сек",
        weight: "свой вес",
        restSec: 60,
        notes: "Таз не раскачивать.",
        actualSets: 0
      },
      {
        id: "ex-4",
        sessionId: sessionB,
        name: "90/90 бедра",
        sets: 2,
        reps: "8/сторона",
        weight: "легко",
        restSec: 30,
        notes: "Работать без боли.",
        actualSets: 0
      }
    ],
    messages: [
      {
        id: "msg-1",
        coachId,
        studentId,
        senderId: coachId,
        body: "Сегодня следи за глубиной приседа. Если колено тянет - сразу пиши.",
        context: "Силовая B",
        createdAt: todayIso(-1)
      },
      {
        id: "msg-2",
        coachId,
        studentId,
        senderId: studentId,
        body: "Принял, сниму первое рабочее видео.",
        context: "Силовая B",
        createdAt: todayIso(-1)
      }
    ],
    transactions: [
      { id: "trx-1", userId: studentId, kind: "topup", amount: 15000, status: "success", note: "Пакет 8 тренировок", createdAt: todayIso(-8) },
      { id: "trx-2", userId: studentId, kind: "charge", amount: -2200, status: "success", note: "Списание за тренировку", createdAt: todayIso(-2) }
    ],
    checkins: [
      { id: "checkin-1", sessionId: sessionA, studentId, bodyWeightKg: 82.4, energy: 4, soreness: 2, note: "Сон нормальный, колено не беспокоит.", createdAt: todayIso(-1) },
      { id: "checkin-2", sessionId: sessionB, studentId, bodyWeightKg: 82.1, energy: 3, soreness: 4, note: "После тяги забились задние бедра.", createdAt: todayIso(-5) }
    ]
  };
}

function emptyState(role: Role): TrainingState {
  return {
    user: {
      id: "local-user",
      telegramId: "local",
      username: null,
      firstName: role === "coach" ? "Тренер" : "Ученик",
      role,
      createdAt: todayIso()
    },
    coach: null,
    students: [],
    plans: [],
    sessions: [],
    exercises: [],
    messages: [],
    transactions: [],
    checkins: []
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? "Сервер тренировок не ответил");
  }
  return response.json();
}

async function authenticate() {
  const initData = window.Telegram?.WebApp?.initData ?? "";
  if (!initData) return false;
  const response = await request<{ token: string }>("/training/api/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ initData })
  });
  localStorage.setItem(TOKEN_KEY, response.token);
  return true;
}

const api = {
  state: () => request<TrainingState>("/training/api/state"),
  setRole: (role: Role) => request<TrainingState>("/training/api/role", { method: "PATCH", body: JSON.stringify({ role }) }),
  createStudent: (body: { name: string; goal: string }) =>
    request<TrainingState>("/training/api/students", { method: "POST", body: JSON.stringify(body) }),
  createTemplatePlan: (studentId?: string | null) => request<TrainingState>("/training/api/plans/template", { method: "POST", body: JSON.stringify({ studentId }) }),
  updateSessionStatus: (sessionId: string, status: SessionStatus) =>
    request<TrainingState>(`/training/api/sessions/${sessionId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  updateExerciseProgress: (exerciseId: string, body: { actualSets?: number; weight?: string }) =>
    request<TrainingState>(`/training/api/exercises/${exerciseId}/progress`, { method: "PATCH", body: JSON.stringify(body) }),
  addCheckIn: (body: { sessionId: string; studentId?: string | null; bodyWeightKg?: number | null; energy: number; soreness: number; note?: string }) =>
    request<TrainingState>("/training/api/checkins", { method: "POST", body: JSON.stringify(body) }),
  addMessage: (body: { body: string; studentId?: string | null; context?: string | null }) =>
    request<TrainingState>("/training/api/messages", { method: "POST", body: JSON.stringify(body) }),
  topUp: (body: { amount: number; note: string; studentId?: string | null }) =>
    request<TrainingState>("/training/api/balance/top-up", { method: "POST", body: JSON.stringify(body) })
};

function haptic(type: "tap" | "success" | "warning" = "tap") {
  if (!telegramVersionAtLeast("6.1")) return;
  if (type === "success") {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
    return;
  }
  if (type === "warning") {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("warning");
    return;
  }
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
}

function telegramVersionAtLeast(minVersion: string) {
  const version = window.Telegram?.WebApp?.version;
  if (!version) return false;
  const current = version.split(".").map((part) => Number(part));
  const minimum = minVersion.split(".").map((part) => Number(part));
  for (let index = 0; index < Math.max(current.length, minimum.length); index += 1) {
    const left = current[index] ?? 0;
    const right = minimum[index] ?? 0;
    if (left > right) return true;
    if (left < right) return false;
  }
  return true;
}

function saveLocalState(state: TrainingState) {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
}

function loadLocalState(role: Role) {
  const raw = localStorage.getItem(LOCAL_STATE_KEY);
  if (!raw) return emptyState(role);
  try {
    const state = JSON.parse(raw) as TrainingState;
    return { ...state, user: { ...state.user, role }, checkins: state.checkins ?? [] };
  } catch {
    return emptyState(role);
  }
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;
  return (
    <div className="progress-ring" aria-label={`${label}: ${value}%`}>
      <svg viewBox="0 0 104 104">
        <circle cx="52" cy="52" r={radius} className="ring-bg" />
        <circle cx="52" cy="52" r={radius} className="ring-value" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div>
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: SessionStatus }) {
  const labels: Record<SessionStatus, string> = {
    planned: "запланировано",
    in_progress: "в работе",
    done: "выполнено",
    missed: "пропущено"
  };
  return <span className={`status status-${status}`}>{labels[status]}</span>;
}

function RoleSwitch({ role, locked, onChange }: { role: Role; locked?: boolean; onChange: (role: Role) => void }) {
  return (
    <div className="role-switch" aria-label="Выбор режима">
      <button className={role === "student" ? "active" : ""} disabled={locked && role !== "student"} onClick={() => onChange("student")}>
        Ученик
      </button>
      <button className={role === "coach" ? "active" : ""} disabled={locked && role !== "coach"} onClick={() => onChange("coach")}>
        Тренер
      </button>
    </div>
  );
}

function BottomNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const items: Array<{ tab: Tab; label: string; icon: typeof Activity }> = [
    { tab: "home", label: "Главная", icon: Activity },
    { tab: "plan", label: "План", icon: CalendarDays },
    { tab: "chat", label: "Чат", icon: MessageCircle },
    { tab: "balance", label: "Баланс", icon: WalletCards }
  ];
  return (
    <nav className="bottom-nav" aria-label="Основное меню">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.tab} className={tab === item.tab ? "active" : ""} onClick={() => onChange(item.tab)}>
            <Icon size={21} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function useTrainingApp() {
  const [role, setRoleState] = useState<Role>(() => (localStorage.getItem(LOCAL_ROLE_KEY) as Role | null) ?? "student");
  const [isDemo, setDemoState] = useState(() => localStorage.getItem(LOCAL_DEMO_KEY) !== "false");
  const [state, setState] = useState<TrainingState>(() =>
    localStorage.getItem(LOCAL_DEMO_KEY) === "false" ? loadLocalState((localStorage.getItem(LOCAL_ROLE_KEY) as Role | null) ?? "student") : demoState((localStorage.getItem(LOCAL_ROLE_KEY) as Role | null) ?? "student")
  );
  const [remoteAvailable, setRemoteAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("Готовим спортивный штаб");

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
    let cancelled = false;

    async function boot() {
      try {
        const hasSession = await authenticate();
        if (cancelled) return;
        setRemoteAvailable(hasSession);
        if (hasSession && !isDemo) {
          const remoteState = await api.state();
          if (!cancelled) {
            setState(remoteState);
            setRoleState(remoteState.user.role);
            localStorage.setItem(LOCAL_ROLE_KEY, remoteState.user.role);
          }
        } else if (!isDemo) {
          setState(loadLocalState(role));
        }
        setToast(hasSession ? "Синхронизировано с Telegram" : "Локальный режим для теста на ПК");
      } catch (error) {
        setRemoteAvailable(false);
        setToast(error instanceof Error ? error.message : "Работаем локально");
        if (!isDemo) setState(loadLocalState(role));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [isDemo, role]);

  useEffect(() => {
    localStorage.setItem(LOCAL_ROLE_KEY, role);
    if (isDemo) {
      setState(demoState(role));
      return;
    }
    saveLocalState({ ...state, user: { ...state.user, role } });
  }, [role, isDemo]);

  const setRole = async (nextRole: Role) => {
    haptic();
    setRoleState(nextRole);
    if (isDemo) {
      setState(demoState(nextRole));
      return;
    }
    setState((current) => ({ ...current, user: { ...current.user, role: nextRole } }));
    if (remoteAvailable) {
      try {
        setState(await api.setRole(nextRole));
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Роль сохранена локально");
      }
    }
  };

  const setDemo = (value: boolean) => {
    haptic(value ? "success" : "tap");
    localStorage.setItem(LOCAL_DEMO_KEY, String(value));
    setDemoState(value);
    setState(value ? demoState(role) : loadLocalState(role));
  };

  const commitState = (next: TrainingState) => {
    setState(next);
    if (!isDemo) saveLocalState(next);
  };

  return {
    role,
    state,
    isDemo,
    remoteAvailable,
    loading,
    toast,
    setToast,
    setRole,
    setDemo,
    commitState
  };
}

export function App() {
  const { role, state, isDemo, remoteAvailable, loading, toast, setToast, setRole, setDemo, commitState } = useTrainingApp();
  const [tab, setTab] = useState<Tab>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lessonStep, setLessonStep] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const ownBalance = useMemo(() => state.transactions.filter((transaction) => transaction.status === "success" && transaction.userId === state.user.id).reduce((sum, transaction) => sum + transaction.amount, 0), [state.transactions, state.user.id]);
  const activeSession = useMemo(
    () => state.sessions.find((session) => session.status === "in_progress") ?? state.sessions.find((session) => session.status === "planned") ?? state.sessions[0],
    [state.sessions]
  );
  const activeExercises = useMemo(() => state.exercises.filter((exercise) => exercise.sessionId === activeSession?.id), [state.exercises, activeSession]);
  const completedSets = activeExercises.reduce((sum, exercise) => sum + exercise.actualSets, 0);
  const plannedSets = activeExercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const completion = plannedSets ? Math.round((completedSets / plannedSets) * 100) : 0;

  const chartData = useMemo(
    () =>
      [6, 5, 4, 3, 2, 1, 0].map((daysAgo, index) => ({
        name: new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)),
        load: role === "coach" ? 54 + index * 7 + (index % 2 ? 8 : 0) : 28 + index * 9,
        focus: role === "coach" ? 70 + index * 3 : 62 + index * 4
      })),
    [role]
  );
  const hasLiveData = state.students.length > 0 || state.plans.length > 0 || state.sessions.length > 0 || state.messages.length > 0 || state.transactions.length > 0 || (state.checkins ?? []).length > 0;
  const roleLocked = !isDemo && remoteAvailable && hasLiveData;
  const selectedStudent = role === "coach" ? state.students.find((student) => student.id === selectedStudentId) ?? state.students[0] ?? null : null;
  const visibleBalance = role === "coach" && selectedStudent ? selectedStudent.balance : ownBalance;
  const latestCheckIn = useMemo(() => {
    const targetStudentId = role === "coach" ? selectedStudent?.id : state.user.id;
    if (!targetStudentId) return null;
    return [...(state.checkins ?? [])]
      .filter((checkin) => checkin.studentId === targetStudentId)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0] ?? null;
  }, [role, selectedStudent?.id, state.checkins, state.user.id]);

  useEffect(() => {
    if (role !== "coach") return;
    if (!selectedStudentId && state.students[0]) {
      setSelectedStudentId(state.students[0].id);
      return;
    }
    if (selectedStudentId && !state.students.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(state.students[0]?.id ?? null);
    }
  }, [role, selectedStudentId, state.students]);

  const refreshFromApi = async (fallback: TrainingState) => {
    if (!remoteAvailable || isDemo) {
      commitState(fallback);
      return;
    }
    try {
      commitState(await api.state());
    } catch (error) {
      commitState(fallback);
      setToast(error instanceof Error ? error.message : "Изменения сохранены локально");
    }
  };

  const handleCreateStudent = async (name: string, goal: string) => {
    const nextStudent: Student = {
      id: id("student"),
      name,
      username: null,
      goal,
      risk: "green",
      compliance: 100,
      balance: 0
    };
    const fallback = { ...state, students: [nextStudent, ...state.students] };
    if (!remoteAvailable || isDemo) {
      commitState(fallback);
      haptic("success");
      setToast("Ученик добавлен в локальный список");
      return;
    }
    try {
      commitState(await api.createStudent({ name, goal }));
      haptic("success");
      setToast("Ученик добавлен");
    } catch (error) {
      commitState(fallback);
      setToast(error instanceof Error ? error.message : "Ученик сохранен локально");
    }
  };

  const handleCreatePlan = async () => {
    const planId = id("plan");
    const studentId = selectedStudent?.id ?? state.students[0]?.id ?? null;
    const sessionId = id("session");
    const fallback: TrainingState = {
      ...state,
      plans: [
        {
          id: planId,
          coachId: state.user.id,
          studentId,
          title: "Новая силовая неделя",
          goal: "Стабильная техника и прогресс без перегруза",
          startDate: todayIso(),
          weeks: 4,
          status: "active"
        },
        ...state.plans
      ],
      sessions: [
        {
          id: sessionId,
          planId,
          coachId: state.user.id,
          studentId,
          title: "Full Body A",
          scheduledDate: todayIso(),
          status: "planned",
          focus: "Сила",
          durationMin: 45,
          intensity: 6
        },
        ...state.sessions
      ],
      exercises: [
        { id: id("exercise"), sessionId, name: "Присед с паузой", sets: 4, reps: "5", weight: "RPE 7", restSec: 120, notes: "Пауза 1 сек внизу.", actualSets: 0 },
        { id: id("exercise"), sessionId, name: "Жим гантелей", sets: 3, reps: "8", weight: "умеренно", restSec: 90, notes: "Контроль лопаток.", actualSets: 0 },
        ...state.exercises
      ]
    };
    if (!remoteAvailable || isDemo) {
      commitState(fallback);
      haptic("success");
      setToast("Шаблон недели создан");
      setTab("plan");
      return;
    }
    try {
      commitState(await api.createTemplatePlan(studentId));
      haptic("success");
      setToast("План создан и готов к назначению");
      setTab("plan");
    } catch (error) {
      commitState(fallback);
      setToast(error instanceof Error ? error.message : "План сохранен локально");
    }
  };

  const updateSessionStatus = async (sessionId: string, status: SessionStatus) => {
    const fallback = { ...state, sessions: state.sessions.map((session) => (session.id === sessionId ? { ...session, status } : session)) };
    if (!remoteAvailable || isDemo) {
      commitState(fallback);
      haptic(status === "done" ? "success" : "tap");
      return;
    }
    try {
      commitState(await api.updateSessionStatus(sessionId, status));
      haptic(status === "done" ? "success" : "tap");
    } catch (error) {
      commitState(fallback);
      setToast(error instanceof Error ? error.message : "Статус сохранен локально");
    }
  };

  const updateExerciseProgress = async (exerciseId: string, patch: { actualSets?: number; weight?: string }) => {
    const next = {
      ...state,
      exercises: state.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...patch } : exercise
      )
    };
    if (!remoteAvailable || isDemo) {
      commitState(next);
      return;
    }
    try {
      commitState(await api.updateExerciseProgress(exerciseId, patch));
    } catch (error) {
      commitState(next);
      setToast(error instanceof Error ? error.message : "Факт упражнения сохранен локально");
    }
  };

  const markSet = (exerciseId: string) => {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    void updateExerciseProgress(exerciseId, { actualSets: Math.min(exercise.sets, exercise.actualSets + 1) });
    haptic();
  };

  const resetExercise = (exerciseId: string) => {
    void updateExerciseProgress(exerciseId, { actualSets: 0 });
    haptic("warning");
  };

  const updateExerciseWeight = (exerciseId: string, weight: string) => {
    const normalized = weight.trim().replace(",", ".");
    if (!normalized) return;
    void updateExerciseProgress(exerciseId, { weight: normalized.match(/[а-яa-z%]/i) ? normalized : `${normalized} кг` });
    haptic("success");
    setToast("Рабочий вес сохранен");
  };

  const addCheckIn = async (input: { bodyWeightKg: number | null; energy: number; soreness: number; note: string }) => {
    if (!activeSession) {
      setToast("Сначала создайте тренировку");
      return;
    }
    const targetStudentId = role === "coach" ? selectedStudent?.id ?? activeSession.studentId ?? state.students[0]?.id ?? state.user.id : state.user.id;
    const checkin: CheckIn = {
      id: id("checkin"),
      sessionId: activeSession.id,
      studentId: targetStudentId,
      bodyWeightKg: input.bodyWeightKg,
      energy: input.energy,
      soreness: input.soreness,
      note: input.note,
      createdAt: todayIso()
    };
    const fallback = { ...state, checkins: [checkin, ...(state.checkins ?? [])] };
    if (!remoteAvailable || isDemo) {
      commitState(fallback);
      haptic("success");
      setToast("Чек-ин сохранен");
      return;
    }
    try {
      commitState(await api.addCheckIn({ ...input, sessionId: activeSession.id, studentId: targetStudentId }));
      haptic("success");
      setToast("Чек-ин синхронизирован");
    } catch (error) {
      commitState(fallback);
      setToast(error instanceof Error ? error.message : "Чек-ин сохранен локально");
    }
  };

  const sendMessage = async (body: string, context?: string | null) => {
    if (!body.trim()) return;
    const targetStudentId = role === "coach" ? selectedStudent?.id ?? state.students[0]?.id ?? state.user.id : state.user.id;
    const targetCoachId = role === "coach" ? state.user.id : state.coach?.id ?? "coach-local";
    const fallback = {
      ...state,
      messages: [
        ...state.messages,
        {
          id: id("msg"),
          coachId: targetCoachId,
          studentId: targetStudentId,
          senderId: state.user.id,
          body,
          context: context ?? activeSession?.title ?? null,
          createdAt: todayIso()
        }
      ]
    };
    if (!remoteAvailable || isDemo) {
      commitState(fallback);
      haptic("success");
      return;
    }
    try {
      commitState(await api.addMessage({ body, studentId: role === "coach" ? targetStudentId : null, context }));
      haptic("success");
    } catch (error) {
      commitState(fallback);
      setToast(error instanceof Error ? error.message : "Сообщение сохранено локально");
    }
  };

  const topUp = async (amount: number, note: string) => {
    const targetUserId = role === "coach" ? selectedStudent?.id : state.user.id;
    if (!targetUserId) {
      setToast("Сначала выберите ученика для пополнения");
      haptic("warning");
      return;
    }
    const fallback = {
      ...state,
      students: role === "coach" ? state.students.map((student) => (student.id === targetUserId ? { ...student, balance: student.balance + amount } : student)) : state.students,
      transactions: [{ id: id("trx"), userId: targetUserId, kind: "topup" as const, amount, status: "success" as const, note, createdAt: todayIso() }, ...state.transactions]
    };
    if (!remoteAvailable || isDemo) {
      commitState(fallback);
      haptic("success");
      setToast("Баланс пополнен в демо-режиме");
      return;
    }
    try {
      commitState(await api.topUp({ amount, note, studentId: role === "coach" ? targetUserId : null }));
      haptic("success");
      setToast("Заявка на пополнение создана");
    } catch (error) {
      commitState(fallback);
      setToast(error instanceof Error ? error.message : "Пополнение сохранено локально");
    }
  };

  if (loading) {
    return (
      <main className="app-shell loading-shell">
        <div className="pulse-logo">
          <Dumbbell />
        </div>
        <p>{toast}</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="mesh mesh-a" />
      <div className="mesh mesh-b" />
      <header className="topbar">
        <div>
          <span className="eyebrow">Telegram Mini App</span>
          <h1>Тренировки</h1>
        </div>
        <button className="ghost-button" aria-label="Открыть меню" onClick={() => setMenuOpen(true)}>
          <Sparkles size={19} />
        </button>
      </header>

      {tab === "home" ? (
        <section className="hero-card">
          <RoleSwitch role={role} locked={roleLocked} onChange={setRole} />
          <div className="hero-copy">
            <span className="live-dot">
              <Radio size={14} />
              {isDemo ? "демо включено" : remoteAvailable ? "данные сохраняются" : "локальный режим"}
            </span>
            <h2>{role === "coach" ? "Кому вы нужны сейчас?" : activeSession ? "Что делаем сегодня?" : "Начните с плана"}</h2>
            <p>
              {role === "coach"
                ? selectedStudent
                  ? `Выбран ученик: ${selectedStudent.name}. Планы и чат пойдут только ему.`
                  : "Очередь внимания, ученики с риском и быстрые действия тренера в одном экране."
                : activeSession
                  ? `${activeSession.title} · ${activeSession.durationMin} мин · нагрузка ${activeSession.intensity}/10`
                  : "Откройте демо или попросите тренера назначить первую тренировку."}
            </p>
            {roleLocked && <small className="lock-note">Роль закреплена, потому что в кабинете уже есть рабочие данные.</small>}
          </div>
        </section>
      ) : (
        <section className="compact-context">
          <span className="live-dot">
            <Radio size={14} />
            {isDemo ? "демо" : remoteAvailable ? "live" : "local"}
          </span>
          <strong>{role === "coach" && selectedStudent ? selectedStudent.name : activeSession?.title ?? "Тренировки"}</strong>
        </section>
      )}

      <div className="toast-line" role="status">
        {toast}
      </div>

      {tab === "home" && (
        <HomeScreen
          role={role}
          state={state}
          activeSession={activeSession}
          activeExercises={activeExercises}
          completion={completion}
          balance={visibleBalance}
          chartData={chartData}
          latestCheckIn={latestCheckIn}
          onCreatePlan={handleCreatePlan}
          onCreateStudent={handleCreateStudent}
          selectedStudentId={selectedStudentId}
          onSelectStudent={setSelectedStudentId}
          onStartSession={(sessionId) => updateSessionStatus(sessionId, "in_progress")}
          onCompleteSession={(sessionId) => updateSessionStatus(sessionId, "done")}
          onMarkSet={markSet}
          onResetExercise={resetExercise}
          onUpdateExerciseWeight={updateExerciseWeight}
          onAddCheckIn={addCheckIn}
        />
      )}
      {tab === "plan" && (
        <PlanScreen
          role={role}
          state={state}
          activeSession={activeSession}
          activeExercises={activeExercises}
          onCreatePlan={handleCreatePlan}
          onUpdateStatus={updateSessionStatus}
        />
      )}
      {tab === "chat" && <ChatScreen role={role} state={state} selectedStudentId={selectedStudent?.id ?? null} onSelectStudent={setSelectedStudentId} activeSession={activeSession} onSend={sendMessage} />}
      {tab === "balance" && <BalanceScreen role={role} state={state} selectedStudent={selectedStudent} balance={visibleBalance} onTopUp={topUp} />}

      <BottomNav tab={tab} onChange={setTab} />

      {menuOpen && (
        <MenuSheet
          role={role}
          state={state}
          isDemo={isDemo}
          remoteAvailable={remoteAvailable}
          onClose={() => setMenuOpen(false)}
          onDemo={setDemo}
          onOpenLesson={() => {
            setLessonStep(0);
            setLessonOpen(true);
          }}
        />
      )}

      {lessonOpen && (
        <LessonSheet
          role={role}
          step={lessonStep}
          onBack={() => setLessonStep((current) => Math.max(0, current - 1))}
          onNext={() => setLessonStep((current) => Math.min(trainingSteps(role).length - 1, current + 1))}
          onClose={() => setLessonOpen(false)}
        />
      )}
    </main>
  );
}

function HomeScreen(props: {
  role: Role;
  state: TrainingState;
  activeSession?: Session;
  activeExercises: Exercise[];
  completion: number;
  balance: number;
  chartData: Array<{ name: string; load: number; focus: number }>;
  latestCheckIn: CheckIn | null;
  onCreatePlan: () => void;
  onCreateStudent: (name: string, goal: string) => void;
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
  onStartSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
  onMarkSet: (exerciseId: string) => void;
  onResetExercise: (exerciseId: string) => void;
  onUpdateExerciseWeight: (exerciseId: string, weight: string) => void;
  onAddCheckIn: (input: { bodyWeightKg: number | null; energy: number; soreness: number; note: string }) => void;
}) {
  if (props.role === "coach") {
    return <CoachHome {...props} />;
  }
  return <StudentHome {...props} />;
}

function CoachHome({
  state,
  chartData,
  onCreatePlan,
  onCreateStudent,
  selectedStudentId,
  onSelectStudent,
  latestCheckIn
}: {
  state: TrainingState;
  chartData: Array<{ name: string; load: number; focus: number }>;
  onCreatePlan: () => void;
  onCreateStudent: (name: string, goal: string) => void;
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
  latestCheckIn: CheckIn | null;
}) {
  const risky = state.students.filter((student) => student.risk !== "green").length;
  const [studentDraft, setStudentDraft] = useState({ name: "", goal: "" });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!studentDraft.name.trim()) return;
    onCreateStudent(studentDraft.name.trim(), studentDraft.goal.trim() || "Персональное ведение");
    setStudentDraft({ name: "", goal: "" });
  };

  return (
    <div className="screen-stack">
      <section className="metrics-grid">
        <Metric icon={Users} label="Активных" value={String(state.students.length)} hint="учеников" />
        <Metric icon={ShieldCheck} label="Внимание" value={String(risky)} hint="риска" tone={risky ? "warn" : "ok"} />
        <Metric icon={CircleDollarSign} label="Баланс" value={rub(state.students.reduce((sum, student) => sum + student.balance, 0))} hint="по ученикам" />
      </section>

      <section className="panel">
        <div className="section-title">
          <div>
            <span className="eyebrow">Очередь тренера</span>
            <h3>Кому ответить первым</h3>
          </div>
          <button className="mini-button" onClick={onCreatePlan}>
            <Plus size={16} />
            План
          </button>
        </div>
        <div className="attention-list">
          {(state.students.length ? state.students : [{ id: "empty", name: "Пока нет учеников", goal: "Добавьте первого ученика ниже", risk: "yellow" as const, compliance: 0, balance: 0, username: null }]).map((student) => (
            <button className={`student-card ${selectedStudentId === student.id ? "selected" : ""}`} key={student.id} onClick={() => onSelectStudent(student.id)}>
              <div className={`avatar risk-${student.risk}`}>{student.name.slice(0, 1)}</div>
              <div>
                <strong>{student.name}</strong>
                <span>{student.goal}</span>
              </div>
              <ProgressRing value={student.compliance} label="неделя" />
            </button>
          ))}
        </div>
      </section>

      <section className="panel insight-panel">
        <div className="section-title">
          <div>
            <span className="eyebrow">Контроль факта</span>
            <h3>Последний чек-ин</h3>
          </div>
          <HeartPulse className="accent-icon" />
        </div>
        {latestCheckIn ? (
          <div className="insight-grid">
            <Metric icon={Scale} label="Вес тела" value={latestCheckIn.bodyWeightKg ? `${latestCheckIn.bodyWeightKg} кг` : "не указан"} hint={dateLabel(latestCheckIn.createdAt)} />
            <Metric icon={Zap} label="Энергия" value={`${latestCheckIn.energy}/5`} hint="сегодня" tone={latestCheckIn.energy <= 2 ? "warn" : "ok"} />
            <Metric icon={Activity} label="Забитость" value={`${latestCheckIn.soreness}/10`} hint="самочувствие" tone={latestCheckIn.soreness >= 7 ? "warn" : "ok"} />
            <p className="insight-note">{latestCheckIn.note || "Комментария нет."}</p>
          </div>
        ) : (
          <div className="empty-inline">Пока нет чек-инов ученика. Попросите заполнить вес и самочувствие перед тренировкой.</div>
        )}
      </section>

      <section className="chart-panel">
        <div className="section-title">
          <div>
            <span className="eyebrow">Пульс недели</span>
            <h3>Нагрузка и фокус</h3>
          </div>
          <Flame className="accent-icon" />
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ left: -22, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="load" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b7ff2a" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#b7ff2a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8d98a8", fontSize: 11 }} />
            <YAxis hide domain={[0, 120]} />
            <Tooltip contentStyle={{ background: "#11151b", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, color: "#f4f7fa" }} />
            <Area type="monotone" dataKey="load" stroke="#b7ff2a" strokeWidth={3} fill="url(#load)" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <form className="quick-form" onSubmit={submit}>
        <div>
          <span className="eyebrow">Быстрый старт</span>
          <h3>Добавить ученика</h3>
        </div>
        <input aria-label="Имя ученика" placeholder="Имя ученика" value={studentDraft.name} onChange={(event) => setStudentDraft((draft) => ({ ...draft, name: event.target.value }))} />
        <input aria-label="Цель ученика" placeholder="Цель: сила, похудение, техника" value={studentDraft.goal} onChange={(event) => setStudentDraft((draft) => ({ ...draft, goal: event.target.value }))} />
        <button className="primary-button" type="submit">
          <UserPlus size={18} />
          Добавить
        </button>
      </form>
    </div>
  );
}

function StudentHome({
  activeSession,
  activeExercises,
  completion,
  balance,
  chartData,
  onCreatePlan,
  onStartSession,
  onCompleteSession,
  onMarkSet,
  onResetExercise,
  onUpdateExerciseWeight,
  onAddCheckIn,
  latestCheckIn
}: {
  activeSession?: Session;
  activeExercises: Exercise[];
  completion: number;
  balance: number;
  chartData: Array<{ name: string; load: number; focus: number }>;
  onCreatePlan: () => void;
  onStartSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
  onMarkSet: (exerciseId: string) => void;
  onResetExercise: (exerciseId: string) => void;
  onUpdateExerciseWeight: (exerciseId: string, weight: string) => void;
  onAddCheckIn: (input: { bodyWeightKg: number | null; energy: number; soreness: number; note: string }) => void;
  latestCheckIn: CheckIn | null;
}) {
  const [editingWeight, setEditingWeight] = useState<Exercise | null>(null);

  if (!activeSession) {
    return (
      <div className="empty-state">
        <Dumbbell size={42} />
        <h3>План пока пустой</h3>
        <p>Включите демо в меню или создайте первую тренировку из шаблона, чтобы протестировать сценарий ученика.</p>
        <button className="primary-button" onClick={onCreatePlan}>
          Создать демо-план
        </button>
      </div>
    );
  }

  return (
    <div className="screen-stack">
      <section className="workout-card">
        <div className="workout-orbit">
          <ProgressRing value={completion} label="готово" />
          <span className="scan-line" />
        </div>
        <div className="workout-info">
          <StatusPill status={activeSession.status} />
          <h3>{activeSession.title}</h3>
          <p>{activeSession.focus} · {activeSession.durationMin} мин · {timeLabel(activeSession.scheduledDate)}</p>
          <div className="cta-row">
            {activeSession.status !== "in_progress" && activeSession.status !== "done" && (
              <button className="primary-button" onClick={() => onStartSession(activeSession.id)}>
                <Zap size={18} />
                Начать
              </button>
            )}
            <button className="secondary-button" onClick={() => onCompleteSession(activeSession.id)}>
              <Check size={18} />
              Завершить
            </button>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <Metric icon={Activity} label="Нагрузка" value={`${activeSession.intensity}/10`} hint="средняя" />
        <Metric icon={WalletCards} label="Баланс" value={rub(balance)} hint="занятия" tone={balance < 0 ? "warn" : "ok"} />
        <Metric icon={Flame} label="Серия" value="4" hint="дня" />
      </section>

      <section className="panel">
        <div className="section-title">
          <div>
            <span className="eyebrow">Тренировка</span>
            <h3>Подходы на сегодня</h3>
          </div>
          <span className="tiny-badge">{activeExercises.length} упражн.</span>
        </div>
        <div className="exercise-list">
          {activeExercises.map((exercise) => (
            <article className="exercise-card" key={exercise.id}>
              <div>
                <strong>{exercise.name}</strong>
                <span>{exercise.sets} × {exercise.reps} · отдых {exercise.restSec} сек</span>
                <button className="weight-chip" onClick={() => setEditingWeight(exercise)} aria-label={`Изменить вес ${exercise.name}`}>
                  <Scale size={14} />
                  {exercise.weight}
                </button>
                <p>{exercise.notes}</p>
              </div>
              <div className="set-control">
                <button onClick={() => onResetExercise(exercise.id)} aria-label={`Сбросить ${exercise.name}`}>
                  −
                </button>
                <b>{exercise.actualSets}/{exercise.sets}</b>
                <button onClick={() => onMarkSet(exercise.id)} aria-label={`Отметить подход ${exercise.name}`}>
                  +
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CheckInPanel latestCheckIn={latestCheckIn} onAddCheckIn={onAddCheckIn} />

      <section className="chart-panel">
        <div className="section-title">
          <div>
            <span className="eyebrow">Прогресс</span>
            <h3>Последние 7 дней</h3>
          </div>
          <Activity className="accent-icon" />
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={chartData} margin={{ left: -22, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="focus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2fe7ff" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#2fe7ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8d98a8", fontSize: 11 }} />
            <YAxis hide domain={[0, 120]} />
            <Tooltip contentStyle={{ background: "#11151b", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, color: "#f4f7fa" }} />
            <Area type="monotone" dataKey="focus" stroke="#2fe7ff" strokeWidth={3} fill="url(#focus)" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {editingWeight && (
        <WeightSheet
          exercise={editingWeight}
          onClose={() => setEditingWeight(null)}
          onSave={(value) => {
            onUpdateExerciseWeight(editingWeight.id, value);
            setEditingWeight(null);
          }}
        />
      )}
    </div>
  );
}

function WeightSheet({ exercise, onClose, onSave }: { exercise: Exercise; onClose: () => void; onSave: (value: string) => void }) {
  const [value, setValue] = useState(exercise.weight.replace(/[^\d,.]/g, "") || exercise.weight);
  const quick = ["-2.5", "+2.5", "+5"];
  const numeric = Number(value.replace(",", "."));

  const nudge = (delta: number) => {
    const base = Number.isFinite(numeric) ? numeric : 0;
    setValue(String(Math.max(0, base + delta)).replace(".", ","));
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true">
      <section className="sheet compact-sheet">
        <button className="sheet-close" onClick={onClose} aria-label="Закрыть ввод веса">
          <ArrowLeft size={18} />
        </button>
        <span className="eyebrow">Факт упражнения</span>
        <h3>{exercise.name}</h3>
        <label className="field-label" htmlFor="exercise-weight-input">Рабочий вес</label>
        <input id="exercise-weight-input" aria-label="Рабочий вес" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value.replace(/[^\d,.]/g, ""))} />
        <div className="quick-replies">
          {quick.map((item) => (
            <button key={item} onClick={() => nudge(Number(item))}>
              {item} кг
            </button>
          ))}
        </div>
        <button className="primary-button full-width" onClick={() => onSave(value)}>
          Сохранить вес
        </button>
      </section>
    </div>
  );
}

function CheckInPanel({ latestCheckIn, onAddCheckIn }: { latestCheckIn: CheckIn | null; onAddCheckIn: (input: { bodyWeightKg: number | null; energy: number; soreness: number; note: string }) => void }) {
  const [bodyWeight, setBodyWeight] = useState(latestCheckIn?.bodyWeightKg ? String(latestCheckIn.bodyWeightKg).replace(".", ",") : "");
  const [energy, setEnergy] = useState(latestCheckIn?.energy ?? 4);
  const [soreness, setSoreness] = useState(latestCheckIn?.soreness ?? 2);
  const [note, setNote] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedWeight = Number(bodyWeight.replace(",", "."));
    onAddCheckIn({
      bodyWeightKg: Number.isFinite(parsedWeight) && parsedWeight > 0 ? Math.round(parsedWeight * 10) / 10 : null,
      energy,
      soreness,
      note: note.trim()
    });
    setNote("");
  };

  return (
    <section className="panel checkin-panel">
      <div className="section-title">
        <div>
          <span className="eyebrow">Чек-ин</span>
          <h3>Вес и самочувствие</h3>
        </div>
        <HeartPulse className="accent-icon" />
      </div>
      {latestCheckIn && (
        <div className="latest-checkin">
          <span>{dateLabel(latestCheckIn.createdAt)}</span>
          <strong>{latestCheckIn.bodyWeightKg ? `${latestCheckIn.bodyWeightKg} кг` : "вес не указан"}</strong>
          <small>энергия {latestCheckIn.energy}/5 · забитость {latestCheckIn.soreness}/10</small>
        </div>
      )}
      <form className="checkin-form" onSubmit={submit}>
        <label>
          <span>Вес тела, кг</span>
          <input aria-label="Вес тела" inputMode="decimal" placeholder="82,4" value={bodyWeight} onChange={(event) => setBodyWeight(event.target.value.replace(/[^\d,.]/g, ""))} />
        </label>
        <div className="rating-row" aria-label="Энергия">
          <span>Энергия</span>
          {[1, 2, 3, 4, 5].map((item) => (
            <button type="button" className={energy === item ? "active" : ""} key={item} onClick={() => setEnergy(item)}>
              {item}
            </button>
          ))}
        </div>
        <label>
          <span>Боль/забитость: {soreness}/10</span>
          <input aria-label="Боль или забитость" type="range" min="0" max="10" value={soreness} onChange={(event) => setSoreness(Number(event.target.value))} />
        </label>
        <input aria-label="Комментарий к самочувствию" placeholder="Сон, боль, что изменить..." value={note} onChange={(event) => setNote(event.target.value)} />
        <button className="primary-button" type="submit">
          Сохранить чек-ин
        </button>
      </form>
    </section>
  );
}

function PlanScreen({
  role,
  state,
  activeSession,
  activeExercises,
  onCreatePlan,
  onUpdateStatus
}: {
  role: Role;
  state: TrainingState;
  activeSession?: Session;
  activeExercises: Exercise[];
  onCreatePlan: () => void;
  onUpdateStatus: (sessionId: string, status: SessionStatus) => void;
}) {
  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-title">
          <div>
            <span className="eyebrow">{role === "coach" ? "Планирование" : "Календарь"}</span>
            <h3>{role === "coach" ? "Шаблоны и назначения" : "Ближайшие занятия"}</h3>
          </div>
          {role === "coach" && (
            <button className="mini-button" onClick={onCreatePlan}>
              <Plus size={16} />
              Неделя
            </button>
          )}
        </div>
        <div className="timeline">
          {(state.sessions.length ? state.sessions : []).map((session) => (
            <article className={`timeline-item ${session.id === activeSession?.id ? "active" : ""}`} key={session.id}>
              <div className="date-chip">
                <strong>{dateLabel(session.scheduledDate)}</strong>
                <span>{timeLabel(session.scheduledDate)}</span>
              </div>
              <div>
                <StatusPill status={session.status} />
                <h4>{session.title}</h4>
                <p>{session.focus} · {session.durationMin} мин · нагрузка {session.intensity}/10</p>
              </div>
              <button className="icon-button" onClick={() => onUpdateStatus(session.id, session.status === "done" ? "planned" : "done")} aria-label="Изменить статус">
                <Check size={18} />
              </button>
            </article>
          ))}
          {!state.sessions.length && (
            <div className="empty-inline">
              <Dumbbell />
              <span>Пока нет тренировок. Создайте неделю из шаблона.</span>
            </div>
          )}
        </div>
      </section>

      {activeSession && (
        <section className="panel">
          <div className="section-title">
            <div>
              <span className="eyebrow">Содержимое</span>
              <h3>{activeSession.title}</h3>
            </div>
            <span className="tiny-badge">{activeExercises.length} блоков</span>
          </div>
          {activeExercises.map((exercise) => (
            <article className="program-line" key={exercise.id}>
              <Dumbbell size={20} />
              <div>
                <strong>{exercise.name}</strong>
                <span>{exercise.sets} × {exercise.reps} · {exercise.weight}</span>
              </div>
              <ChevronRight size={18} />
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function ChatScreen({
  role,
  state,
  selectedStudentId,
  onSelectStudent,
  activeSession,
  onSend
}: {
  role: Role;
  state: TrainingState;
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
  activeSession?: Session;
  onSend: (body: string, context?: string | null) => void;
}) {
  const [message, setMessage] = useState("");
  const quickReplies = role === "coach" ? ["Проверь видео приседа", "Отличный темп, оставляем", "Снизь вес на 5 кг"] : ["Готово, отправил отчет", "Нужна замена упражнения", "Есть дискомфорт"];
  const filteredMessages = role === "coach" && selectedStudentId ? state.messages.filter((item) => item.studentId === selectedStudentId) : state.messages;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSend(message, activeSession?.title ?? null);
    setMessage("");
  };

  return (
    <div className="screen-stack">
      <section className="panel chat-panel">
        <div className="section-title">
          <div>
            <span className="eyebrow">Контекстный чат</span>
            <h3>{role === "coach" ? "Диалог с учеником" : "Связь с тренером"}</h3>
          </div>
          <MessageCircle className="accent-icon" />
        </div>
        <div className="context-card">
          <Bot size={18} />
          <span>Сообщения привязаны к тренировке: {activeSession?.title ?? "без активной тренировки"}.</span>
        </div>
        {role === "coach" && (
          <div className="student-selector" aria-label="Выбор ученика для чата">
            {state.students.map((student) => (
              <button key={student.id} className={selectedStudentId === student.id ? "active" : ""} onClick={() => onSelectStudent(student.id)}>
                {student.name}
              </button>
            ))}
            {!state.students.length && <span>Добавьте ученика, чтобы открыть персональный чат.</span>}
          </div>
        )}
        <div className="messages">
          {filteredMessages.map((item) => {
            const mine = item.senderId === state.user.id;
            return (
              <article className={`message ${mine ? "mine" : ""}`} key={item.id}>
                {item.context && <span>{item.context}</span>}
                <p>{item.body}</p>
                <small>{dateLabel(item.createdAt)} · {timeLabel(item.createdAt)}</small>
              </article>
            );
          })}
          {!filteredMessages.length && <div className="empty-inline">Здесь появятся сообщения по тренировкам.</div>}
        </div>
        <div className="quick-replies">
          {quickReplies.map((reply) => (
            <button key={reply} onClick={() => onSend(reply, activeSession?.title ?? null)}>
              {reply}
            </button>
          ))}
        </div>
        <form className="chat-form" onSubmit={submit}>
          <input aria-label="Сообщение" placeholder="Написать по тренировке..." value={message} onChange={(event) => setMessage(event.target.value)} />
          <button aria-label="Отправить сообщение" type="submit">
            <Send size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}

function BalanceScreen({
  role,
  state,
  selectedStudent,
  balance,
  onTopUp
}: {
  role: Role;
  state: TrainingState;
  selectedStudent: Student | null;
  balance: number;
  onTopUp: (amount: number, note: string) => void;
}) {
  const [customAmount, setCustomAmount] = useState("5000");
  const [pendingTopUp, setPendingTopUp] = useState<{ amount: number; note: string } | null>(null);
  const packages = [
    { label: "4 занятия", amount: 8800 },
    { label: "8 занятий", amount: 16000 },
    { label: "12 занятий", amount: 22800 }
  ];
  const visibleTransactions =
    role === "coach"
      ? state.transactions.filter((transaction) => (selectedStudent ? transaction.userId === selectedStudent.id : false))
      : state.transactions.filter((transaction) => transaction.userId === state.user.id || state.user.id === "demo-student");
  const targetName = role === "coach" ? selectedStudent?.name ?? "выберите ученика" : "ваш пакет";

  return (
    <div className="screen-stack">
      <section className="balance-hero">
        <span className="eyebrow">{role === "coach" ? `Баланс: ${targetName}` : "Ваш пакет"}</span>
        <h3>{rub(balance)}</h3>
        <p>{role === "coach" ? "Пополнение и история относятся только к выбранному ученику." : balance >= 0 ? "Доступно для занятий и проверок" : "Нужно пополнить до следующей тренировки"}</p>
        {role === "coach" && !selectedStudent && <p className="warning-text">Сначала выберите ученика на главном экране.</p>}
        <div className="balance-actions">
          {packages.map((item) => (
            <button key={item.label} disabled={role === "coach" && !selectedStudent} onClick={() => setPendingTopUp({ amount: item.amount, note: item.label })}>
              <strong>{item.label}</strong>
              <span>{rub(item.amount)}</span>
            </button>
          ))}
        </div>
      </section>

      {pendingTopUp && (
        <section className="confirm-card">
          <div>
            <span className="eyebrow">Подтверждение</span>
            <h3>{pendingTopUp.note}</h3>
            <p>Создать заявку на пополнение {targetName} на {rub(pendingTopUp.amount)}?</p>
          </div>
          <div className="confirm-actions">
            <button className="secondary-button" onClick={() => setPendingTopUp(null)}>
              Отмена
            </button>
            <button
              className="primary-button"
              onClick={() => {
                onTopUp(pendingTopUp.amount, pendingTopUp.note);
                setPendingTopUp(null);
              }}
            >
              Подтвердить
            </button>
          </div>
        </section>
      )}

      <section className="calculator-card">
        <div>
          <span className="eyebrow">Быстрое пополнение</span>
          <h3>Сумма вручную</h3>
        </div>
        <input inputMode="numeric" aria-label="Сумма пополнения" value={customAmount} onChange={(event) => setCustomAmount(event.target.value.replace(/[^\d]/g, ""))} />
        <div className="keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "⌫"].map((key) => (
            <button
              key={key}
              onClick={() => {
                if (key === "⌫") setCustomAmount((value) => value.slice(0, -1) || "0");
                else setCustomAmount((value) => (value === "0" ? key : value + key));
              }}
            >
              {key}
            </button>
          ))}
        </div>
        <button className="primary-button" disabled={Number(customAmount || 0) <= 0 || (role === "coach" && !selectedStudent)} onClick={() => setPendingTopUp({ amount: Number(customAmount || 0), note: "Ручное пополнение" })}>
          Создать заявку на {rub(Number(customAmount || 0))}
        </button>
      </section>

      <section className="panel">
        <div className="section-title">
          <div>
            <span className="eyebrow">Ledger</span>
            <h3>История операций</h3>
          </div>
        </div>
        <div className="transaction-list">
          {visibleTransactions.map((transaction) => (
            <article className="transaction" key={transaction.id}>
              <div className={transaction.amount >= 0 ? "trx-icon positive" : "trx-icon negative"}>
                <CircleDollarSign size={18} />
              </div>
              <div>
                <strong>{transaction.note}</strong>
                <span>{dateLabel(transaction.createdAt)} · {transaction.status === "success" ? "подтверждено" : "ожидает"}</span>
              </div>
              <b>{rub(transaction.amount)}</b>
            </article>
          ))}
          {!visibleTransactions.length && <div className="empty-inline">Операций пока нет.</div>}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, hint, tone }: { icon: typeof Activity; label: string; value: string; hint: string; tone?: "ok" | "warn" }) {
  return (
    <article className={`metric ${tone ? `metric-${tone}` : ""}`}>
      <Icon size={19} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

function MenuSheet({
  role,
  state,
  isDemo,
  remoteAvailable,
  onClose,
  onDemo,
  onOpenLesson
}: {
  role: Role;
  state: TrainingState;
  isDemo: boolean;
  remoteAvailable: boolean;
  onClose: () => void;
  onDemo: (value: boolean) => void;
  onOpenLesson: () => void;
}) {
  const checklist = role === "coach" ? coachChecklist(state) : studentChecklist(state);
  const modeAction = isDemo ? (remoteAvailable ? "Перейти к реальным данным" : "Создать локальные рабочие данные") : "Открыть демо-пример";
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true">
      <section className="sheet">
        <button className="sheet-close" onClick={onClose} aria-label="Закрыть меню">
          <ArrowLeft size={18} />
        </button>
        <span className="eyebrow">Меню продукта</span>
        <h3>Режимы и проверка</h3>
        <div className="toggle-card">
          <div>
            <strong>Демо-режим</strong>
            <span>Показывает заполненный пример без записи в реальные данные.</span>
          </div>
          <button className={isDemo ? "active" : ""} onClick={() => onDemo(!isDemo)}>
            {isDemo ? "Вкл" : "Выкл"}
          </button>
        </div>
        <button className="primary-button full-width" onClick={() => onDemo(!isDemo)}>
          {modeAction}
        </button>
        <button className="wide-row" onClick={onOpenLesson}>
          <Sparkles size={19} />
          <span>Открыть обучение</span>
          <ChevronRight size={18} />
        </button>
        <div className="checklist">
          <div className="section-title compact">
            <div>
              <span className="eyebrow">Чек-лист функций</span>
              <h3>{remoteAvailable ? "Сервер подключен" : "Можно тестировать локально"}</h3>
            </div>
          </div>
          {checklist.map((item) => (
            <div className="check-row" key={item.label}>
              <span className={item.done ? "done" : ""}>{item.done ? <Check size={14} /> : ""}</span>
              <p>{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function trainingSteps(role: Role) {
  if (role === "coach") {
    return [
      { title: "Сначала очередь внимания", text: "Главная показывает учеников с риском, ожидаемые оплаты и отчеты, чтобы тренер не искал проблемы вручную." },
      { title: "Создайте неделю из шаблона", text: "В плане нажмите «Неделя»: приложение создаст тренировку, упражнения и назначение первому ученику." },
      { title: "Смотрите факт", text: "Рабочий вес, энергия, забитость и комментарий превращают план в отчет, по которому можно корректировать нагрузку." },
      { title: "Баланс без бухгалтерии", text: "Пополнения и списания хранятся в ledger. Для первого релиза это ручное подтверждение, без риска задвоить платеж." },
      { title: "Чат с контекстом", text: "Сообщение хранит тренировку, к которой относится вопрос. Это не заменяет Telegram, а убирает хаос вокруг отчетов." }
    ];
  }
  return [
    { title: "Откройте и поймите день", text: "На главной всегда один следующий шаг: начать тренировку, продолжить подходы или написать тренеру." },
    { title: "Отмечайте подходы", text: "Плюс справа отмечает подход. Минус сбрасывает упражнение, если ошиблись или начали заново." },
    { title: "Записывайте вес", text: "Нажмите на вес в упражнении и внесите фактический рабочий вес. Тренеру не придется вытаскивать это из переписки." },
    { title: "Сделайте чек-ин", text: "Вес тела, энергия и забитость помогают понять, когда прогрессировать, а когда восстановиться." },
    { title: "Завершите тренировку", text: "После завершения статус уйдет в историю, а тренер увидит выполнение и сможет ответить в чате." },
    { title: "Следите за пакетом", text: "Баланс показывает доступные средства/занятия и дает быстрое пополнение одной рукой." }
  ];
}

function LessonSheet({
  role,
  step,
  onBack,
  onNext,
  onClose
}: {
  role: Role;
  step: number;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const steps = trainingSteps(role);
  const current = steps[step];
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true">
      <section className="sheet lesson-sheet">
        <button className="sheet-close" onClick={onClose} aria-label="Закрыть обучение">
          <ArrowLeft size={18} />
        </button>
        <span className="eyebrow">Обучение · шаг {step + 1}/{steps.length}</span>
        <h3>{current.title}</h3>
        <p>{current.text}</p>
        <div className="lesson-visual">
          <span />
          <span />
          <span />
        </div>
        <div className="lesson-actions">
          <button className="secondary-button" disabled={step === 0} onClick={onBack}>
            Назад
          </button>
          {step === steps.length - 1 ? (
            <button className="primary-button" onClick={onClose}>
              Готово
            </button>
          ) : (
            <button className="primary-button" onClick={onNext}>
              Далее
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function coachChecklist(state: TrainingState) {
  return [
    { label: "Выбран режим тренера", done: state.user.role === "coach" },
    { label: "Можно добавить ученика", done: true },
    { label: "Есть список учеников и риски", done: state.students.length > 0 },
    { label: "Тренер видит свежий чек-ин", done: (state.checkins ?? []).length > 0 },
    { label: "Можно создать план из шаблона", done: true },
    { label: "Есть контекстный чат", done: true },
    { label: "Есть ledger оплат", done: true },
    { label: "Демо не загрязняет реальные данные", done: true }
  ];
}

function studentChecklist(state: TrainingState) {
  return [
    { label: "Выбран режим ученика", done: state.user.role === "student" },
    { label: "Виден следующий шаг на сегодня", done: state.sessions.length > 0 },
    { label: "Можно отмечать подходы", done: state.exercises.length > 0 },
    { label: "Можно внести рабочий вес", done: state.exercises.length > 0 },
    { label: "Можно сохранить вес тела и самочувствие", done: (state.checkins ?? []).length > 0 },
    { label: "Можно завершить тренировку", done: true },
    { label: "Можно написать тренеру", done: true },
    { label: "Можно пополнить баланс", done: true },
    { label: "Есть обучение с кнопкой назад", done: true }
  ];
}
