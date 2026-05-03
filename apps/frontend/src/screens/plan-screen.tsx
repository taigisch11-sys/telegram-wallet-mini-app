import { Check, WalletCards } from "lucide-react";
import { Badge } from "../components/common/badge";
import { Card } from "../components/common/card";
import { useWalletState } from "../hooks/use-state";
import { api } from "../lib/api";
import { money, shortDate } from "../lib/format";

export function PlanScreen({ wallet }: { wallet: ReturnType<typeof useWalletState> }) {
  async function markIncome(id: string) {
    await api.markIncome(id).catch(() => null);
    await wallet.refresh();
  }

  async function markPayment(id: string) {
    await api.markPayment(id).catch(() => null);
    await wallet.refresh();
  }

  return (
    <div className="space-y-3">
      <Card>
        <h2 className="mb-3 text-lg font-extrabold">Доходы</h2>
        {wallet.data.income.length === 0 ? <p className="rounded-md border border-line p-3 text-sm text-slate-400">Запланированных доходов пока нет.</p> : null}
        <div className="space-y-3">
          {wallet.data.income.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 ${item.status.includes("received") ? "opacity-55" : ""}`}>
              <WalletCards className="text-mint" size={20} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{item.name}</p>
                <p className="text-xs text-slate-500">{shortDate(item.effectiveDate)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{money(item.amount)}</p>
                <Badge status={item.status} />
              </div>
              {!item.status.includes("received") && item.status !== "cancelled" ? (
                <button className="grid h-9 w-9 place-items-center rounded-md bg-mint text-ink" onClick={() => void markIncome(item.id)} aria-label="Получено">
                  <Check size={17} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-extrabold">Платежи</h2>
        {wallet.data.payments.length === 0 ? <p className="rounded-md border border-line p-3 text-sm text-slate-400">Обязательных платежей пока нет.</p> : null}
        <div className="space-y-3">
          {wallet.data.payments.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 ${item.status.includes("paid") ? "opacity-55" : ""}`}>
              <WalletCards className={item.status === "overdue" ? "text-danger" : "text-amber"} size={20} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{item.name}</p>
                <p className="text-xs text-slate-500">{shortDate(item.effectiveDate)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{money(item.amount)}</p>
                <Badge status={item.status} />
              </div>
              {!item.status.includes("paid") && !["cancelled", "skipped"].includes(item.status) ? (
                <button className="grid h-9 w-9 place-items-center rounded-md bg-mint text-ink" onClick={() => void markPayment(item.id)} aria-label="Оплачено">
                  <Check size={17} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
