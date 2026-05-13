import { distributeUnallocatedMovement, type DashboardStateDto } from "@wallet/shared";
import { ArrowDownLeft, ArrowUpRight, Blend, CheckCircle2 } from "lucide-react";
import { money, shortDate } from "../../lib/format";

export function FinanceTimeline({ state }: { state: DashboardStateDto }) {
  const operationItems = state.operations.map((item) => ({
    id: item.id,
    title: item.name,
    amount: item.kind === "expense" || item.kind === "debt_repayment" ? -Number(item.amount) : Number(item.amount),
    date: item.operationDate,
    kind: item.kind,
    label: operationLabel(item.kind)
  }));
  const legacyItems = operationItems.length
    ? []
    : [
        ...state.income
          .filter((item) => item.actualDate && item.status.includes("received"))
          .map((item) => ({ id: item.id, title: item.name, amount: Number(item.amount), date: item.actualDate ?? item.effectiveDate, kind: "income" as const, label: "Фиксированная позиция" })),
        ...state.payments
          .filter((item) => item.actualDate && item.status.includes("paid"))
          .map((item) => ({ id: item.id, title: item.name, amount: -Number(item.amount), date: item.actualDate ?? item.effectiveDate, kind: "expense" as const, label: "Фиксированная позиция" }))
      ];
  const fixedItems = [...operationItems, ...legacyItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const additional = Number(state.balances.additionalExpenses);
  const hasPersistedUnallocated = state.operations.some((item) => item.kind === "unallocated");
  const distribution = !hasPersistedUnallocated && Math.abs(additional) > 0.009
    ? distributeUnallocatedMovement({
        amount: additional,
        to: state.latestSnapshot?.createdAt ?? new Date().toISOString(),
        maxDays: 31
      })
    : [];
  const hasDistributedMovement = distribution.length > 0;
  const dailyAmount = distribution[0]?.amount ?? "0.00";
  const distributedTitle = additional < 0 ? "Нераспределённые расходы" : "Дополнительные доходы";
  const distributedSummary = `${distribution.length} ${dayWord(distribution.length)} по ${money(dailyAmount)}`;

  if (fixedItems.length === 0 && !hasDistributedMovement) return null;

  return (
    <section>
      <div className="mb-3 px-6">
        <h2 className="text-[21px] font-extrabold text-[#8f8f95]">Таймлайн движения</h2>
        <p className="mt-1 text-sm font-semibold text-[#7f7f85]">Исполненные события идут точками, остальное распределяется между сверками.</p>
      </div>
      <div className="space-y-3">
        {fixedItems.map((item) => (
          <div key={item.id} className="wallet-row bg-[#232326]">
            <div className={`wallet-token ${item.kind === "income" ? "wallet-token--positive" : item.kind === "debt_repayment" || item.kind === "transfer" ? "wallet-token--action-soft" : "wallet-token--danger"}`}>
              {item.kind === "income" ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[18px] font-extrabold leading-snug text-white">{item.title}</p>
              <p className="text-[14px] font-semibold text-[#9a9aa0]">
                <span>{item.label}</span>
                <span> • {shortDate(item.date)}</span>
              </p>
            </div>
            <p className={`text-[17px] font-extrabold ${item.amount >= 0 ? "text-positive" : item.kind === "debt_repayment" || item.kind === "transfer" ? "text-action" : "text-danger"}`}>{money(item.amount)}</p>
          </div>
        ))}

        {hasDistributedMovement ? (
          <div className="wallet-row bg-[#232326]">
            <div className="wallet-token wallet-token--warning">
              <Blend size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[18px] font-extrabold leading-snug text-white">{distributedTitle}</p>
              <p className="text-[14px] font-semibold text-[#9a9aa0]">
                <span>{distributedSummary}</span>
                <span className="sr-only">Распределяется между сверками</span>
              </p>
            </div>
            <div className="text-right">
              <p className={`text-[17px] font-extrabold ${additional >= 0 ? "text-positive" : "text-danger"}`}>{money(additional)}</p>
              <CheckCircle2 className="ml-auto mt-1 text-amber" size={16} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function operationLabel(kind: string) {
  const labels: Record<string, string> = {
    income: "Доход",
    expense: "Расход",
    transfer: "Перевод",
    debt_repayment: "Погашение долга",
    adjustment: "Корректировка",
    unallocated: "Нераспределённое движение"
  };
  return labels[kind] ?? "Операция";
}

function dayWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}
