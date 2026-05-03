import type { DashboardStateDto } from "@wallet/shared";
import { ArrowDownLeft, ArrowUpRight, Blend, CheckCircle2 } from "lucide-react";
import { money, shortDate } from "../../lib/format";

export function FinanceTimeline({ state }: { state: DashboardStateDto }) {
  const fixedItems = [
    ...state.income
      .filter((item) => item.actualDate && item.status.includes("received"))
      .map((item) => ({ id: item.id, title: item.name, amount: Number(item.amount), date: item.actualDate ?? item.effectiveDate, kind: "income" as const })),
    ...state.payments
      .filter((item) => item.actualDate && item.status.includes("paid"))
      .map((item) => ({ id: item.id, title: item.name, amount: -Number(item.amount), date: item.actualDate ?? item.effectiveDate, kind: "payment" as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const additional = Number(state.balances.additionalExpenses);
  const hasDistributedMovement = Math.abs(additional) > 0.009;

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
            <div className={`wallet-token ${item.kind === "income" ? "bg-[#1f6f48] text-[#36d985]" : "bg-[#4a2028] text-[#ff6b73]"}`}>
              {item.kind === "income" ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[18px] font-extrabold text-white">{item.title}</p>
              <p className="text-[14px] font-semibold text-[#9a9aa0]">Фиксированная позиция • {shortDate(item.date)}</p>
            </div>
            <p className={`text-[17px] font-extrabold ${item.amount >= 0 ? "text-[#36d985]" : "text-[#ff6b73]"}`}>{money(item.amount)}</p>
          </div>
        ))}

        {hasDistributedMovement ? (
          <div className="wallet-row bg-[#232326]">
            <div className="wallet-token bg-[#34343a] text-[#8bd3ff]">
              <Blend size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[18px] font-extrabold text-white">Нераспределённое движение</p>
              <p className="text-[14px] font-semibold text-[#9a9aa0]">Распределяется между сверками</p>
            </div>
            <div className="text-right">
              <p className={`text-[17px] font-extrabold ${additional >= 0 ? "text-[#36d985]" : "text-[#ff6b73]"}`}>{money(additional)}</p>
              <CheckCircle2 className="ml-auto mt-1 text-[#8bd3ff]" size={16} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
