import type { DashboardStateDto } from "@wallet/shared";
import { Activity, AlertTriangle, BadgePercent, ShieldCheck, Target, WalletCards } from "lucide-react";
import { money } from "../../lib/format";

export const financialIndicatorChecklist = [
  "Свободные деньги после обязательств",
  "Покрытие ближайших обязательств",
  "Долговая нагрузка",
  "Исполнение плана",
  "Доля нераспределённого движения",
  "Чистая позиция"
];

export function FinancialIndicators({ state }: { state: DashboardStateDto }) {
  const accountBalance = Number(state.balances.accountBalance);
  const debtBalance = Number(state.balances.debtBalance);
  const currentBalance = Number(state.balances.currentBalance);
  const netBalance = Number(state.balances.netBalance);
  const additionalExpenses = Number(state.balances.additionalExpenses);
  const upcomingPayments = state.payments.filter((item) => item.status === "planned" || item.status === "overdue").reduce((sum, item) => sum + Number(item.amount), 0);
  const fixedItems = [...state.income, ...state.payments];
  const completedItems = fixedItems.filter((item) => item.status.includes("received") || item.status.includes("paid")).length;
  const planExecution = fixedItems.length === 0 ? 0 : (completedItems / fixedItems.length) * 100;
  const obligationCoverage = upcomingPayments <= 0 ? null : currentBalance / upcomingPayments;
  const debtLoad = accountBalance <= 0 ? 0 : (Math.abs(debtBalance) / accountBalance) * 100;
  const unallocatedShare = currentBalance === 0 ? 0 : (Math.abs(additionalExpenses) / Math.abs(currentBalance)) * 100;

  const indicators = [
    {
      label: "Свободные деньги",
      value: money(state.balances.freeMoney),
      hint: "Можно тратить после ближайших обязательств",
      icon: WalletCards,
      tone: Number(state.balances.freeMoney) >= 0 ? "good" : "risk"
    },
    {
      label: "Покрытие обязательств",
      value: obligationCoverage === null ? "Нет платежей" : `${formatDecimal(obligationCoverage)}×`,
      hint: "Сколько раз текущий баланс покрывает будущие платежи",
      icon: ShieldCheck,
      tone: obligationCoverage === null || obligationCoverage >= 1 ? "good" : "risk"
    },
    {
      label: "Долговая нагрузка",
      value: `${formatPercent(debtLoad)}`,
      hint: "Долги относительно денег на счетах",
      icon: AlertTriangle,
      tone: debtLoad >= 30 ? "risk" : debtLoad >= 15 ? "warn" : "good"
    },
    {
      label: "Исполнение плана",
      value: `${Math.round(planExecution)}%`,
      hint: "Доля уже выполненных доходов и платежей",
      icon: Target,
      tone: planExecution >= 70 ? "good" : planExecution >= 35 ? "warn" : "neutral"
    },
    {
      label: "Нераспределённое движение",
      value: `${formatPercent(unallocatedShare)}`,
      hint: "Расхождение факта и расчёта между сверками",
      icon: BadgePercent,
      tone: unallocatedShare <= 5 ? "good" : unallocatedShare <= 15 ? "warn" : "risk"
    },
    {
      label: "Чистая позиция",
      value: money(netBalance),
      hint: "Счета минус долги",
      icon: Activity,
      tone: netBalance >= 0 ? "good" : "risk"
    }
  ];

  return (
    <section>
      <div className="mb-3 px-6">
        <h2 className="text-[21px] font-extrabold text-[#8f8f95]">Финансовый пульс</h2>
        <p className="mt-1 text-sm font-semibold text-[#7f7f85]">Короткий чек-лист здоровья личных финансов.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {indicators.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-[24px] bg-[#2b2b2f] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Icon className={toneClass(item.tone)} size={21} />
                <span className={`h-2 w-2 rounded-full ${dotClass(item.tone)}`} />
              </div>
              <p className="text-[12px] font-bold leading-4 text-[#9a9aa0]">{item.label}</p>
              <p className="mt-1 text-[20px] font-extrabold tracking-[-0.04em] text-white">{item.value}</p>
              <p className="mt-2 text-[11px] font-semibold leading-4 text-[#77777d]">{item.hint}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);
}

function toneClass(tone: string) {
  if (tone === "risk") return "text-[#ff6b73]";
  if (tone === "warn") return "text-[#f2c45d]";
  if (tone === "good") return "text-[#32d178]";
  return "text-[#8bd3ff]";
}

function dotClass(tone: string) {
  if (tone === "risk") return "bg-[#ff6b73]";
  if (tone === "warn") return "bg-[#f2c45d]";
  if (tone === "good") return "bg-[#32d178]";
  return "bg-[#8bd3ff]";
}
