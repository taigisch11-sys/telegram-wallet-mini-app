import type { DashboardStateDto } from "@wallet/shared";
import type { HistoryItemDto, TimeseriesPointDto } from "@wallet/shared";
import { recalculateLocalState } from "../lib/local-finance";

type DemoChartPeriod = "week" | "month" | "quarter" | "year";

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
  operations: [],
  plannedOperations: [],
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
  { date: "1н", netBalance: 92000, accountBalance: 104000, debtBalance: -12000, additionalExpenses: 0 },
  { date: "2н", netBalance: 101000, accountBalance: 112000, debtBalance: -11000, additionalExpenses: 1800 },
  { date: "3н", netBalance: 108000, accountBalance: 119000, debtBalance: -11000, additionalExpenses: 2400 },
  { date: "4н", netBalance: 106200, accountBalance: 116200, debtBalance: -10000, additionalExpenses: 3200 },
  { date: "5н", netBalance: 104800, accountBalance: 114800, debtBalance: -10000, additionalExpenses: 4400 }
];

export const demoTimeseriesByPeriod: Record<DemoChartPeriod, TimeseriesPointDto[]> = {
  week: [
    { date: "Пн", netBalance: 99200, accountBalance: 109200, debtBalance: -10000, additionalExpenses: 700 },
    { date: "Вт", netBalance: 100400, accountBalance: 110400, debtBalance: -10000, additionalExpenses: 1200 },
    { date: "Ср", netBalance: 101700, accountBalance: 111700, debtBalance: -10000, additionalExpenses: 1900 },
    { date: "Чт", netBalance: 103300, accountBalance: 113300, debtBalance: -10000, additionalExpenses: 2600 },
    { date: "Пт", netBalance: 104800, accountBalance: 114800, debtBalance: -10000, additionalExpenses: 3200 },
    { date: "Сб", netBalance: 104100, accountBalance: 114100, debtBalance: -10000, additionalExpenses: 3800 },
    { date: "Вс", netBalance: 104800, accountBalance: 114800, debtBalance: -10000, additionalExpenses: 4400 }
  ],
  month: demoTimeseries,
  quarter: [
    { date: "1н", netBalance: 62000, accountBalance: 82000, debtBalance: -20000, additionalExpenses: 1200 },
    { date: "2н", netBalance: 67500, accountBalance: 86500, debtBalance: -19000, additionalExpenses: 1800 },
    { date: "3н", netBalance: 71200, accountBalance: 89200, debtBalance: -18000, additionalExpenses: 2300 },
    { date: "4н", netBalance: 75800, accountBalance: 92800, debtBalance: -17000, additionalExpenses: 2600 },
    { date: "5н", netBalance: 80100, accountBalance: 96100, debtBalance: -16000, additionalExpenses: 3100 },
    { date: "6н", netBalance: 84200, accountBalance: 99200, debtBalance: -15000, additionalExpenses: 3600 },
    { date: "7н", netBalance: 88100, accountBalance: 102100, debtBalance: -14000, additionalExpenses: 3900 },
    { date: "8н", netBalance: 92500, accountBalance: 105500, debtBalance: -13000, additionalExpenses: 4300 },
    { date: "9н", netBalance: 96100, accountBalance: 108100, debtBalance: -12000, additionalExpenses: 4700 },
    { date: "10н", netBalance: 99500, accountBalance: 110500, debtBalance: -11000, additionalExpenses: 5100 },
    { date: "11н", netBalance: 102300, accountBalance: 112300, debtBalance: -10000, additionalExpenses: 5400 },
    { date: "12н", netBalance: 104800, accountBalance: 114800, debtBalance: -10000, additionalExpenses: 4400 }
  ],
  year: [
    { date: "Янв", netBalance: 38000, accountBalance: 68000, debtBalance: -30000, additionalExpenses: 12000 },
    { date: "Фев", netBalance: 44000, accountBalance: 72000, debtBalance: -28000, additionalExpenses: 12800 },
    { date: "Мар", netBalance: 51000, accountBalance: 77000, debtBalance: -26000, additionalExpenses: 13900 },
    { date: "Апр", netBalance: 59000, accountBalance: 83000, debtBalance: -24000, additionalExpenses: 15100 },
    { date: "Май", netBalance: 64000, accountBalance: 89000, debtBalance: -25000, additionalExpenses: 18000 },
    { date: "Июн", netBalance: 70500, accountBalance: 93500, debtBalance: -23000, additionalExpenses: 18400 },
    { date: "Июл", netBalance: 76200, accountBalance: 97200, debtBalance: -21000, additionalExpenses: 19100 },
    { date: "Авг", netBalance: 81600, accountBalance: 100600, debtBalance: -19000, additionalExpenses: 20400 },
    { date: "Сен", netBalance: 88000, accountBalance: 106000, debtBalance: -18000, additionalExpenses: 22000 },
    { date: "Окт", netBalance: 94400, accountBalance: 110400, debtBalance: -16000, additionalExpenses: 17600 },
    { date: "Ноя", netBalance: 100600, accountBalance: 113600, debtBalance: -13000, additionalExpenses: 9800 },
    { date: "Дек", netBalance: 104800, accountBalance: 114800, debtBalance: -10000, additionalExpenses: 4400 }
  ]
};
