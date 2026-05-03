import type { DashboardStateDto } from "@wallet/shared";
import type { HistoryItemDto, TimeseriesPointDto } from "@wallet/shared";
import { recalculateLocalState } from "../lib/local-finance";

const now = new Date();
const iso = (offsetDays: number) => new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString();

export const emptyState: DashboardStateDto = {
  user: {
    id: "local",
    telegramId: "local",
    username: null,
    firstName: null,
    createdAt: now.toISOString()
  },
  settings: {
    currentMonth: now.toISOString().slice(0, 7),
    startBalance: "0.00",
    editedBalance: null
  },
  balances: {
    accountBalance: "0.00",
    debtBalance: "0.00",
    netBalance: "0.00",
    calculatedBalance: "0.00",
    currentBalance: "0.00",
    additionalExpenses: "0.00",
    freeMoney: "0.00"
  },
  alerts: [],
  upcoming: [],
  accounts: [],
  debts: [],
  income: [],
  payments: [],
  latestSnapshot: null,
  counts: {}
};

export const mockState = emptyState;

export const demoState: DashboardStateDto = recalculateLocalState({
  ...emptyState,
  user: {
    ...emptyState.user,
    id: "demo-preview",
    telegramId: "demo-preview",
    firstName: "Демо"
  },
  settings: {
    ...emptyState.settings,
    startBalance: "12000.00",
    editedBalance: "104800.00"
  },
  accounts: [
    { id: "demo-account-card", name: "Основная карта", balance: "74600.00", createdAt: iso(-28) },
    { id: "demo-account-cash", name: "Наличные", balance: "12200.00", createdAt: iso(-18) },
    { id: "demo-account-save", name: "Резерв", balance: "28000.00", createdAt: iso(-10) }
  ],
  debts: [
    { id: "demo-debt-credit", name: "Кредитка", amount: "-10000.00", createdAt: iso(-12) }
  ],
  income: [
    {
      id: "demo-income-salary",
      name: "Зарплата",
      amount: "98000.00",
      plannedDate: iso(-2),
      expectedDate: null,
      actualDate: iso(-2),
      effectiveDate: iso(-2),
      status: "received_on_time",
      note: "Фиксированный доход уже получен"
    },
    {
      id: "demo-income-side",
      name: "Подработка",
      amount: "18000.00",
      plannedDate: iso(6),
      expectedDate: null,
      actualDate: null,
      effectiveDate: iso(6),
      status: "planned",
      note: null
    }
  ],
  payments: [
    {
      id: "demo-payment-rent",
      name: "Аренда",
      amount: "42000.00",
      plannedDate: iso(3),
      expectedDate: null,
      actualDate: null,
      effectiveDate: iso(3),
      status: "planned",
      note: null
    },
    {
      id: "demo-payment-internet",
      name: "Интернет",
      amount: "1200.00",
      plannedDate: iso(-1),
      expectedDate: null,
      actualDate: iso(-1),
      effectiveDate: iso(-1),
      status: "paid_on_time",
      note: null
    },
    {
      id: "demo-payment-credit",
      name: "Минимальный платёж",
      amount: "9000.00",
      plannedDate: iso(8),
      expectedDate: null,
      actualDate: null,
      effectiveDate: iso(8),
      status: "planned",
      note: null
    }
  ],
  latestSnapshot: {
    id: "demo-snapshot",
    accountBalance: "114800.00",
    debtBalance: "-10000.00",
    netBalance: "104800.00",
    createdAt: iso(0)
  }
});

export const demoHistory: HistoryItemDto[] = [
  {
    id: "demo-history-reconcile",
    type: "balance_reconciled",
    payload: { change: "+12 800 ₽", period: "Неделя", distributed: "Расходы распределены по дням" },
    createdAt: iso(0)
  },
  {
    id: "demo-history-payment",
    type: "payment_paid",
    payload: { name: "Интернет", amount: "1 200 ₽" },
    createdAt: iso(-1)
  },
  {
    id: "demo-history-income",
    type: "income_received",
    payload: { name: "Зарплата", amount: "98 000 ₽" },
    createdAt: iso(-2)
  }
];

export const demoTimeseries: TimeseriesPointDto[] = [
  { date: "Пн", netBalance: 92000, accountBalance: 104000, debtBalance: -12000, additionalExpenses: 0 },
  { date: "Вт", netBalance: 101000, accountBalance: 112000, debtBalance: -11000, additionalExpenses: 1800 },
  { date: "Ср", netBalance: 108000, accountBalance: 119000, debtBalance: -11000, additionalExpenses: 2400 },
  { date: "Чт", netBalance: 106200, accountBalance: 116200, debtBalance: -10000, additionalExpenses: 3200 },
  { date: "Пт", netBalance: 104800, accountBalance: 114800, debtBalance: -10000, additionalExpenses: 4400 }
];
